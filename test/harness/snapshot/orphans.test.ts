import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanFiles, findOrphanSnapshots } from './orphans.ts';

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

  it('reports a whole dropped profile as one entry, not one per subdirectory', async () => {
    // A live sibling profile ('kept') keeps 'kotlin' from collapsing further up than 'dropped'.
    await withTree(
      ['kotlin/dropped/v3/spec/Model.kt', 'kotlin/kept/v3/spec/Model.kt'],
      async (root) => {
        expect(await findOrphanSnapshots(root, ['kotlin/kept/v3/spec'])).toEqual(['kotlin/dropped']);
      },
    );
  });

  it('collapses a tree spanning multiple subdirectories to the shallowest unclaimed directory', async () => {
    await withTree(
      ['k/p/v3/spec/api/A.kt', 'k/p/v3/spec/model/B.kt'],
      async (root) => {
        // Nothing anywhere is claimed, so the whole tree collapses to its single top-level segment
        // rather than reporting 'k/p/v3/spec/api' and 'k/p/v3/spec/model' as two separate orphans.
        expect(await findOrphanSnapshots(root, [])).toEqual(['k']);
      },
    );
  });

  it('collapses a renamed spec spanning multiple subdirectories to its tree base, not a leaf', async () => {
    await withTree(
      ['k/p/v3/spec/api/A.kt', 'k/p/v3/spec/model/B.kt'],
      async (root) => {
        // A live sibling spec under the same profile/version pins the shallowest-ancestor rule at
        // the renamed spec's tree base, rather than a hardcoded depth.
        expect(await findOrphanSnapshots(root, ['k/p/v3/other', 'k/p/v3/other.state.txt'])).toEqual([
          'k/p/v3/spec',
        ]);
      },
    );
  });

  it('reports a stale state file left by a renamed spec', async () => {
    await withTree(['kotlin/models/v3/old.state.txt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['kotlin/models/v3/old.state.txt']);
    });
  });

  it('reports a bare file sitting directly in the root', async () => {
    // Not a layout the harness produces, which is precisely why a stray file left there must still
    // surface rather than being silently swallowed for having no ancestor directory.
    await withTree(['stray.txt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['stray.txt']);
    });
  });

  it('reports orphans sorted', async () => {
    // 'a/b/other' is a live sibling that keeps 'a/b' from collapsing further than 'a/b/spec'.
    await withTree(['a/z.state.txt', 'a/b/spec/f.kt'], async (root) => {
      expect(await findOrphanSnapshots(root, ['a/b/other'])).toEqual(['a/b/spec', 'a/z.state.txt']);
    });
  });

  it('returns nothing for a missing root', async () => {
    expect(await findOrphanSnapshots(join('does', 'not', 'exist'), [])).toEqual([]);
  });
});

describe('findOrphanFiles', () => {
  it('reports an unclaimed file sitting among claimed siblings', async () => {
    // The exact case findOrphanSnapshots misses: a live sibling spec in the same directory must not
    // absolve the stale one, since every file here is a standalone snapshot, not part of a tree.
    await withTree(
      ['kotlin/models@sb3/v3/extreme-names.txt', 'kotlin/models@sb3/v3/does-not-exist.txt'],
      async (root) => {
        expect(await findOrphanFiles(root, ['kotlin/models@sb3/v3/extreme-names.txt'])).toEqual([
          'kotlin/models@sb3/v3/does-not-exist.txt',
        ]);
      },
    );
  });

  it('reports nothing when every file is claimed', async () => {
    await withTree(['kotlin/models@sb3/v3/extreme-names.txt'], async (root) => {
      expect(await findOrphanFiles(root, ['kotlin/models@sb3/v3/extreme-names.txt'])).toEqual([]);
    });
  });

  it('returns nothing for a missing root', async () => {
    expect(await findOrphanFiles(join('does', 'not', 'exist'), [])).toEqual([]);
  });
});
