import { describe, expect, it } from 'vitest';

import {
  describeTransportFailure,
  diffResponse,
  formatDeviations,
  issueCase,
  readResponse,
  requireDocker,
  verifyWireDeviations,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import { SERVER_UNITS } from './build.ts';
import { withServer } from './server.ts';

/** Same gate as tier 4's other Docker legs. `pnpm test:integration:csharp-servers` sets this. */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

// Checked once, before the first container, rather than inside each `it`: a missing daemon should fail
// immediately, not after this file has already compiled a project.
if (enabled) await requireDocker();

for (const unit of SERVER_UNITS) {
  describe.skipIf(!enabled)(`integration/${unit.id}`, () => {
    it(
      'answers every server case and records its deviations',
      async () => {
        const cases = casesFor(unit.profile, 'server');

        // Per case, keyed by case id. Populated inside the container's lifetime and asserted after it, so a failure
        // to stop the container cannot leave assertions unrun.
        const responses = new Map<string, Awaited<ReturnType<typeof readResponse>>>();
        const failures = new Map<string, string>();

        await withServer(unit, async (baseUrl, container) => {
          for (const apiCase of cases) {
            // Sequential, in table order, one request per case: attribution is exact, and cases sharing an operation
            // (`updatePet/json` and `updatePet/form`) are told apart by which response *this* call returned.
            try {
              responses.set(apiCase.id, await readResponse(await issueCase(baseUrl, apiCase)));
            } catch (error) {
              // A transport-level failure is a result, not a reason to abandon the run.
              failures.set(apiCase.id, describeTransportFailure(error));
            }
          }

          // The server must still be up: if it died partway through, every later case recorded a transport failure
          // that says nothing about the generated code.
          expect(container.running(), `the server exited during the run\n\n${container.output()}`).toBe(true);
        });

        expect([...responses.keys(), ...failures.keys()].sort(), 'a case was never driven').toEqual(
          cases.map((c) => c.id).sort(),
        );

        for (const apiCase of cases) {
          const response = responses.get(apiCase.id);
          const deviations =
            response === undefined
              ? [
                  {
                    field: 'response',
                    expected: `status ${apiCase.response.status}`,
                    actual: `no response at all (${failures.get(apiCase.id)})`,
                  },
                ]
              : diffResponse(apiCase.response, response);

          await verifyWireDeviations(
            wireSnapshotFile(wireRootDir, unit.id, apiCase.id),
            formatDeviations(deviations),
            // The default would print `pnpm test:integration`, which does not set `GOAST_INTEGRATION` and cannot
            // regenerate a single artifact in this directory.
            { updateCommand: 'pnpm test:integration:csharp-servers' },
          );
        }
      },
      20 * 60 * 1000,
    );
  });
}
