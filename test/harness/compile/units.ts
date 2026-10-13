import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { isNotFound } from '../fs.ts';
import { snapshotRootDir } from '../paths.ts';
import type { DiscoveredSpec } from '../specs.ts';
import type { CompileUnit, UnitRegistryEntry } from './types.ts';

/**
 * Enumerates the compile units present on disk.
 *
 * Membership is decided by the tree directory existing and being non-empty, not by the registry
 * alone: a spec whose generation threw has an `.error.txt` and no tree, and a `models` profile emits
 * nothing at all for an endpoint-only spec. Either would otherwise become a unit with no sources,
 * which a compiler reports as an error about the missing directory rather than about the corpus.
 */
export async function discoverCompileUnits(
  profiles: readonly UnitRegistryEntry[],
  specs: readonly DiscoveredSpec[],
  root: string = snapshotRootDir,
): Promise<CompileUnit[]> {
  const units: CompileUnit[] = [];

  for (const profile of profiles) {
    for (const spec of specs) {
      if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;

      const treeDir = join(root, profile.language, profile.name, spec.versionDir, spec.name);
      if (!(await hasFiles(treeDir))) continue;

      units.push({
        language: profile.language,
        profile: profile.name,
        versionDir: spec.versionDir,
        spec: spec.name,
        treeDir,
        id: `${profile.language}/${profile.name}/${spec.versionDir}/${spec.name}`,
      });
    }
  }

  units.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return units;
}

async function hasFiles(dir: string): Promise<boolean> {
  try {
    return (await readdir(dir)).length > 0;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}
