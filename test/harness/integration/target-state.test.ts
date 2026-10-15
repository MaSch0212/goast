import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { targetFailureFile, verifyTargetLoadFailure } from './target-state.ts';

describe('targetFailureFile', () => {
  it('is a per-profile file whose name no case id can produce', () => {
    expect(targetFailureFile('/wire', 'k6-clients')).toBe(join('/wire', 'k6-clients', '__load-failure.txt'));
  });
});

describe('verifyTargetLoadFailure', () => {
  it('writes the failure in write mode', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-'));
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await verifyTargetLoadFailure(file, 'boom\n', { mode: 'write' });

      expect(await readFile(file, 'utf8')).toBe('boom\n');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  // The half that is easy to omit and is the whole point of the contract: a target that starts loading again
  // must lose its file, and that deletion has to be reviewable rather than silent.
  it('deletes a stale file in write mode when the target now loads', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-'));
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await mkdir(join(dir, 'k6-clients'), { recursive: true });
      await writeFile(file, 'old\n');

      await verifyTargetLoadFailure(file, '', { mode: 'write' });

      await expect(lstat(file)).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the target now loads', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-'));
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await mkdir(join(dir, 'k6-clients'), { recursive: true });
      await writeFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, '', { mode: 'check' })).rejects.toThrow('no longer fails to load');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the failure text changed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-'));
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await mkdir(join(dir, 'k6-clients'), { recursive: true });
      await writeFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, 'new\n', { mode: 'check' })).rejects.toThrow('Snapshot mismatch');
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it('does nothing when the target loads and no file is committed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'goast-'));
    try {
      await verifyTargetLoadFailure(targetFailureFile(dir, 'k6-clients'), '', { mode: 'check' });
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
