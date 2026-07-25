import { relative } from 'node:path';

import { walk } from '@std/fs/walk';

/**
 * Finds committed snapshots that nothing claims any more.
 *
 * `verifyProfile` prunes only within the directories it is handed, so a renamed spec or a dropped
 * config variant would otherwise leave its snapshot in place forever, quietly shrinking coverage
 * while every test stays green.
 *
 * A snapshot base is either a tree directory or a standalone snapshot file. A `.state.txt` or
 * `.error.txt` file found under `root` is reported as itself when unclaimed. Every other file is
 * attributed to the shallowest ancestor directory under `root` that has no claim at or beneath
 * it — the highest point at which nothing claimed survives — so a whole dropped profile collapses
 * to one entry regardless of how many subdirectories its generator wrote, and a file that lives
 * inside a directory some claim still covers is not reported at all. The bases nothing claims are
 * returned, sorted, relative to `root` with forward slashes.
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

    const base = findUnclaimedBase(path, claimed);
    if (base !== undefined) orphans.add(base);
  }

  return [...orphans].sort();
}

/**
 * The base to report for a file `claimed` does not name directly: the file itself when it is a
 * standalone snapshot, otherwise the shallowest ancestor directory with no claim at or beneath it.
 *
 * Walks the path's directory segments from the top. A segment that is itself claimed settles the
 * question — the file lives inside that claimed tree, so `undefined` (not an orphan), without
 * looking any deeper. A segment with some claim strictly beneath it (a sibling spec, a sibling
 * profile) is inconclusive, so the walk continues one level deeper. The first segment with no claim
 * at or beneath it at all is the answer: nothing on the path down to here survived, so this is as
 * high as the report needs to reach.
 */
function findUnclaimedBase(path: string, claimed: Set<string>): string | undefined {
  const segments = path.split('/');
  const name = segments[segments.length - 1];
  if (name.endsWith('.state.txt') || name.endsWith('.error.txt')) return path;

  for (let i = 1; i < segments.length; i++) {
    const prefix = segments.slice(0, i).join('/');
    if (claimed.has(prefix)) return undefined;
    if (!hasClaimBeneath(prefix, claimed)) return prefix;
  }
  return undefined;
}

/** Whether some claimed entry lives strictly beneath `prefix` (not `prefix` itself). */
function hasClaimBeneath(prefix: string, claimed: Set<string>): boolean {
  const nested = `${prefix}/`;
  for (const entry of claimed) {
    if (entry.startsWith(nested)) return true;
  }
  return false;
}
