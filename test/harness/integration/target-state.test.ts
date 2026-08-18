import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { targetFailureFile, verifyTargetLoadFailure } from './target-state.ts';

describe('targetFailureFile', () => {
  it('is a per-profile file whose name no case id can produce', () => {
    expect(targetFailureFile('/wire', 'k6-clients')).toBe(join('/wire', 'k6-clients', '__load-failure.txt'));
  });
});

describe('verifyTargetLoadFailure', () => {
  it('writes the failure in write mode', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await verifyTargetLoadFailure(file, 'boom\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('boom\n');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  // The half that is easy to omit and is the whole point of the contract: a target that starts loading again
  // must lose its file, and that deletion has to be reviewable rather than silent.
  it('deletes a stale file in write mode when the target now loads', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await verifyTargetLoadFailure(file, '', { mode: 'write' });

      await expect(Deno.lstat(file)).rejects.toThrow(Deno.errors.NotFound);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the target now loads', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, '', { mode: 'check' })).rejects.toThrow('no longer fails to load');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the failure text changed', async () => {
    const dir = await Deno.makeTempDir();
    try {
      const file = targetFailureFile(dir, 'k6-clients');
      await Deno.mkdir(join(dir, 'k6-clients'), { recursive: true });
      await Deno.writeTextFile(file, 'old\n');

      await expect(verifyTargetLoadFailure(file, 'new\n', { mode: 'check' })).rejects.toThrow();
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('does nothing when the target loads and no file is committed', async () => {
    const dir = await Deno.makeTempDir();
    try {
      await verifyTargetLoadFailure(targetFailureFile(dir, 'k6-clients'), '', { mode: 'check' });
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});
