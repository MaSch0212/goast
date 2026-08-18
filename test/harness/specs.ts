import { join } from 'node:path';

import { walk } from '@std/fs/walk';

import { specsDir } from './paths.ts';
import type { OpenApiVersion } from './types.ts';

/**
 * Corpus roots, mapped to the OpenAPI version each holds.
 *
 * `integration` is not a version directory — it is the curated tier-4 kitchen-sink, pinned to 3.0. It
 * lives here rather than in a tier-4-only walk because tier 4 imports the *committed* generated tree
 * (the spec requires that what runs is byte-identical to what was reviewed), and only tier 2 commits
 * trees. Being a root also gets it tier-3 compile coverage for free.
 */
export const SPEC_VERSION_DIRS: {
  readonly v2: '2.0';
  readonly v3: '3.0';
  readonly 'v3.1': '3.1';
  readonly integration: '3.0';
} = {
  'v2': '2.0',
  'v3': '3.0',
  'v3.1': '3.1',
  'integration': '3.0',
} as const satisfies Record<string, OpenApiVersion>;

export type SpecVersionDir = keyof typeof SPEC_VERSION_DIRS;

/** One corpus entry: a single spec file, or a directory of files parsed together. */
export type DiscoveredSpec = {
  /** The version directory it lives in. Doubles as a snapshot path segment. */
  versionDir: SpecVersionDir;
  /** The OpenAPI version that directory holds. */
  version: OpenApiVersion;
  /** File base name without extension, or the directory name. Snapshot path segment. */
  name: string;
  /** Absolute paths to hand to `parseAndGenerate`, sorted. */
  files: string[];
};

const SPEC_EXTENSIONS = ['.yml', '.yaml', '.json'];

/**
 * Enumerates the corpus under `root`, one entry per spec.
 *
 * A file directly inside a version directory is one spec. A *directory* there is one spec too, whose
 * files are parsed together — that is how the multi-file and mixed-version cases are expressed.
 */
export async function discoverSpecs(root: string = specsDir): Promise<DiscoveredSpec[]> {
  const specs: DiscoveredSpec[] = [];
  // `versionDir/name` is the snapshot base for every profile, so two corpus entries that agree on it
  // would silently share one set of snapshots: write mode would let the second overwrite the first,
  // the orphan sweep would see nothing missing, and only check mode would ever complain. Extensions
  // are stripped, so `pets.yml` beside `pets.json` is exactly that collision.
  const claimedBy = new Map<string, string>();
  const claim = (spec: DiscoveredSpec, source: string) => {
    const key = `${spec.versionDir}/${spec.name}`;
    const previous = claimedBy.get(key);
    if (previous !== undefined) {
      throw new Error(
        `Duplicate spec name "${key}" in the corpus: ${previous} and ${source} both map to the same ` +
          'snapshot base. Rename one of them.',
      );
    }
    claimedBy.set(key, source);
    specs.push(spec);
  };

  for (const versionDir of Object.keys(SPEC_VERSION_DIRS) as SpecVersionDir[]) {
    const versionPath = join(root, versionDir);
    const entries: Deno.DirEntry[] = [];
    try {
      for await (const entry of Deno.readDir(versionPath)) entries.push(entry);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }

    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      const path = join(versionPath, entry.name);
      if (entry.isDirectory) {
        const files = await collectSpecFiles(path);
        if (files.length > 0) {
          claim({ versionDir, version: SPEC_VERSION_DIRS[versionDir], name: entry.name, files }, path);
        }
      } else if (isSpecFile(entry.name)) {
        claim({
          versionDir,
          version: SPEC_VERSION_DIRS[versionDir],
          name: entry.name.replace(/\.[^.]+$/, ''),
          files: [path],
        }, path);
      }
    }
  }

  // `Object.keys(SPEC_VERSION_DIRS)` order (v2, v3, v3.1) does not match the lexicographic order of
  // `${versionDir}/${name}` — '.' sorts before '/', so 'v3.1/...' precedes 'v3/...' as a string. Sort explicitly so
  // the result is deterministic under plain string comparison, matching how callers naturally compare entries.
  specs.sort((a, b) => {
    const keyA = `${a.versionDir}/${a.name}`;
    const keyB = `${b.versionDir}/${b.name}`;
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
  });

  return specs;
}

function isSpecFile(name: string): boolean {
  return SPEC_EXTENSIONS.some((extension) => name.endsWith(extension));
}

async function collectSpecFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of walk(dir, { includeDirs: false, includeSymlinks: false, exts: SPEC_EXTENSIONS })) {
    files.push(entry.path);
  }
  return files.sort();
}
