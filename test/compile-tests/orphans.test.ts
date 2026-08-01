import { relative } from 'node:path';

import { expect } from '@std/expect';
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

  expect(await findOrphanFiles(compileRootDir, expected)).toEqual([]);
});
