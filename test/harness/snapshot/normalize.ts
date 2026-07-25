import { relative, resolve } from 'node:path';

import { repoRootDir } from '../paths.ts';
import type { FileTree } from './tree.ts';

function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * One path separator, in any spelling generated output is known to use: a doubled backslash (how
 * `util.inspect` escapes a Windows separator inside a string literal), a lone native backslash, or a
 * forward slash. Doubled first, so an escaped separator is consumed as one separator rather than
 * matching the lone-backslash alternative twice.
 */
const SEPARATOR = String.raw`(?:\\\\|\\|/)`;

/** A character that may appear inside a path, once the root has matched. */
const PATH_CHAR = String.raw`[a-zA-Z0-9_.\\/-]`;

/**
 * A character that, adjacent to the root, means the root is really just part of a longer name.
 *
 * Both boundaries matter. Without the leading one, a short root such as `/w` matches inside the JSON
 * pointer `…/properties/w` and silently corrupts it; without the trailing one, the same root matches
 * the prefix of `/wibble`.
 */
const TOKEN_CHAR = String.raw`[a-zA-Z0-9_.-]`;

function buildPathPattern(root: string): RegExp {
  const rootPattern = escapeRegExp(root).replace(/\\\\/g, SEPARATOR);
  return new RegExp(
    `(?<!${TOKEN_CHAR})${rootPattern}(?:${SEPARATOR}${PATH_CHAR}*)?(?!${TOKEN_CHAR})`,
    'g',
  );
}

const patternCache = new Map<string, RegExp>();

function pathPatternFor(root: string): RegExp {
  let pattern = patternCache.get(root);
  if (pattern === undefined) {
    pattern = buildPathPattern(root);
    patternCache.set(root, pattern);
  }
  return pattern;
}

/**
 * {@link normalizePaths}, against an explicit root.
 *
 * Exposed so tests can pin behaviour for roots the real checkout cannot reproduce — a root short
 * enough to occur inside ordinary content, for instance.
 */
export function normalizePathsUnderRoot(text: string, root: string): string {
  return text.replace(pathPatternFor(root), (path) => {
    const rest = relative(root, resolve(path.replace(/\\\\/g, '\\'))).replace(/\\/g, '/');
    // The root itself carries no relative remainder; `<root>/` with nothing after it would read as a
    // path to the root's first child.
    return rest === '' ? '<root>' : `<root>/${rest}`;
  });
}

/**
 * Rewrites absolute paths inside the repository to `<root>/`-prefixed forward-slash paths, so that
 * snapshots are identical on a Windows checkout and on Linux CI.
 */
export function normalizePaths(text: string): string {
  return normalizePathsUnderRoot(text, repoRootDir);
}

/** Applies {@link normalizePaths} to every text file in a tree. Binary files pass through untouched. */
export function normalizeFileTree(tree: FileTree): FileTree {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const result: FileTree = new Map();

  for (const [path, bytes] of tree) {
    const text = decoder.decode(bytes);
    const normalized = normalizePaths(text);
    result.set(path, bytes.includes(0) || normalized === text ? bytes : encoder.encode(normalized));
  }
  return result;
}
