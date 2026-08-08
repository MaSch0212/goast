import { relative } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanFiles, wireRootDir, wireSnapshotFile } from '@goast/test-harness';

import { casesFor } from '../cases/cases.ts';

// Hardcoded to `fetch-clients` because it is the only tier-4 target this phase builds. Phases 6 and
// 7 add containerized targets and turn this into a loop over a target registry — not built yet
// because a registry of one entry is speculative structure. Kept as a constant, not a repeated
// literal, so the filter below and the snapshot path it feeds cannot drift apart.
const PROFILE = 'fetch-clients';

// `findOrphanFiles` compares against paths relative to `wireRootDir` with forward slashes (it walks
// the tree with `relative(root, entry.path).replace(/\\/g, '/')`, the same way
// `test/compile-tests/orphans.test.ts` does for tier 3), so `wireSnapshotFile`'s absolute path is
// converted the same way before comparison — passing it through unconverted made every committed
// artifact register as its own orphan on this checkout.
//
// `casesFor(PROFILE, 'client')`, not the unfiltered `cases` table: `integration.test.ts` only ever
// calls `verifyWireDeviations` for the cases that survive that same filter, so a case excluded via
// `except` or scoped to `directions: ['server']` never gets its artifact written *or* deleted by
// either snapshot mode. Claiming its filename here anyway would mean a stale artifact for such a
// case survives forever with this sweep still green — exactly the failure this file exists to catch.
describe('wire artifacts', () => {
  it('has no artifact without a matching case', async () => {
    const expected = casesFor(PROFILE, 'client').map((c) =>
      relative(wireRootDir, wireSnapshotFile(wireRootDir, PROFILE, c.id)).replace(/\\/g, '/')
    );

    expect(await findOrphanFiles(wireRootDir, expected)).toEqual([]);
  });
});
