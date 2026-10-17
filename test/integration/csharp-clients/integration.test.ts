import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

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

import { casesFor } from '../../cases/cases.ts';
import { CASE_LINE_PREFIX, DRIVER_PROJECT, DRIVER_UNITS, parseCaseLines, synthesizeDriverBuild } from './build.ts';

/**
 * Tier 4's C# leg is opt-in for the same reason tier 3 is: `pnpm test` must never start Docker on its own.
 * `pnpm test:integration:csharp` sets this.
 */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'csharp');
const TREE_MOUNT = '/output';
const DRIVER_MOUNT = '/drivers';
const SEED_MOUNT = '/seed';
const WORK_MOUNT = '/work';
const DRIVERS_DIR = join(repoRootDir, 'test', 'integration', 'csharp-clients', 'drivers');

// Checked once, before the first container of the run, rather than inside each `it` — a missing Docker
// daemon should fail immediately and loudly, not after this file has already spun up a reference server.
if (enabled) await requireDocker();

for (const unit of DRIVER_UNITS) {
  describe.skipIf(!enabled)(`integration/${unit.id}`, () => {
    it('drives every client case and records its deviations', async () => {
      const cases = casesFor(unit.profile, 'client');
      // `0.0.0.0`, not loopback: the driver runs inside a container and reaches the server through
      // `host.docker.internal`, which only routes to an interface the host actually bound.
      const server = await startRefServer(cases, { hostname: '0.0.0.0' });

      let output: string;
      try {
        const image = await buildImage('csharp', CONTEXT_DIR);
        const { project, nugetConfig } = synthesizeDriverBuild(unit, TREE_MOUNT, DRIVER_MOUNT);
        const seedDir = await mkdtemp(join(tmpdir(), 'goast-csharp-driver-'));
        try {
          await writeFile(join(seedDir, `${DRIVER_PROJECT}.csproj`), project);
          await writeFile(join(seedDir, 'nuget.config'), nugetConfig);

          const result = await runContainer({
            image,
            // The image ENTRYPOINT builds tier 3 solution; tier 4 copies the seed the same way and then
            // *runs* the driver project, so it replaces the entrypoint rather than appending to it.
            entrypoint: 'sh',
            args: [
              '-c',
              `cp -r ${SEED_MOUNT}/. ${WORK_MOUNT}/ && exec dotnet run --project ${WORK_MOUNT}/${DRIVER_PROJECT}.csproj -nologo`,
            ],
            mounts: [
              { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
              { source: DRIVERS_DIR, target: DRIVER_MOUNT, readOnly: true },
              { source: seedDir, target: SEED_MOUNT, readOnly: true },
            ],
            workdir: WORK_MOUNT,
            env: { GOAST_BASE_URL: `http://host.docker.internal:${server.port}` },
            hostGateway: true,
            timeoutMs: 15 * 60 * 1000,
          });

          // A killed run output is whatever happened to flush before the signal landed — neither
          // "clean" nor "these are all the case results" is a safe reading of it.
          if (result.timedOut) {
            throw new Error(
              `dotnet timed out running the ${unit.id} driver. Its output cannot be trusted as a ` +
                `complete result.\n\n${result.stdout}${result.stderr}`,
            );
          }
          expect(result.code, `driver container exited ${result.code}\n${result.stdout}\n${result.stderr}`).toBe(0);
          output = result.stdout + result.stderr;
        } finally {
          await rm(seedDir, { recursive: true, force: true }).catch((error: unknown) => {
            console.warn(`could not remove ${seedDir}: ${error instanceof Error ? error.message : error}`);
          });
        }
      } finally {
        await server.close();
      }

      const lines = parseCaseLines(output);
      const reported = new Map<string, unknown>();
      for (const { caseId, result } of lines) reported.set(caseId, result);

      // A `Map` keeps only the last result for a repeated id, and the key-set check below compares
      // *distinct* ids — comparing the two sizes is what makes a duplicated id loud.
      expect(lines.length, `duplicate ${CASE_LINE_PREFIX} case id(s)`).toBe(reported.size);

      // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage.
      expect([...reported.keys()].sort(), `no ${CASE_LINE_PREFIX} line for one or more cases`).toEqual(
        cases.map((c) => c.id).sort(),
      );

      // A generated client can send a request the reference server route pattern does not recognize
      // (it lands in `server.surplus` with a 418 instead of the case queue). That is an attributable
      // deviation, folded into the affected case below. What stays a hard failure is a surplus count
      // that differs from the number of unmatched cases: a request went missing, or a stray one
      // appeared, for a reason this loop cannot attribute.
      const unmatchedCases = cases.filter((c) => !server.recorded.has(c.id));
      expect(server.surplus.length, 'unattributed surplus request(s)').toBe(unmatchedCases.length);
      const surplusQueue = [...server.surplus];

      // Pairing unmatched cases (table order) against `surplusQueue.shift()` (arrival order) is correct
      // because the driver issues its calls in `casesFor` table order, so the two orders coincide.
      for (const apiCase of cases) {
        const recorded = server.recorded.get(apiCase.id);
        let deviations: Deviation[];

        if (recorded !== undefined) {
          deviations = [
            ...diffRequest(apiCase.expectRequest, recorded),
            ...diffResult(apiCase.expectResult, reported.get(apiCase.id)),
          ];
        } else {
          const unmatched = surplusQueue.shift();
          deviations =
            unmatched === undefined
              ? [
                  {
                    field: 'request',
                    expected: "one request matching this case's route",
                    actual: `no request received at all (driver reported ${JSON.stringify(reported.get(apiCase.id))})`,
                  },
                ]
              : [
                  {
                    field: 'request',
                    expected: "one request matching this case's route",
                    actual: `${unmatched.method} ${unmatched.path} matched no route (server answered 418)`,
                  },
                  // The rest of the request is compared too: a route mismatch is one of several things that
                  // can be wrong with it, and an absent deviation in a committed artifact reads as conformance.
                  ...diffRequest(apiCase.expectRequest, unmatched),
                ];
        }

        await verifyWireDeviations(wireSnapshotFile(wireRootDir, unit.id, apiCase.id), formatDeviations(deviations), {
          updateCommand: 'pnpm test:integration:csharp',
        });
      }
    });
  });
}
