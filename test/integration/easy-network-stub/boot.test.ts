/**
 * Tier 4's Docker risk gate for the `easy-network-stub` leg: proves the generated stubs come up as a
 * real HTTP server and answer, before the full case loop (a later task) is worth writing.
 *
 * Model: `test/integration/spring-controllers/boot.test.ts`. Both legs drive a generated **server**
 * with real HTTP requests from the host, so the gate shape is the same — build the image, start the
 * container, wait for readiness, probe a handful of load-bearing behaviours, and assert the container
 * is still alive afterward.
 *
 * The probes below are exactly the adapter's four load-bearing behaviours, each measured against the
 * real image and the real committed tree:
 *   - A route the generated stubs register answers through the generated responder (method upper-cased,
 *     raw path matched suffix-anchored).
 *   - A route param the default `([\w-_~.]+)` matcher cannot match (a percent-encoded space) makes the
 *     library destroy the socket without replying, which must surface to `fetch` as a transport failure,
 *     not as a response with some status code.
 *   - The container survives that destroyed socket: a `destroy()` that took the process down with it
 *     would make every later case in the real loop record a failure that says nothing about the
 *     generator.
 */
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, startContainer, waitForHttpReady } from '@goast/test-harness';

import { buildCommand, DRIVER_DIR, DRIVER_MOUNT, READINESS_PATH, SERVER_PORT, TREE_DIR, TREE_MOUNT } from './build.ts';

/** Same gate as the rest of tier 4's Docker legs: `deno task test` must never start a container. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';
const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

if (enabled) await requireDocker();

if (enabled) {
  describe('integration/easy-network-stub boot', () => {
    it('serves the generated stubs over HTTP', async () => {
      const image = await buildImage('node', CONTEXT_DIR);
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
        // `tsc` compiles the whole generated tree before the server binds, so the first probe cannot
        // be sent for tens of seconds on a cold container.
        await waitForHttpReady(`http://127.0.0.1:${port}${READINESS_PATH}`, {
          timeoutMs: 5 * 60 * 1000,
          isAlive: () => container.running(),
          describeDeath: () => container.output(),
        });

        // A route the generated stubs register, answered through the generated responder.
        const ok = await fetch(`http://127.0.0.1:${port}/api/pets/abc`);
        expect(ok.status).toBe(200);
        expect(await ok.json()).toEqual({ id: 'abc', name: 'Rex' });

        // A route param the default `([\w-_~.]+)` matcher cannot match. The library destroys the socket
        // without replying (measured), which must surface as a transport failure and not as a response.
        await expect(fetch(`http://127.0.0.1:${port}/api/pets/abc%20def`)).rejects.toThrow();

        // The server must still be up: a `destroy()` that took the process down with it would make
        // every later case in the real loop record a failure that says nothing about the generator.
        expect(container.running(), container.output()).toBe(true);
      } finally {
        await container.stop();
      }
    });
  });
}
