import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  describeTransportFailure,
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
  DELEGATE_MOUNT,
  DELEGATES_DIR,
  SERVER_PORT,
  SERVER_UNITS,
  synthesizeServerBuild,
  TREE_MOUNT,
  WORK_MOUNT,
} from './build.ts';
// In its own module rather than a local helper here, so it can be unit-tested: it is the one function in
// this directory whose job is to make a difference stop being reported, and in a tier where an absent
// artifact means "this case conforms" that makes it the most dangerous code present. See
// `stabilize.test.ts`, which drives it with adversarial bodies and asserts its guard's premise against the
// real case table rather than trusting a comment.
import { stabilizeFrameworkErrorBody } from './stabilize.ts';

/** Same gate as tier 4's other Docker legs. `deno task test:integration:controllers` sets this. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');

// Checked once, before the first container, rather than inside each `it`: a missing daemon should fail
// immediately, not after this file has already compiled a Gradle project.
if (enabled) await requireDocker();

if (enabled) {
  for (const unit of SERVER_UNITS) {
    describe(`integration/${unit.id}`, () => {
      it('answers every server case and records its deviations', async () => {
        const cases = casesFor(unit.profile, 'server');
        const image = await buildImage('kotlin', CONTEXT_DIR);
        const { settings, build } = synthesizeServerBuild(unit, TREE_MOUNT, DELEGATE_MOUNT);
        const workDir = await Deno.makeTempDir({ prefix: 'goast-server-' });

        // Per case, keyed by case id. Populated inside the container's lifetime and asserted after it,
        // so a failure to stop the container cannot leave assertions unrun.
        const responses = new Map<string, Awaited<ReturnType<typeof readResponse>>>();
        const failures = new Map<string, string>();

        try {
          await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
          await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

          const container = await startContainer({
            image,
            entrypoint: 'gradle',
            args: ['--no-daemon', '--offline', 'run', '--quiet'],
            mounts: [
              { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
              { source: DELEGATES_DIR, target: DELEGATE_MOUNT, readOnly: true },
              { source: workDir, target: WORK_MOUNT },
            ],
            workdir: WORK_MOUNT,
            publish: [{ containerPort: SERVER_PORT }],
          });

          try {
            const port = await container.hostPort(SERVER_PORT);
            // Gradle compiles the generated tree and the delegates before the app starts, so the first
            // request cannot be sent for a minute or more on a cold work directory.
            await waitForHttpReady(`http://127.0.0.1:${port}/__goast-readiness`, {
              timeoutMs: 8 * 60 * 1000,
              isAlive: () => container.running(),
              describeDeath: () => container.output(),
            });

            const baseUrl = `http://127.0.0.1:${port}`;
            for (const apiCase of cases) {
              // Sequential, in table order, and one request per case: that is what makes attribution
              // exact here, where the client direction had to attribute recorded requests by route
              // shape. Two cases sharing an operation (`updatePet/json` and `updatePet/form`) are told
              // apart by which response *this* call returned, not by anything the server records.
              try {
                responses.set(
                  apiCase.id,
                  stabilizeFrameworkErrorBody(await readResponse(await issueCase(baseUrl, apiCase))),
                );
              } catch (error) {
                // A transport-level failure is a result, not a reason to abandon the run: it is exactly
                // what a case whose request the server rejects at the connection level looks like, and
                // it must reach the artifact rather than aborting the other 18 cases.
                //
                // `describeTransportFailure` rather than `error.message`, matching the sibling
                // `easy-network-stub` leg: Deno reports every transport failure as `fetch failed` and puts
                // the text that says *which* failure one level down in `cause`, so the message alone
                // commits identical bytes for a server that refused the connection, one that closed it
                // mid-response, and a request that timed out. No committed artifact here changes — no
                // Spring unit has ever taken this branch (`grep -rl "no response at all" test/wire/`
                // matches only the two `easy-network-stub` files) — so this is fidelity for the first run
                // that does, not a rewrite of anything recorded.
                failures.set(apiCase.id, describeTransportFailure(error));
              }
            }

            // The server must still be up. If it died partway through, every case after that point
            // recorded a transport failure that says nothing about the generated code, and the whole
            // run's artifacts would be fiction.
            expect(container.running(), `the server exited during the run\n\n${container.output()}`).toBe(true);
          } finally {
            await container.stop();
          }
        } finally {
          // Best effort, never allowed to throw — see the note in `boot.test.ts`.
          await Deno.remove(workDir, { recursive: true }).catch((error: unknown) => {
            console.warn(`could not remove ${workDir}: ${error instanceof Error ? error.message : error}`);
          });
        }

        // Drift protection, the analogue of the client direction's reported-ids check: every case must
        // have produced either a response or a recorded transport failure.
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
            wireSnapshotFile(wireRootDir, unit.id, apiCase.id),
            formatDeviations(deviations),
            // The default this would otherwise print is `deno task test:integration`, which does not set
            // `GOAST_INTEGRATION` and therefore cannot regenerate a single artifact in this directory. A
            // check failure that tells you to run a command that silently does nothing is worse than one
            // that says nothing at all.
            { updateCommand: 'deno task test:integration:controllers' },
          );
        }
      });
    });
  }
}
