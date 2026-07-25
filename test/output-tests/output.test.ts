import { join } from 'node:path';

import { describe, it } from '@std/testing/bdd';

import { OpenApiGenerator } from '@goast/core';
import { discoverSpecs, profileSnapshotPaths, snapshotRootDir, verifyProfile } from '@goast/test-harness';

import { profiles } from './profiles.ts';

const specs = await discoverSpecs();

for (const profile of profiles) {
  describe(`${profile.language}/${profile.name}`, () => {
    for (const spec of specs) {
      if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;

      it(`${spec.versionDir}/${spec.name}`, async () => {
        const baseDir = join(snapshotRootDir, profile.language, profile.name, spec.versionDir);
        await verifyProfile(
          profileSnapshotPaths(baseDir, spec.name),
          (outputDir) =>
            profile.configure(new OpenApiGenerator({ outputDir, newLine: '\n' })).parseAndGenerate(spec.files),
        );
      });
    }
  });
}
