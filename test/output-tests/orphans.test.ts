import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { discoverSpecs, findOrphanSnapshots, snapshotRootDir } from '@goast/test-harness';

import { profiles } from './profiles.ts';

describe('snapshot tree', () => {
  it('holds exactly what the registry and corpus claim', async () => {
    const specs = await discoverSpecs();
    const claimed: string[] = [];

    for (const profile of profiles) {
      for (const spec of specs) {
        if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;
        const base = `${profile.language}/${profile.name}/${spec.versionDir}/${spec.name}`;
        claimed.push(base, `${base}.state.txt`, `${base}.error.txt`);
      }
    }
    for (const spec of specs) {
      claimed.push(`core/${spec.versionDir}/${spec.name}`);
    }

    const orphans = await findOrphanSnapshots(snapshotRootDir, claimed);

    expect(orphans).toEqual([]);
  });
});
