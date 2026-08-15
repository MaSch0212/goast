/**
 * Tier 4's Docker risk gate for the `easy-network-stub` leg: proves the generated stubs come up as a
 * real HTTP server and answer, before the full case loop (a later task) is worth writing.
 *
 * Model: `test/integration/spring-controllers/boot.test.ts`. Both legs drive a generated **server**
 * with real HTTP requests from the host, so the gate shape is the same — build the image, start the
 * container, wait for readiness, probe a handful of load-bearing behaviours, and assert the container
 * is still alive afterward.
 *
 * The probes below cover three of the adapter's four load-bearing behaviours, each measured against the
 * real image and the real committed tree:
 *   - A route the generated stubs register answers through the generated responder, with the raw request
 *     path matched suffix-anchored (no prefix stripped, nothing decoded).
 *   - The whole request body is buffered and handed to the stub as a UTF-8 string, round-tripped through
 *     a route that echoes part of it back — proving the buffering path, not just the no-body path above.
 *   - A route param the default `([\w-_~.]+)` matcher cannot match (a percent-encoded space) makes the
 *     library destroy the socket without replying. This must surface as a genuine transport failure
 *     (a reset connection), not merely "some rejection" — and a route requested immediately afterward
 *     must still answer normally, because a `destroy()` that quietly took the server down with it would
 *     make every later case in the real loop record a failure that says nothing about the generator.
 *
 * The fourth behaviour — upper-casing the request method — is deliberately **not** exercised here, and
 * that is not an oversight: Node's own HTTP parser rejects a non-uppercase method token with a `400`
 * before a request ever reaches this adapter (measured: `curl -X get ...` never gets past Node's parser
 * to this server at all), and `fetch` itself normalizes `GET`/`POST`/`PUT`/`DELETE`/`HEAD`/`OPTIONS` to
 * uppercase before the request leaves the client. No client this gate can drive can make
 * `request.method` arrive lowercase, so there is no way to make this probe set observe the adapter's own
 * `.toUpperCase()` doing anything. It stays in `adapter.ts` as cheap defensive programming against a
 * method casing this HTTP stack cannot actually produce, not because this gate proves it necessary.
 */
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, startContainer, waitForHttpReady } from '@goast/test-harness';

import { buildCommand, DRIVER_DIR, DRIVER_MOUNT, READINESS_PATH, SERVER_PORT, TREE_DIR, TREE_MOUNT } from './build.ts';

/** Same gate as the rest of tier 4's Docker legs: `deno task test` must never start a container. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';
const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

/**
 * Every message in an error's `cause` chain, joined.
 *
 * Deno's `fetch` reports a transport failure as `TypeError: fetch failed` and puts the text that says
 * *what* failed one level down in `cause`, so asserting on `error.message` alone tests nothing about
 * the failure mode.
 */
function flattenCauses(error: unknown): string {
  const messages: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    messages.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }
  return messages.join(' <- ');
}

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

        // Whole-body buffering: `stubUpdatePet` echoes part of the request body back, which only works
        // if the adapter actually collected every `'data'` chunk before handing the body to the stub as
        // a UTF-8 string, rather than (for example) only forwarding the first chunk.
        const updated = await fetch(`http://127.0.0.1:${port}/api/pets/abc`, {
          method: 'PUT',
          body: JSON.stringify({ name: 'Buddy', age: 5 }),
        });
        expect(updated.status).toBe(200);
        expect(await updated.json()).toEqual({ id: 'abc', name: 'Buddy', age: 5 });

        // A route param the default `([\w-_~.]+)` matcher cannot match. The library destroys the socket
        // without replying (measured), which must surface as a genuine transport failure — not merely
        // "some rejection", which is exactly the assertion that would also swallow the adapter-level
        // fault `adapter.ts`'s `.catch` guards against (a `reply` that throws also leaves the connection
        // looking reset).
        //
        // The wording is asserted against the flattened `cause` chain, not `error.message`. Deno's
        // `fetch` reports this as `TypeError: fetch failed` with the informative text one level down in
        // `cause` — measured six consecutive times against this container, all six identical. An earlier
        // revision asserted on `message` directly and passed once before failing on the next run, which
        // is the worst possible behaviour for a gate: a probe that intermittently stops checking the
        // thing it exists to check.
        let destroyedError: unknown;
        try {
          await fetch(`http://127.0.0.1:${port}/api/pets/abc%20def`);
          destroyedError = undefined;
        } catch (error) {
          destroyedError = error;
        }
        expect(destroyedError).toBeInstanceOf(TypeError);
        expect(flattenCauses(destroyedError)).toContain('connection closed before message completed');

        // A good route must still answer *normally* right after that destroy, not just "the container
        // process is still alive": a destroy that left the server wedged (accepting connections but
        // never responding) would still pass a bare `container.running()` check.
        const stillOk = await fetch(`http://127.0.0.1:${port}/api/pets/abc`);
        // Read the body rather than only the status, and not merely to satisfy Deno's leak detector
        // (which does fail the test on an unconsumed response body): a server wedged mid-response would
        // hand back headers and then never finish, which a status-only assertion cannot tell from a
        // complete answer.
        expect(await stillOk.json()).toEqual({ id: 'abc', name: 'Rex' });
        expect(stillOk.status).toBe(200);

        // And the container itself, independent of the HTTP-level check above: a `destroy()` that took
        // the whole process down with it would make every later case in the real loop record a failure
        // that says nothing about the generator.
        expect(container.running(), container.output()).toBe(true);
      } finally {
        await container.stop();
      }
    });
  });
}
