import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { readFileTree } from './tree.ts';
import { verifyFileTree } from './verify-file-tree.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-verify-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** A generate callback that writes a fixed set of files. */
function generator(files: Record<string, string>): (outputDir: string) => Promise<void> {
  return async (outputDir) => {
    for (const [path, content] of Object.entries(files)) {
      const target = join(outputDir, path);
      await Deno.mkdir(join(target, '..'), { recursive: true });
      await Deno.writeTextFile(target, content);
    }
  };
}

async function readAsText(dir: string): Promise<Record<string, string>> {
  const decoder = new TextDecoder();
  return Object.fromEntries([...await readFileTree(dir)].map(([path, bytes]) => [path, decoder.decode(bytes)]));
}

describe('verifyFileTree', () => {
  describe('write mode', () => {
    it('should create the snapshot when it does not exist yet', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');

        await verifyFileTree(snapshotDir, generator({ 'api/pets.ts': 'export const a = 1;\n' }), { mode: 'write' });

        expect(await readAsText(snapshotDir)).toEqual({ 'api/pets.ts': 'export const a = 1;\n' });
      });
    });

    it('should overwrite changed files and delete stale ones', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'keep.ts': 'K', 'stale.ts': 'S' }), { mode: 'write' });

        await verifyFileTree(snapshotDir, generator({ 'keep.ts': 'K2', 'new.ts': 'N' }), { mode: 'write' });

        expect(await readAsText(snapshotDir)).toEqual({ 'keep.ts': 'K2', 'new.ts': 'N' });
      });
    });

    it('should pass without touching disk when nothing changed', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });
        const before = (await Deno.stat(join(snapshotDir, 'a.ts'))).mtime;

        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

        expect((await Deno.stat(join(snapshotDir, 'a.ts'))).mtime).toEqual(before);
      });
    });

    it('should refuse to prune the snapshot when generation produced no files', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'precious.ts': 'P' }), { mode: 'write' });

        await expect(verifyFileTree(snapshotDir, generator({}), { mode: 'write' })).rejects.toThrow(
          'produced no files',
        );

        expect(await readAsText(snapshotDir)).toEqual({ 'precious.ts': 'P' });
      });
    });

    it('should clean up its temporary directory even when generation throws', async () => {
      await withTempDir(async (dir) => {
        const tempDirs: string[] = [];

        await expect(
          verifyFileTree(join(dir, 'snapshot'), (outputDir) => {
            tempDirs.push(outputDir);
            throw new Error('generator exploded');
          }, { mode: 'write' }),
        ).rejects.toThrow('generator exploded');

        expect(tempDirs).toHaveLength(1);
        await expect(Deno.stat(tempDirs[0])).rejects.toThrow(Deno.errors.NotFound);
      });
    });

    it('should clean up its temporary directory even when generation rejects asynchronously', async () => {
      await withTempDir(async (dir) => {
        const tempDirs: string[] = [];

        await expect(
          verifyFileTree(join(dir, 'snapshot'), async (outputDir) => {
            tempDirs.push(outputDir);
            await Promise.resolve();
            throw new Error('generator async rejected');
          }, { mode: 'write' }),
        ).rejects.toThrow('generator async rejected');

        expect(tempDirs).toHaveLength(1);
        await expect(Deno.stat(tempDirs[0])).rejects.toThrow(Deno.errors.NotFound);
      });
    });
  });

  describe('check mode', () => {
    it('should pass when the tree matches', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'check' });
      });
    });

    it('should throw a report listing added, changed and removed files', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'change.ts': 'old', 'gone.ts': 'G' }), { mode: 'write' });

        const error = await verifyFileTree(snapshotDir, generator({ 'change.ts': 'new', 'fresh.ts': 'F' }), {
          mode: 'check',
        }).catch((e: Error) => e) as Error;

        expect(error.message).toContain('Snapshot mismatch:');
        expect(error.message).toContain('+ fresh.ts');
        expect(error.message).toContain('~ change.ts');
        expect(error.message).toContain('- gone.ts');
        expect(error.message).toContain('First difference in change.ts at line 1');
        expect(error.message).toContain('-1 | old');
        expect(error.message).toContain('+1 | new');
        expect(error.message).toContain('Run `deno task test:output`');
      });
    });

    it('should leave the snapshot untouched on mismatch', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

        await expect(verifyFileTree(snapshotDir, generator({ 'a.ts': 'B' }), { mode: 'check' })).rejects.toThrow();

        expect(await readAsText(snapshotDir)).toEqual({ 'a.ts': 'A' });
      });
    });
  });
});
