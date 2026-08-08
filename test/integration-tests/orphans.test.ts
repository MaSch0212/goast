import { relative } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanFiles, wireRootDir, wireSnapshotFile } from '@goast/test-harness';

import { casesFor } from '../cases/cases.ts';
import { WIRE_TARGETS } from '../integration/targets.ts';

// `findOrphanFiles` compares against paths relative to `wireRootDir` with forward slashes (it walks
// the tree with `relative(root, entry.path).replace(/\\/g, '/')`, the same way
// `test/compile-tests/orphans.test.ts` does for tier 3), so `wireSnapshotFile`'s absolute path is
// converted the same way before comparison — passing it through unconverted made every committed
// artifact register as its own orphan on this checkout.
//
// `casesFor(profile, direction)`, not the unfiltered `cases` table: a driver only ever calls
// `verifyWireDeviations` for the cases that survive that same filter, so a case excluded via `except`
// or scoped to the other direction never gets its artifact written *or* deleted by either snapshot
// mode. Claiming its filename here anyway would mean a stale artifact for such a case survives
// forever with this sweep still green — exactly the failure this file exists to catch.
//
// The loop is over `WIRE_TARGETS` rather than one hardcoded profile because `findOrphanFiles` walks
// *all* of `wireRootDir`, so an expected set built from a single target reports every other target's
// artifacts as orphans. That is not hypothetical: the Kotlin targets' 36 artifacts landed one commit
// before this registry existed and turned this sweep red.
describe('wire artifacts', () => {
  it('has no artifact without a matching case in any target', async () => {
    const expected = WIRE_TARGETS.flatMap(({ profile, direction }) =>
      casesFor(profile, direction).map((c) =>
        relative(wireRootDir, wireSnapshotFile(wireRootDir, profile, c.id)).replace(/\\/g, '/')
      )
    );

    expect(await findOrphanFiles(wireRootDir, expected)).toEqual([]);
  });
});
