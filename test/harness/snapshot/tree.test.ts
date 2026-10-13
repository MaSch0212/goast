import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { applyTreeDiff, diffFileTrees, type FileTree, formatDiffCounts, isEmptyDiff, readFileTree } from './tree.ts';

const encoder = new TextEncoder();

function tree(files: Record<string, string>): FileTree {
  return new Map(Object.entries(files).map(([path, content]) => [path, encoder.encode(content)]));
}

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-tree-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function writeTree(dir: string, files: Record<string, string>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const target = join(dir, path);
    await Deno.mkdir(join(target, '..'), { recursive: true });
    await Deno.writeTextFile(target, content);
  }
}

describe('readFileTree', () => {
  it('should return an empty tree for a missing directory', async () => {
    const result = await readFileTree(join('does', 'not', 'exist'));
    expect(result.size).toBe(0);
  });

  it('should read files recursively with forward-slash relative keys', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'a.txt': 'A', 'nested/deep/b.txt': 'B' });
      const result = await readFileTree(dir);
      expect([...result.keys()].sort()).toEqual(['a.txt', 'nested/deep/b.txt']);
      expect(new TextDecoder().decode(result.get('nested/deep/b.txt'))).toBe('B');
    });
  });

  it('should preserve carriage returns instead of normalizing them', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'a.txt': 'one\r\ntwo' });
      const result = await readFileTree(dir);
      expect(new TextDecoder().decode(result.get('a.txt'))).toBe('one\r\ntwo');
    });
  });
});

describe('diffFileTrees', () => {
  it('should report an empty diff for identical trees', () => {
    const diff = diffFileTrees(tree({ 'a.txt': 'A' }), tree({ 'a.txt': 'A' }));
    expect(diff).toEqual({ added: [], changed: [], removed: [] });
    expect(isEmptyDiff(diff)).toBe(true);
  });

  it('should classify added, changed and removed files', () => {
    const diff = diffFileTrees(
      tree({ 'keep.txt': 'K', 'change.txt': 'old', 'gone.txt': 'G' }),
      tree({ 'keep.txt': 'K', 'change.txt': 'new', 'fresh.txt': 'F' }),
    );
    expect(diff).toEqual({ added: ['fresh.txt'], changed: ['change.txt'], removed: ['gone.txt'] });
    expect(isEmptyDiff(diff)).toBe(false);
  });

  it('should sort each list', () => {
    const diff = diffFileTrees(tree({}), tree({ 'b.txt': 'B', 'a.txt': 'A' }));
    expect(diff.added).toEqual(['a.txt', 'b.txt']);
  });

  it('should treat a trailing-newline-only change as changed', () => {
    const diff = diffFileTrees(tree({ 'a.txt': 'A' }), tree({ 'a.txt': 'A\n' }));
    expect(diff.changed).toEqual(['a.txt']);
  });
});

describe('formatDiffCounts', () => {
  it('should format the three counts', () => {
    expect(formatDiffCounts({ added: ['a', 'b'], changed: ['c'], removed: [] })).toBe('+2 ~1 -0');
  });
});

describe('applyTreeDiff', () => {
  it('should write added and changed files and delete removed ones', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'change.txt': 'old', 'gone.txt': 'G' });
      const actual = tree({ 'change.txt': 'new', 'nested/fresh.txt': 'F' });
      const diff = diffFileTrees(await readFileTree(dir), actual);

      await applyTreeDiff(dir, actual, diff);

      expect(await readFileTree(dir)).toEqual(actual);
    });
  });

  it('should remove directories left empty by deletions', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'keep.txt': 'K', 'dead/branch/gone.txt': 'G' });
      const actual = tree({ 'keep.txt': 'K' });
      const diff = diffFileTrees(await readFileTree(dir), actual);

      await applyTreeDiff(dir, actual, diff);

      expect(await readFileTree(dir)).toEqual(actual);
      await expect(Deno.stat(join(dir, 'dead'))).rejects.toThrow(Deno.errors.NotFound);
    });
  });
});
