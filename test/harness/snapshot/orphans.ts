import { relative } from 'node:path';

import { walk } from '@std/fs/walk';

/**
 * Finds committed snapshots that nothing claims any more.
 *
 * `verifyProfile` prunes only within the directories it is handed, so a renamed spec or a dropped
 * config variant would otherwise leave its snapshot in place forever, quietly shrinking coverage
 * while every test stays green.
 *
 * A snapshot base is either a tree directory or a standalone snapshot file. Every file found under
 * `root` is attributed to a base — a file inside a claimed tree directory is not itself an orphan —
 * and the bases nothing claims are returned, sorted, relative to `root` with forward slashes.
 */
export async function findOrphanSnapshots(root: string, expected: Iterable<string>): Promise<string[]> {
  const claimed = new Set(expected);
  const orphans = new Set<string>();

  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
  if (!info.isDirectory) throw new Error(`Not a directory: ${root}`);

  for await (const entry of walk(root, { includeDirs: false, includeSymlinks: false })) {
    const path = relative(root, entry.path).replace(/\\/g, '/');
    if (claimed.has(path)) continue;

    const owner = findOwningBase(path, claimed);
    if (owner === undefined) orphans.add(orphanBase(path));
  }

  return [...orphans].sort();
}

/** The claimed tree directory a file belongs to, if any. */
function findOwningBase(path: string, claimed: Set<string>): string | undefined {
  const segments = path.split('/');
  for (let i = segments.length - 1; i > 0; i--) {
    const candidate = segments.slice(0, i).join('/');
    if (claimed.has(candidate)) return candidate;
  }
  return undefined;
}

/**
 * The base to report for an unclaimed file: the file itself when it is a standalone snapshot,
 * otherwise the directory that would have been its tree.
 */
function orphanBase(path: string): string {
  const segments = path.split('/');
  const name = segments[segments.length - 1];
  if (name.endsWith('.state.txt') || name.endsWith('.error.txt')) return path;
  return segments.slice(0, -1).join('/');
}
