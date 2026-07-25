import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { verifyText } from './verify-text.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-verify-text-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

describe('verifyText', () => {
  it('should create the snapshot file in write mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'nested', 'state.txt');

      await verifyText(file, 'hello\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('hello\n');
    });
  });

  it('should overwrite a changed snapshot in write mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'old\n', { mode: 'write' });

      await verifyText(file, 'new\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('new\n');
    });
  });

  it('should normalize absolute repo paths before storing', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');

      await verifyText(file, `source: ${join(repoRootDir, 'a.yml')}\n`, { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('source: <root>/a.yml\n');
    });
  });

  it('should pass in check mode when the text matches', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'same\n', { mode: 'write' });

      await verifyText(file, 'same\n', { mode: 'check' });
    });
  });

  it('should throw with the first difference in check mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'a\nold\nc\n', { mode: 'write' });

      const error = await verifyText(file, 'a\nnew\nc\n', { mode: 'check' }).catch((e: Error) => e) as Error;

      expect(error.message).toContain('Snapshot mismatch:');
      expect(error.message).toContain('at line 2');
      expect(error.message).toContain('-2 | old');
      expect(error.message).toContain('+2 | new');
    });
  });

  it('should report a missing snapshot file distinctly in check mode', async () => {
    await withTempDir(async (dir) => {
      const error = await verifyText(join(dir, 'state.txt'), 'text\n', { mode: 'check' })
        .catch((e: Error) => e) as Error;

      expect(error.message).toContain('Snapshot file does not exist');
    });
  });
});
