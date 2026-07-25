import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanSnapshots } from './orphans.ts';

async function withTree(
  files: string[],
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'goast-orphans-' });
  try {
    for (const file of files) {
      const path = join(root, ...file.split('/'));
      await Deno.mkdir(join(path, '..'), { recursive: true });
      await Deno.writeTextFile(path, 'x');
    }
    await fn(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

describe('findOrphanSnapshots', () => {
  it('reports nothing when the tree matches expectations', async () => {
    await withTree(['kotlin/models/v3/spec/Model.kt', 'kotlin/models/v3/spec.state.txt'], async (root) => {
      const orphans = await findOrphanSnapshots(root, ['kotlin/models/v3/spec', 'kotlin/models/v3/spec.state.txt']);
      expect(orphans).toEqual([]);
    });
  });

  it('reports a tree directory no profile claims', async () => {
    await withTree(['kotlin/dropped/v3/spec/Model.kt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['kotlin/dropped/v3/spec']);
    });
  });

  it('reports a stale state file left by a renamed spec', async () => {
    await withTree(['kotlin/models/v3/old.state.txt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['kotlin/models/v3/old.state.txt']);
    });
  });

  it('reports orphans sorted', async () => {
    await withTree(['a/z.state.txt', 'a/b/spec/f.kt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['a/b/spec', 'a/z.state.txt']);
    });
  });

  it('returns nothing for a missing root', async () => {
    expect(await findOrphanSnapshots(join('does', 'not', 'exist'), [])).toEqual([]);
  });
});
