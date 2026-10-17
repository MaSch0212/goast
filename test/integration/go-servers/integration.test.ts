/**
 * Tier 4's `go-servers` case loop: drives every server case against the generated `net/http` server running
 * in the container, and commits one deviation artifact per case that misbehaves.
 *
 * Model: `test/integration/easy-network-stub/integration.test.ts`. Same direction — a generated server driven
 * by the host's reference client (`issueCase`) and compared with `diffResponse` — and the same structure:
 * responses are collected inside the container's lifetime and asserted after it, and a transport failure is
 * recorded as a result rather than thrown.
 *
 * **No body stabilizer.** Everything the server writes is either the case's own response or an error message
 * built from the request and the case table, so an artifact that churned between runs would be a finding.
 *
 * **The driver's mismatch channel is probed before any artifact is written.** The services answer a value
 * the generated decoder bound wrongly with `599`; a request no case sends must therefore come back as `599`.
 * Without that probe a driver that never asserted anything would record every case as conforming.
 */
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

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
  buildCommand,
  DRIVER_DIR,
  DRIVER_MOUNT,
  PROFILE,
  READINESS_PATH,
  SERVER_PORT,
  TREE_DIR,
  TREE_MOUNT,
} from './build.ts';

/** Same gate as tier 4's other Docker legs. `pnpm test:integration:go` sets this. */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

/** The tier-3 image: Go and a warm standard-library build cache, which is all the server needs. */
const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'go');

// Checked once, before the first container: a missing daemon should fail immediately.
if (enabled) await requireDocker();

describe.skipIf(!enabled)(`integration/${PROFILE}`, () => {
  it('answers every server case and records its deviations', async () => {
    const cases = casesFor(PROFILE, 'server');
    const image = await buildImage('go', CONTEXT_DIR);

    const responses = new Map<string, Awaited<ReturnType<typeof readResponse>>>();
    const failures = new Map<string, string>();
    let probe: { status: number; body: string } | undefined;

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
      // `go build` compiles the generated package and the driver before the server binds.
      await waitForHttpReady(`http://127.0.0.1:${port}${READINESS_PATH}`, {
        timeoutMs: 5 * 60 * 1000,
        isAlive: () => container.running(),
        describeDeath: () => container.output(),
      });

      const baseUrl = `http://127.0.0.1:${port}`;
      for (const apiCase of cases) {
        // Sequential, in table order, one request per case: cases sharing an operation are told apart by
        // which response this call returned.
        try {
          responses.set(apiCase.id, await readResponse(await issueCase(baseUrl, apiCase)));
        } catch (error) {
          failures.set(apiCase.id, describeTransportFailure(error));
        }
      }

      const response = await fetch(`${baseUrl}/widgets/no-such-case`);
      probe = { status: response.status, body: await response.text() };

      // If the server died partway through, every later case recorded a failure that says nothing about the
      // generated code.
      expect(container.running(), `the server exited during the run\n\n${container.output()}`).toBe(true);
    } finally {
      await container.stop();
    }

    expect(probe).toEqual({
      status: 599,
      body: 'MISMATCH getWidget.id was <no-such-case>, which no case declares',
    });

    // Drift protection: every case must have produced either a response or a recorded transport failure.
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
        wireSnapshotFile(wireRootDir, PROFILE, apiCase.id),
        formatDeviations(deviations),
        // `pnpm test:integration` does not set `GOAST_INTEGRATION`, so it cannot regenerate these artifacts.
        { updateCommand: 'pnpm test:integration:go' },
      );
    }
  });
});
