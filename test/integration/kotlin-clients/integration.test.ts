import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  diffRequest,
  diffResult,
  formatDeviations,
  repoRootDir,
  requireDocker,
  runContainer,
  startRefServer,
  verifyWireDeviations,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import { CASE_LINE_PREFIX, DRIVER_UNITS, parseCaseLines, synthesizeDriverBuild } from './build.ts';

/**
 * Tier 4's Kotlin leg is opt-in for the same reason tier 3 is
 * (`test/compile-tests/compile.test.ts:27`): `deno task test` must never start Docker on its own.
 * `deno task test:integration` sets this.
 */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');
const TREE_MOUNT = '/output';
const DRIVER_MOUNT = '/drivers';
const WORK_MOUNT = '/work';
const DRIVERS_DIR = join(repoRootDir, 'test', 'integration', 'kotlin-clients', 'drivers');

/**
 * Turns `/pets/{id}` into a pattern matching `/pets/` followed by *anything*, including embedded `/`
 * characters — unlike the reference server's own routing pattern (`ref-server.ts`'s `templateToPattern`),
 * which requires a placeholder to stay within one path segment. A generated client that fails to
 * percent-encode a `/` inside a path parameter produces exactly this shape: the static portions of the
 * template survive untouched, only the placeholder's segment boundary breaks. Used only to attribute a
 * surplus (unmatched-route) request back to the case whose malformed encoding plausibly produced it.
 */
function loosePathPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '.+');
  return new RegExp(`^${escaped}$`);
}

// Checked once, before the first container of the run, rather than inside each `it` — a missing Docker
// daemon should fail immediately and loudly, not after this file has already spun up a reference server.
if (enabled) await requireDocker();

if (enabled) {
  for (const unit of DRIVER_UNITS) {
    describe(`integration/${unit.id}`, () => {
      it('drives every client case and records its deviations', async () => {
        const cases = casesFor(unit.profile, 'client');
        // `0.0.0.0`, not loopback: the driver runs inside a container and reaches the server through
        // `host.docker.internal`, which only routes to an interface the host actually bound.
        const server = await startRefServer(cases, { hostname: '0.0.0.0' });

        let output: string;
        try {
          const image = await buildImage('kotlin', CONTEXT_DIR);
          const { settings, build } = synthesizeDriverBuild(unit, TREE_MOUNT, DRIVER_MOUNT);
          const workDir = await Deno.makeTempDir({ prefix: 'goast-driver-' });
          try {
            await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
            await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

            const result = await runContainer({
              image,
              // The image's own ENTRYPOINT hardcodes `gradle … compileKotlin` for tier 3; tier 4 needs a
              // different task entirely, so it replaces the entrypoint rather than appending to it.
              entrypoint: 'gradle',
              args: ['--no-daemon', '--offline', 'run', '--quiet'],
              mounts: [
                { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
                { source: DRIVERS_DIR, target: DRIVER_MOUNT, readOnly: true },
                { source: workDir, target: WORK_MOUNT },
              ],
              workdir: WORK_MOUNT,
              env: { GOAST_BASE_URL: `http://host.docker.internal:${server.port}` },
              hostGateway: true,
            });

            // A killed run's output is whatever happened to flush before the signal landed — neither
            // "clean" nor "these are all the case results" is a safe reading of it.
            if (result.timedOut) {
              throw new Error(
                `Gradle timed out running the ${unit.id} driver. Its output cannot be trusted as a ` +
                  `complete result.\n\n${result.stdout}${result.stderr}`,
              );
            }
            expect(result.code, `driver container exited ${result.code}\n${result.stdout}\n${result.stderr}`)
              .toBe(0);
            output = result.stdout + result.stderr;
          } finally {
            await Deno.remove(workDir, { recursive: true });
          }
        } finally {
          await server.close();
        }

        const reported = new Map<string, unknown>();
        for (const { caseId, result } of parseCaseLines(output)) reported.set(caseId, result);

        // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage. A driver
        // that dies before printing its `CASE_LINE_PREFIX` line for some case (rather than catching the
        // failure and reporting it, as every case here is written to do) trips this rather than being
        // silently absorbed into "no request received at all" below.
        expect([...reported.keys()].sort(), `no ${CASE_LINE_PREFIX} line for one or more cases`)
          .toEqual(cases.map((c) => c.id).sort());

        // Unlike `fetch-clients` (tier 4's TypeScript leg), a Kotlin call can fail *before it ever reaches
        // the network*: e.g. okhttp3's `uploadBlob` throws `UnsupportedOperationException` from
        // `ApiClient.requestBody()` while building the request body, and the reactive `uploadPetPhoto`
        // throws a `CodecException` ("No suitable writer found for part: file") from WebFlux's own
        // multipart encoder — neither ever opens a connection. Each such case's driver block still
        // reports a result (`runCase` catches the exception), so the drift check above still passes, but
        // no request ever lands at the reference server for it — neither as a match nor as a surplus 418.
        //
        // That breaks more than the `surplus.length === unmatchedCases.length` equality `fetch-clients`
        // relies on (its client always sends *something*, even when malformed): it also breaks
        // `fetch-clients`' arrival-order-equals-table-order pairing. A case earlier in table order that
        // never sends anything leaves a "hole", so a *later* case's malformed request can end up first in
        // `server.surplus` — measured directly against `spring-reactive-web-clients@sb3`, where
        // `uploadPetPhoto/ok` (table position 7) never sends a request at all, while `getEncoded/ok`
        // (position 19) sends one the server's route pattern rejects (an un-encoded `/` splits it into an
        // extra path segment) and lands in `surplus[0]` — the *only* surplus entry. Blind positional
        // pairing would have attributed that entry to `uploadPetPhoto/ok` instead, mislabeling both
        // cases' artifacts.
        //
        // So a surplus entry is attributed by matching its `(method, path)` against a case's own
        // `(method, pathTemplate)` — loosely, letting a `{placeholder}` swallow embedded `/` characters,
        // since that is exactly the kind of malformed request an un-encoded separator produces — rather
        // than by position. `unmatchedCases`' table order still matters for *which* candidate within one
        // shared route claims the next matching surplus entry (see `updatePet/json` and `updatePet/form`
        // both routing through `PUT /pets/{id}`), just not across different routes.
        const unmatchedCases = cases.filter((c) => !server.recorded.has(c.id));
        const surplusQueue = [...server.surplus];
        const attributedSurplus = new Map<string, (typeof surplusQueue)[number]>();
        for (const apiCase of unmatchedCases) {
          const pattern = loosePathPattern(apiCase.pathTemplate);
          const index = surplusQueue.findIndex((req) => req.method === apiCase.method && pattern.test(req.path));
          if (index === -1) continue;
          attributedSurplus.set(apiCase.id, surplusQueue[index]);
          surplusQueue.splice(index, 1);
        }

        // Whatever is left in `surplusQueue` matches no unmatched case's route at all — a stray retry, a
        // preflight, a duplicate call — and must not be silently folded into some other case's deviation
        // text.
        expect(
          surplusQueue.map((req) => `${req.method} ${req.path}`),
          "surplus request(s) matching no unmatched case's route",
        ).toEqual([]);

        for (const apiCase of cases) {
          const recorded = server.recorded.get(apiCase.id);
          const deviations = recorded === undefined
            ? [{
              field: 'request',
              expected: "one request matching this case's route",
              actual: (() => {
                const surplus = attributedSurplus.get(apiCase.id);
                if (surplus !== undefined) {
                  return `${surplus.method} ${surplus.path} matched no route (server answered 418)`;
                }
                // No surplus request explains this gap either: the driver's own reported result (already
                // proven to exist by the drift check above) is the only remaining evidence of what
                // actually happened, so it is folded into the deviation text here.
                return `no request received at all (driver reported ${JSON.stringify(reported.get(apiCase.id))})`;
              })(),
            }]
            : [
              ...diffRequest(apiCase.expectRequest, recorded),
              ...diffResult(apiCase.expectResult, reported.get(apiCase.id)),
            ];

          await verifyWireDeviations(wireSnapshotFile(wireRootDir, unit.id, apiCase.id), formatDeviations(deviations));
        }
      });
    });
  }
}
