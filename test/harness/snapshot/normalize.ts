import { relative, resolve } from 'node:path';

import { repoRootDir } from '../paths.ts';
import type { FileTree } from './tree.ts';

function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const rootPathPattern = escapeRegExp(repoRootDir).replace(/\\\\/g, '(\\\\|\\\\\\\\|\\/)');
const pathPattern = new RegExp(`${rootPathPattern}[a-zA-Z0-9-_\\\\\\/.]*`, 'g');

/**
 * Rewrites absolute paths inside the repository to `<root>/`-prefixed forward-slash paths, so that
 * snapshots are identical on a Windows checkout and on Linux CI.
 */
export function normalizePaths(text: string): string {
  return text.replace(
    pathPattern,
    (path) => '<root>/' + relative(repoRootDir, resolve(path.replace(/\\\\/g, '\\'))).replace(/\\/g, '/'),
  );
}

/** Applies {@link normalizePaths} to every text file in a tree. Binary files pass through untouched. */
export function normalizeFileTree(tree: FileTree): FileTree {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const result: FileTree = new Map();

  for (const [path, bytes] of tree) {
    result.set(path, bytes.includes(0) ? bytes : encoder.encode(normalizePaths(decoder.decode(bytes))));
  }
  return result;
}
