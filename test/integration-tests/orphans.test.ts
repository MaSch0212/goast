import { relative } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanFiles, wireRootDir, wireSnapshotFile } from '@goast/test-harness';

import { cases } from '../cases/cases.ts';

// Hardcoded to `fetch-clients` because it is the only tier-4 target this phase builds. Phases 6 and
// 7 add containerized targets and turn this into a loop over a target registry — not built yet
// because a registry of one entry is speculative structure.
//
// `findOrphanFiles` compares against paths relative to `wireRootDir` with forward slashes (it walks
// the tree with `relative(root, entry.path).replace(/\\/g, '/')`, the same way
// `test/compile-tests/orphans.test.ts` does for tier 3), so `wireSnapshotFile`'s absolute path is
// converted the same way before comparison — passing it through unconverted made every committed
// artifact register as its own orphan on this checkout.
describe('wire artifacts', () => {
  it('has no artifact without a matching case', async () => {
    const expected = cases.map((c) =>
      relative(wireRootDir, wireSnapshotFile(wireRootDir, 'fetch-clients', c.id)).replace(/\\/g, '/')
    );

    expect(await findOrphanFiles(wireRootDir, expected)).toEqual([]);
  });
});
