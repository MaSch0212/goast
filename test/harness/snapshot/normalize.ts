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

/**
 * Applies {@link replaceOutputDir} and {@link normalizePaths} to every text file in a tree, in that
 * order. Binary files pass through untouched.
 *
 * `outputDir` is required, not optional: an optional parameter would let a future caller silently
 * skip the output-directory neutralizer, which is exactly the gap that let a generator's leaked
 * absolute path reach a committed snapshot undetected (`replaceOutputDir` was applied to `state.txt`
 * and to generation-error text, but never to tree file content, until this was found and fixed).
 *
 * Order matters and is not arbitrary: `outputDir` can itself sit inside `repoRootDir` (nothing stops
 * `TMPDIR`/`TEMP` from pointing into the working tree), and if `normalizePaths` ran first it would
 * consume the leaked path's `repoRootDir` prefix and leave the random per-run directory name — the
 * exact non-machine-independent text this function exists to remove — sitting in the committed
 * snapshot as `<root>/tmp/goast-snapshot-abc123/…`. Running `replaceOutputDir` first avoids this: it
 * yields `<output>/…`, which no longer contains `repoRootDir`, so `normalizePaths` has nothing left to
 * match there. In the ordinary case — `outputDir` outside the checkout entirely — the two roots are
 * disjoint and the two passes don't interact, so this order produces identical output to the old one.
 * {@link serializeNormalized} composes the same two functions for `state.txt`, in the same order, for
 * the same reason: if the two artifacts disagreed on order, a leaked path inside the checkout would
 * be neutralized in one and not the other.
 */
export function normalizeFileTree(tree: FileTree, outputDir: string): FileTree {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const result: FileTree = new Map();

  for (const [path, bytes] of tree) {
    const text = decoder.decode(bytes);
    const normalized = normalizePaths(replaceOutputDir(text, outputDir));
    result.set(path, bytes.includes(0) || normalized === text ? bytes : encoder.encode(normalized));
  }
  return result;
}

/**
 * Rewrites every occurrence of `outputDir` in `text` to `<output>`, with separators normalized to
 * forward slashes.
 *
 * The temp directory differs on every run — it is never machine-independent — so any spelling of
 * it that leaks into snapshot text (an error message, a generator's serialized `state`, or — the
 * case that motivated moving this here — a generator's own generated source, when a naming bug
 * makes it emit an absolute path instead of a relative import) must be neutralized before the text
 * is compared or committed. A generator is free to render the path using the platform-native
 * separator, a forward-slash spelling, or — inside a `util.inspect` string literal, as generator
 * `state` objects often are — a doubled-backslash spelling (every backslash in the whole string is
 * escaped, including the separators *after* the directory, not just the ones inside it). Doubled
 * first so it is consumed before the shorter native spelling can partially match inside it.
 *
 * Once the directory itself is replaced, the trailing path (e.g. `\models.ts`, or its escaped form
 * `\\models.ts`) still carries whichever separator style its match used. Two backslash characters
 * always mean one escaped separator, so they collapse to a single `/` first; only then are any
 * remaining lone backslashes — the unescaped-native case — turned into `/` too. Collapsing pairs
 * before singles keeps an escaped separator from becoming two slashes instead of one.
 *
 * That trailing-path pass only runs when a replacement actually happened. Its regex matches any
 * literal `<output>` already present in the input, not just one this function just produced, and
 * unconditionally rewrites every backslash in the run that follows — harmless when this only ever
 * saw `util.inspect` dumps and error text, but this is now applied to every text file of every
 * generated tree (see {@link normalizeFileTree}), where an unrelated `<output>` substring followed by
 * literal backslashes is content this function must leave alone.
 */
export function replaceOutputDir(text: string, outputDir: string): string {
  let replaced = text;
  let matched = false;
  for (const variant of outputDirSpellings(outputDir)) {
    if (!replaced.includes(variant)) continue;
    matched = true;
    replaced = replaced.split(variant).join('<output>');
  }
  if (!matched) return replaced;
  return replaced.replace(
    /<output>([^\s"']*)/g,
    (_match, rest: string) => `<output>${rest.replace(/\\\\/g, '/').replace(/\\/g, '/')}`,
  );
}

/**
 * Every separator spelling of `outputDir` that generated output is known to use, longest first.
 *
 * Mirrors {@link normalizePaths}, which matches native, forward-slash, and doubled-backslash
 * spellings of the repo root for the same reason: a generator is free to render a path with any of
 * the three, and a literal single-spelling match would let the other two leak the (per-run, never
 * machine-independent) temp directory into a committed snapshot. Longest first so the doubled-
 * backslash spelling — which contains the native spelling as a substring on Windows — is consumed
 * before the shorter spelling can partially match inside it.
 */
function outputDirSpellings(outputDir: string): string[] {
  const spellings = new Set([outputDir, outputDir.replace(/\\/g, '/'), outputDir.replace(/\\/g, '\\\\')]);
  return [...spellings].sort((a, b) => b.length - a.length);
}
