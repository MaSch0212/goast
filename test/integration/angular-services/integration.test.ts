import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  type Deviation,
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

import { type ApiCase, casesFor, type RecordedRequest } from '../../cases/cases.ts';
import {
  buildCommand,
  DRIVER_DIR,
  DRIVER_MOUNT,
  driverTsConfig,
  OUT_DIR,
  PROFILE,
  TREE_DIR,
  TREE_MOUNT,
} from './build.ts';

/**
 * Tier 4's Angular leg is opt-in for the same reason the Kotlin leg and tier 3 are
 * (`test/integration/kotlin-clients/integration.test.ts:29`): `deno task test` must never start Docker
 * on its own. `deno task test:integration:angular` sets this.
 */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

/** Prefix the driver stamps on every case line (`driver/driver.ts`). */
const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Parses the driver's `##GOAST-CASE##` lines out of a container log.
 *
 * Only lines carrying the prefix are considered; `tsc`'s own output, `sed`'s, and Node's warnings share
 * the same stream. A prefixed line that is not JSON is a hard error rather than a skip — silently
 * dropping it would shrink coverage into the drift check's "no line for this case" branch and read as a
 * missing call instead of as a broken driver.
 *
 * Kept local rather than added to `build.ts`: `build.ts` is the *container-side build* module and is
 * frozen for this task, whereas the Kotlin leg's equivalent (`kotlin-clients/build.ts:213`) lives beside
 * its own driver synthesis for historical reasons.
 */
function parseCaseLines(output: string): { caseId: string; result: unknown }[] {
  const parsed: { caseId: string; result: unknown }[] = [];
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(CASE_LINE_PREFIX)) continue;
    const payload = trimmed.slice(CASE_LINE_PREFIX.length);
    try {
      parsed.push(JSON.parse(payload) as { caseId: string; result: unknown });
    } catch (cause) {
      throw new Error(`Malformed ${CASE_LINE_PREFIX} line, could not parse as JSON: ${trimmed}`, { cause });
    }
  }
  return parsed;
}

// --- Surplus attribution ----------------------------------------------------------------------------
// The three functions below are copied verbatim in behaviour from
// `test/integration/kotlin-clients/integration.test.ts` (the original; its doc comments carry the
// measurements that justify the two-pass order). They are duplicated rather than shared because the
// Kotlin leg's committed artifacts must stay byte-identical and refactoring it is out of this task's
// scope. A THIRD copy is the point at which these belong in a shared test-side module.

/**
 * Turns `/pets/{id}` into a pattern requiring a placeholder to stay within one path segment — the same
 * rule the reference server's own routing pattern uses (`ref-server.ts`'s `templateToPattern`). Tried
 * first, in {@link attributeSurplus} below, because it cannot conflate two *different* declared routes:
 * a strict single-segment match never swallows a trailing static segment another route requires (e.g.
 * `/pets/{id}` never matches `/pets/abc/photo`, which belongs to `/pets/{id}/photo`).
 */
function strictPathPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

/**
 * Turns `/pets/{id}` into a pattern matching `/pets/` followed by *anything*, including embedded `/`
 * characters. A generated client that fails to percent-encode a `/` inside a path parameter produces
 * exactly this shape: the static portions of the template survive untouched, only the placeholder's
 * segment boundary breaks.
 *
 * Deliberately only a fallback, tried after {@link strictPathPattern} finds no match: on its own this
 * pattern is not route-safe (`/pets/{id}` loosely matches `/pets/abc/photo` too), so using it first
 * could, for some future pair of routes, attribute a surplus request to the wrong case.
 */
function loosePathPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '.+');
  return new RegExp(`^${escaped}$`);
}

/**
 * Attributes each surplus (unmatched-route) request to the unmatched case whose route plausibly produced
 * it, and removes attributed entries from `surplusQueue` in place.
 *
 * Two passes, not one: {@link strictPathPattern} runs first over every unmatched case, so a request that
 * merely hit the wrong-but-well-formed route is never stolen by a looser pattern that happens to overlap
 * it. Only once every case has had its strict shot does {@link loosePathPattern} run over whatever is
 * left, to catch the one shape strict matching cannot — a placeholder's segment boundary breaking
 * because a generated client failed to percent-encode an embedded `/`.
 *
 * Within either pass, `unmatchedCases`' table order still decides which candidate among several sharing
 * one route (`updatePet/json`/`updatePet/form`, both `PUT /pets/{id}`) claims the next matching entry —
 * `server.surplus` preserves arrival order, and the driver issues calls in table order, so the two
 * orders coincide within one route.
 */
function attributeSurplus(
  unmatchedCases: readonly ApiCase[],
  surplusQueue: RecordedRequest[],
): Map<string, RecordedRequest> {
  const attributed = new Map<string, RecordedRequest>();
  for (const pattern of [strictPathPattern, loosePathPattern]) {
    for (const apiCase of unmatchedCases) {
      if (attributed.has(apiCase.id)) continue;
      const route = pattern(apiCase.pathTemplate);
      const index = surplusQueue.findIndex((req) => req.method === apiCase.method && route.test(req.path));
      if (index === -1) continue;
      attributed.set(apiCase.id, surplusQueue[index]);
      surplusQueue.splice(index, 1);
    }
  }
  return attributed;
}

// Checked once, before the first container of the run, rather than inside the `it` — a missing Docker
// daemon should fail immediately and loudly, not after this file has already spun up a reference server.
if (enabled) await requireDocker();

if (enabled) {
  describe(`integration/${PROFILE}`, () => {
    it('drives every client case and records its deviations', async () => {
      const cases = casesFor(PROFILE, 'client');
      // `0.0.0.0`, not loopback: the driver runs inside a container and reaches the server through
      // `host.docker.internal`, which only routes to an interface the host actually bound.
      const server = await startRefServer(cases, { hostname: '0.0.0.0' });

      let output: string;
      try {
        const image = await buildImage('node', CONTEXT_DIR);
        // Same invocation shape as `smoke.test.ts`: the image's ENTRYPOINT is tier 3's type-check
        // script, so this leg replaces it with a shell pipeline that writes the tsconfig, compiles,
        // then runs the emitted driver against the host-side reference server.
        const result = await runContainer({
          image,
          entrypoint: 'sh',
          args: [
            '-c',
            `mkdir -p ${OUT_DIR} && printf '%s' '${
              driverTsConfig().replaceAll("'", "'\\''")
            }' > ${OUT_DIR}/tsconfig.json && ` +
            `${buildCommand()} && node ${OUT_DIR}/driver/driver.js http://host.docker.internal:${server.port}`,
          ],
          mounts: [
            { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
            { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
          ],
          hostGateway: true,
        });

        // Asserted before the exit code: a killed run's output is whatever happened to flush before the
        // signal landed, so neither "clean" nor "these are all the case results" is a safe reading of
        // it, and a timeout that surfaced as a non-zero exit code would be misreported as a driver
        // failure.
        expect(result.timedOut, `the container timed out\n${result.stdout}${result.stderr}`).toBe(false);
        expect(result.code, `driver container exited ${result.code}\n${result.stdout}\n${result.stderr}`)
          .toBe(0);
        output = result.stdout + result.stderr;
      } finally {
        await server.close();
      }

      const lines = parseCaseLines(output);
      const reported = new Map<string, unknown>();
      for (const { caseId, result } of lines) reported.set(caseId, result);

      // `parseCaseLines` returns a list; this `Map` keeps only the last result for a repeated id, and
      // the key-set check below compares *distinct* ids — so 20 lines covering 19 ids would satisfy it
      // with one result silently discarded. Comparing the two sizes is what makes a duplicated id loud.
      expect(lines.length, `duplicate ${CASE_LINE_PREFIX} case id(s)`).toBe(reported.size);

      // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage. A driver that
      // dies before printing its `CASE_LINE_PREFIX` line for some case (rather than catching the failure
      // and reporting it, as `runCase` is written to do) trips this rather than being silently absorbed
      // into "no request received at all" below.
      expect([...reported.keys()].sort(), `no ${CASE_LINE_PREFIX} line for one or more cases`)
        .toEqual(cases.map((c) => c.id).sort());

      // Like the Kotlin legs and unlike `fetch-clients`, an Angular call can fail *before it ever
      // reaches the network* — `HttpClient` validates and serializes on the calling thread, and the
      // generated `RequestBuilder` runs entirely there too — so "no request recorded" cannot be assumed
      // to mean "a malformed request arrived as surplus". That breaks `fetch-clients`' assumption that
      // surplus arrival order equals table order among unmatched cases, so surplus requests are
      // attributed by route shape instead of by position — see {@link attributeSurplus}.
      const unmatchedCases = cases.filter((c) => !server.recorded.has(c.id));
      const surplusQueue = [...server.surplus];
      const attributedSurplus = attributeSurplus(unmatchedCases, surplusQueue);

      // Whatever is left in `surplusQueue` matches no unmatched case's route at all — a stray retry, a
      // preflight, a duplicate call — and must not be silently folded into some other case's deviation
      // text.
      expect(
        surplusQueue.map((req) => `${req.method} ${req.path}`),
        "surplus request(s) matching no unmatched case's route",
      ).toEqual([]);

      for (const apiCase of cases) {
        const recorded = server.recorded.get(apiCase.id);
        let deviations: Deviation[];

        if (recorded !== undefined) {
          deviations = [
            ...diffRequest(apiCase.expectRequest, recorded),
            ...diffResult(apiCase.expectResult, reported.get(apiCase.id)),
          ];
        } else {
          const surplus = attributedSurplus.get(apiCase.id);
          deviations = surplus === undefined
            ? [{
              field: 'request',
              expected: "one request matching this case's route",
              // No surplus request explains this gap either: the driver's own reported result (already
              // proven to exist by the drift check above) is the only remaining evidence of what
              // actually happened, so it is folded into the deviation text here.
              actual: `no request received at all (driver reported ${JSON.stringify(reported.get(apiCase.id))})`,
            }]
            : [
              {
                field: 'request',
                expected: "one request matching this case's route",
                actual: `${surplus.method} ${surplus.path} matched no route (server answered 418)`,
              },
              // A route mismatch is *one* thing wrong with a request that can be wrong in several ways
              // at once, so the rest of the request is compared here too rather than discarded. That
              // was a real bug on the fetch and Kotlin legs: reporting only method and path understated
              // what the client got wrong, and an absent deviation in a committed artifact reads as
              // conformance. `diffRequest` re-reports `path`, which the line above already names —
              // repeating one field in a diagnostic costs a reader nothing; omitting a field costs them
              // the truth.
              ...diffRequest(apiCase.expectRequest, surplus),
            ];
        }

        await verifyWireDeviations(
          wireSnapshotFile(wireRootDir, PROFILE, apiCase.id),
          formatDeviations(deviations),
          // Not the default `deno task test:integration`: that task does not set `GOAST_INTEGRATION`,
          // so it cannot regenerate a single artifact in this directory. Naming a command that
          // silently does nothing is worse than naming none.
          { updateCommand: 'deno task test:integration:angular' },
        );
      }
    });
  });
}
