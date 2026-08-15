/**
 * Tier 4's `easy-network-stub` case loop: drives every server case against the generated stubs running in
 * the container, and commits one deviation artifact per case that misbehaves.
 *
 * Model: `test/integration/spring-controllers/integration.test.ts`. Same direction — a generated server
 * driven by the host's reference client (`issueCase`) and compared with `diffResponse` — so the two
 * structural decisions that file states for measured reasons are preserved here:
 *   - **Responses are collected inside the container's lifetime and asserted after it**, so a failure to
 *     stop the container cannot leave assertions unrun.
 *   - **A transport-level failure is recorded as a result, not thrown.** That matters more in this leg
 *     than in the Spring one: `easy-network-stub` answers an unmatched route by *destroying the socket*
 *     (`failBecauseOfNotOrWrongMockedRoute`), so a case whose path its route matcher cannot match has no
 *     response at all — measured, and reproduced by `boot.test.ts`'s `abc%20def` probe. Throwing there
 *     would abandon the other 18 cases and record nothing for any of them.
 *
 * **No body stabilizer, deliberately.** The Spring leg needs one because WebFlux's default error body
 * carries a `timestamp` and a `requestId` that change every run. Nothing here renders anything the driver
 * did not hand it: the generated responder returns `{statusCode, content}`, `driver/expectations.ts`
 * builds its own `599`/`598` messages from case-table constants, and `adapter.ts` writes exactly what it
 * is given. An artifact that churned between two runs would be a finding about this leg, not something to
 * normalize away — which is why Step 4 of this leg's task runs `:check` twice.
 *
 * **The registration report is asserted before any artifact is written**, and that ordering is the point.
 * `stubPathStyleSimple` is *expected* to fail registration (the library rejects array route parameters
 * outright), so registration cannot be a crash — but a second registration starting to fail would show up
 * in the case loop only as an extra transport failure, which on the wire is indistinguishable from a route
 * the matcher could not match. Asserting the exact failed set first means a run whose premise has changed
 * fails loudly instead of committing a plausible-looking artifact that blames the generator for a route
 * that was never registered at all.
 */
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  diffResponse,
  formatDeviations,
  issueCase,
  readResponse,
  repoRootDir,
  requireDocker,
  startContainer,
  verifyWireDeviations,
  waitForHttpReady,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import {
  buildCommand,
  DRIVER_DIR,
  DRIVER_MOUNT,
  PROFILE,
  READINESS_PATH,
  SERVER_PORT,
  TREE_DIR,
  TREE_MOUNT,
} from './build.ts';

/** Same gate as tier 4's other Docker legs. `deno task test:integration:stubs` sets this. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

/** Prefix `driver/server.ts` prints each `registerAll` report line under. Also parsed by `boot.test.ts`. */
const REGISTRATION_MARKER = '##REGISTRATION##';

/**
 * The registrations that must fail, and the only ones allowed to.
 *
 * `stubPathStyleSimple`'s generated route is `styles/{values:string[]}` and the library rejects array
 * route parameters synchronously while registering (measured). Asserted as an exact set rather than
 * "contains", so a registration that starts failing cannot hide behind the one that is expected to.
 */
const EXPECTED_REGISTRATION_FAILURES = [
  'pathStyleSimple: FAILED Array parameters are not supported for route parameters.',
];

/** Pulls the `##REGISTRATION##` report out of the container's own output. */
function registrationReport(output: string): string[] {
  return output
    .split('\n')
    .filter((line) => line.includes(REGISTRATION_MARKER))
    .map((line) => line.slice(line.indexOf(REGISTRATION_MARKER) + REGISTRATION_MARKER.length).trim());
}

// Checked once, before the first container, rather than inside the `it`: a missing daemon should fail
// immediately, not after this file has already built an image.
if (enabled) await requireDocker();

if (enabled) {
  describe(`integration/${PROFILE}`, () => {
    it('answers every server case and records its deviations', async () => {
      const cases = casesFor(PROFILE, 'server');
      const image = await buildImage('node', CONTEXT_DIR);

      // Per case, keyed by case id. Populated inside the container's lifetime and asserted after it, so a
      // failure to stop the container cannot leave assertions unrun.
      const responses = new Map<string, Awaited<ReturnType<typeof readResponse>>>();
      const failures = new Map<string, string>();
      let registration: string[] = [];

      const container = await startContainer({
        image,
        entrypoint: 'sh',
        args: ['-c', buildCommand()],
        mounts: [
          { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
          { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
        ],
        publish: [{ containerPort: SERVER_PORT }],
      });

      try {
        const port = await container.hostPort(SERVER_PORT);
        // `tsc` compiles the whole generated tree before the server binds, so the first request cannot be
        // sent for tens of seconds on a cold container.
        await waitForHttpReady(`http://127.0.0.1:${port}${READINESS_PATH}`, {
          timeoutMs: 5 * 60 * 1000,
          isAlive: () => container.running(),
          describeDeath: () => container.output(),
        });

        // Read before the first request: the report is printed during start-up, so by the time readiness
        // answered it is already complete.
        registration = registrationReport(container.output());

        const baseUrl = `http://127.0.0.1:${port}`;
        for (const apiCase of cases) {
          // Sequential, in table order, one request per case: that is what makes attribution exact. Two
          // cases sharing an operation (`updatePet/json` and `updatePet/form`, and the five `getWidget`
          // cases) are told apart by which response *this* call returned, not by anything the server
          // records.
          try {
            responses.set(apiCase.id, await readResponse(await issueCase(baseUrl, apiCase)));
          } catch (error) {
            // See this file's header: an unmatched route destroys the socket here, so a transport failure
            // is a measurement, not a reason to abandon the run.
            failures.set(apiCase.id, error instanceof Error ? error.message : String(error));
          }
        }

        // The server must still be up. If it died partway through, every case after that point recorded a
        // transport failure that says nothing about the generated code, and the whole run's artifacts
        // would be fiction. Load-bearing in this leg specifically: `destroy()` is a normal outcome here,
        // and a `destroy()` that took the process down with it would look identical per case.
        expect(container.running(), `the server exited during the run\n\n${container.output()}`).toBe(true);
      } finally {
        await container.stop();
      }

      // One line per generated stub, and exactly one failure — see this file's header for why this is
      // asserted before a single artifact is written.
      expect(registration.length, `the registration report is incomplete\n\n${registration.join('\n')}`).toBe(12);
      expect(registration.filter((line) => line.includes('FAILED'))).toEqual(EXPECTED_REGISTRATION_FAILURES);

      // Drift protection, the analogue of the client direction's reported-ids check: every case must have
      // produced either a response or a recorded transport failure.
      expect([...responses.keys(), ...failures.keys()].sort(), 'a case was never driven')
        .toEqual(cases.map((c) => c.id).sort());

      for (const apiCase of cases) {
        const response = responses.get(apiCase.id);
        const deviations = response === undefined
          ? [{
            field: 'response',
            expected: `status ${apiCase.response.status}`,
            actual: `no response at all (${failures.get(apiCase.id)})`,
          }]
          : diffResponse(apiCase.response, response);

        await verifyWireDeviations(
          wireSnapshotFile(wireRootDir, PROFILE, apiCase.id),
          formatDeviations(deviations),
          // The default this would otherwise print is `deno task test:integration`, which does not set
          // `GOAST_INTEGRATION` and therefore cannot regenerate a single artifact in this directory. A
          // check failure that tells you to run a command that silently does nothing is worse than one
          // that says nothing at all.
          { updateCommand: 'deno task test:integration:stubs' },
        );
      }
    });
  });
}
