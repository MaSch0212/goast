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

  // The engine is shared with tier 3, which points its readers at `deno task test:compile`; tier 2's
  // own callers pass nothing and must keep getting tier 2's task.
  describe('update command', () => {
    it('names `deno task test:output` by default, in both check-mode messages', async () => {
      await withTempDir(async (dir) => {
        const file = join(dir, 'state.txt');
        const missing = await verifyText(file, 'a\n', { mode: 'check' }).catch((e: Error) => e) as Error;
        expect(missing.message).toContain('Run `deno task test:output` to create it');

        await verifyText(file, 'a\n', { mode: 'write' });
        const mismatch = await verifyText(file, 'b\n', { mode: 'check' }).catch((e: Error) => e) as Error;
        expect(mismatch.message).toContain('Run `deno task test:output` to update the snapshot');
      });
    });

    it('names the caller-supplied task instead, in both check-mode messages', async () => {
      await withTempDir(async (dir) => {
        const file = join(dir, 'state.txt');
        const options = { mode: 'check', updateCommand: 'deno task test:compile' } as const;

        const missing = await verifyText(file, 'a\n', options).catch((e: Error) => e) as Error;
        expect(missing.message).toContain('Run `deno task test:compile` to create it');
        expect(missing.message).not.toContain('test:output');

        await verifyText(file, 'a\n', { mode: 'write' });
        const mismatch = await verifyText(file, 'b\n', options).catch((e: Error) => e) as Error;
        expect(mismatch.message).toContain('Run `deno task test:compile` to update the snapshot');
        expect(mismatch.message).not.toContain('test:output');
      });
    });
  });
});
