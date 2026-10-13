import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { verifyWireDeviations, wireSnapshotFile } from './verify.ts';

describe('wireSnapshotFile', () => {
  it('puts one file per case under the profile directory', () => {
    expect(wireSnapshotFile('/wire', 'fetch-clients', 'getPet/ok')).toBe(
      join('/wire', 'fetch-clients', 'getPet__ok.txt'),
    );
  });
});

describe('verifyWireDeviations', () => {
  it('writes the deviations in write mode', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await verifyWireDeviations(file, 'path\n  expected /a\n  actual   /b\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('path\n  expected /a\n  actual   /b\n');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('removes a stale file in write mode when the case now conforms', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await Deno.writeTextFile(file, 'stale\n');
      await verifyWireDeviations(file, '', { mode: 'write' });

      await expect(Deno.lstat(file)).rejects.toThrow();
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the case now conforms', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await Deno.writeTextFile(file, 'stale\n');

      await expect(verifyWireDeviations(file, '', { mode: 'check' })).rejects.toThrow('no longer deviates');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});
