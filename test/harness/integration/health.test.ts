import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { describe, expect, it } from 'vitest';

import { waitForHttpReady } from './health.ts';

describe('waitForHttpReady', () => {
  it('returns as soon as the url answers, whatever the status', async () => {
    const server = createServer((_, res) => res.writeHead(404).end('nope'));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      await waitForHttpReady(`http://127.0.0.1:${(server.address() as AddressInfo).port}/__health`, {
        timeoutMs: 5_000,
        isAlive: () => true,
        describeDeath: () => 'unused',
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // The failure this exists to prevent: a container that crashed on startup would otherwise be waited
  // on for the whole timeout and then reported as "timed out", hiding the compile error in its log.
  it('fails immediately with the death description once isAlive goes false', async () => {
    let alive = true;
    setTimeout(() => (alive = false), 50);

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
