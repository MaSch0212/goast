import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { waitForHttpReady } from './health.ts';

describe('waitForHttpReady', () => {
  it('returns as soon as the url answers, whatever the status', async () => {
    const server = Deno.serve({ port: 0, onListen: () => {} }, () => new Response('nope', { status: 404 }));
    try {
      await waitForHttpReady(`http://127.0.0.1:${server.addr.port}/__health`, {
        timeoutMs: 5_000,
        isAlive: () => true,
        describeDeath: () => 'unused',
      });
    } finally {
      await server.shutdown();
    }
  });

  // The failure this exists to prevent: a container that crashed on startup would otherwise be waited
  // on for the whole timeout and then reported as "timed out", hiding the compile error in its log.
  it('fails immediately with the death description once isAlive goes false', async () => {
    let alive = true;
    setTimeout(() => alive = false, 50);

    await expect(
      waitForHttpReady('http://127.0.0.1:1/never', {
        timeoutMs: 60_000,
        isAlive: () => alive,
        describeDeath: () => 'exit 1\nUnresolved reference: Widget',
      }),
    ).rejects.toThrow('Unresolved reference: Widget');
  });

  it('fails with the url and the timeout when nothing ever answers', async () => {
    await expect(
      waitForHttpReady('http://127.0.0.1:1/never', {
        timeoutMs: 300,
        isAlive: () => true,
        describeDeath: () => 'still running',
      }),
    ).rejects.toThrow('did not become ready within 300ms');
  });
});
