import { lstat, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

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
    const dir = await mkdtemp(join(tmpdir(), 'goast-wire-'));
    try {
      const file = join(dir, 'case.txt');
      await verifyWireDeviations(file, 'path\n  expected /a\n  actual   /b\n', { mode: 'write' });

      expect(await readFile(file, 'utf8')).toBe('path\n  expected /a\n  actual   /b\n');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('removes a stale file in write mode when the case now conforms', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-wire-'));
    try {
      const file = join(dir, 'case.txt');
      await writeFile(file, 'stale\n');
      await verifyWireDeviations(file, '', { mode: 'write' });

      await expect(lstat(file)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the case now conforms', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-wire-'));
    try {
      const file = join(dir, 'case.txt');
      await writeFile(file, 'stale\n');

      await expect(verifyWireDeviations(file, '', { mode: 'check' })).rejects.toThrow('no longer deviates');
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
