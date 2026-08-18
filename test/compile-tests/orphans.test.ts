import { join, relative } from 'node:path';

import { it } from '@std/testing/bdd';

import { compileSnapshotFile, discoverCompileUnits, discoverSpecs, findOrphanFiles } from '@goast/test-harness';

import { profiles } from '../output-tests/profiles.ts';
import { compileRootDir } from './paths.ts';

it('has no orphaned compile snapshots', async () => {
  const specs = await discoverSpecs();
  const units = await discoverCompileUnits(profiles, specs);
  const expected = units.map((unit) =>
    relative(compileRootDir, compileSnapshotFile(compileRootDir, unit)).replace(/\\/g, '/')
  );

  const orphans = await findOrphanFiles(compileRootDir, expected);
  if (orphans.length === 0) return;

  // Spelled out rather than left as a bare `toEqual([])` diff, because the fix is not the one a
  // snapshot failure usually implies: no mode deletes these. `verifyCompileDiagnostics` removes a
  // stale snapshot only for a unit `discoverCompileUnits` still finds, and an orphan by definition
  // has no unit — so `deno task test:compile` will not clear it however many times it is run.
  throw new Error(
    `${orphans.length} committed compile snapshot(s) belong to no discovered unit:\n` +
      orphans.map((path) => `  ${join(compileRootDir, path)}`).join('\n') +
      '\n\nDelete these files by hand and commit the deletion — no snapshot mode removes them. The ' +
      'usual cause is a spec, profile or version directory that was renamed or dropped without its ' +
      'diagnostics going with it; confirm that is what happened before deleting, because the same ' +
      'symptom appears when a tree that should still be discovered has stopped being found.',
  );
});
