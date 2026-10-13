import { dirname, join, relative } from 'node:path';

import { equals } from '@std/bytes';
import { ensureDir } from '@std/fs/ensure-dir';
import { walk } from '@std/fs/walk';

/** A directory tree flattened to relative, forward-slash-separated paths and raw file contents. */
export type FileTree = Map<string, Uint8Array>;

/** The difference between a committed snapshot tree and a freshly generated one. */
export type TreeDiff = {
  /** Present in the generated tree, absent from the snapshot. */
  added: string[];
  /** Present in both, with differing bytes. */
  changed: string[];
  /** Present in the snapshot, absent from the generated tree. */
  removed: string[];
};

/** Reads a directory into a {@link FileTree}. A missing directory yields an empty tree. */
export async function readFileTree(root: string): Promise<FileTree> {
  const tree: FileTree = new Map();

  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return tree;
    throw error;
  }
  if (!info.isDirectory) throw new Error(`Not a directory: ${root}`);

  for await (const entry of walk(root, { includeDirs: false, includeSymlinks: false })) {
    tree.set(toRelativeKey(root, entry.path), await Deno.readFile(entry.path));
  }
  return tree;
}

/** Compares two trees byte-for-byte. */
export function diffFileTrees(expected: FileTree, actual: FileTree): TreeDiff {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];

  for (const [path, actualBytes] of actual) {
    const expectedBytes = expected.get(path);
    if (expectedBytes === undefined) {
      added.push(path);
    } else if (!equals(expectedBytes, actualBytes)) {
      changed.push(path);
    }
  }
  for (const path of expected.keys()) {
    if (!actual.has(path)) removed.push(path);
  }

  return { added: added.sort(), changed: changed.sort(), removed: removed.sort() };
}

export function isEmptyDiff(diff: TreeDiff): boolean {
  return diff.added.length === 0 && diff.changed.length === 0 && diff.removed.length === 0;
}

export function formatDiffCounts(diff: TreeDiff): string {
  return `+${diff.added.length} ~${diff.changed.length} -${diff.removed.length}`;
}

/** Makes the snapshot tree at `root` byte-identical to `actual`. */
export async function applyTreeDiff(root: string, actual: FileTree, diff: TreeDiff): Promise<void> {
  for (const path of [...diff.added, ...diff.changed]) {
    const target = join(root, path);
    await ensureDir(dirname(target));
    await Deno.writeFile(target, actual.get(path)!);
  }
  for (const path of diff.removed) {
    await Deno.remove(join(root, path));
  }
  if (diff.removed.length > 0) {
    await removeEmptyDirs(root);
  }
}

function toRelativeKey(root: string, path: string): string {
  return relative(root, path).replace(/\\/g, '/');
}

/** Removes directories that deletions left empty. Returns true when `dir` itself was removed. */
async function removeEmptyDirs(dir: string): Promise<boolean> {
  let childCount = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isDirectory && await removeEmptyDirs(join(dir, entry.name))) continue;
    childCount++;
  }
  if (childCount > 0) return false;
  await Deno.remove(dir);
  return true;
}
