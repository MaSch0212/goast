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

import { casesFor, type RecordedResponse } from '../../cases/cases.ts';
import {
  DELEGATE_MOUNT,
  DELEGATES_DIR,
  SERVER_PORT,
  SERVER_UNITS,
  synthesizeServerBuild,
  TREE_MOUNT,
  WORK_MOUNT,
} from './build.ts';

/** Same gate as tier 4's other Docker legs. `deno task test:integration:controllers` sets this. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');

/**
 * Every attribute Spring's default error body carries, and therefore the fingerprint that identifies one.
 *
 * `DefaultErrorAttributes` populates exactly these five for a WebFlux error response, and no schema in
 * the kitchen-sink corpus declares a property named `timestamp` or `requestId` — so requiring the whole
 * set to be present is what keeps {@link stabilizeFrameworkErrorBody} from ever touching a body the
 * generated code actually produced.
 */
const FRAMEWORK_ERROR_ATTRIBUTES = ['timestamp', 'path', 'status', 'error', 'requestId'] as const;

/** What replaces a framework error attribute whose value varies from run to run. */
const NONDETERMINISTIC = '<nondeterministic>';

/**
 * Normalizes the two run-to-run-varying fields of Spring's *own* error body, leaving everything else —
 * including the status, which is the actual deviation — exactly as it arrived.
 *
 * `GoastExceptionHandler` exists to keep framework error bodies out of the committed artifacts, and for
 * every failure a delegate can raise it succeeds. It cannot cover the one class of failure that never
 * reaches a delegate: WebFlux rejects `updatePet/form` with `415` during argument resolution, *before*
 * the generated controller's `try` block runs, so the generated `catch` never sees it and no handler of
 * ours is consulted. What comes back is `DefaultErrorAttributes`' own JSON, whose `timestamp` is the
 * wall clock and whose `requestId` is a per-connection identifier — measured churning across two runs of
 * `@sb3-strict` while the other six artifacts stayed byte-identical.
 *
 * This is deliberately a *value* substitution and not a key removal, and it is deliberately scoped by
 * {@link FRAMEWORK_ERROR_ATTRIBUTES} rather than applied to every response: the artifact must still show
 * that Spring answered with its own error shape rather than the delegate's, because "the request never
 * reached the delegate" is a materially different finding from "the delegate answered wrongly". Same
 * reasoning as `IGNORED_HEADERS` in `wire.ts` — drop what the runtime controls, never what the generator
 * controls.
 */
function stabilizeFrameworkErrorBody(response: RecordedResponse): RecordedResponse {
  const { body } = response;
  if (body.kind !== 'json' || body.value === null || typeof body.value !== 'object' || Array.isArray(body.value)) {
    return response;
  }

  const attributes = body.value as Record<string, unknown>;
  if (!FRAMEWORK_ERROR_ATTRIBUTES.every((name) => name in attributes)) return response;

  return {
    ...response,
    body: {
      kind: 'json',
      value: { ...attributes, timestamp: NONDETERMINISTIC, requestId: NONDETERMINISTIC },
    },
  };
}

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
                failures.set(apiCase.id, error instanceof Error ? error.message : String(error));
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
          );
        }
      });
    });
  }
}
