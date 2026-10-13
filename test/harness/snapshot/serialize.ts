import * as util from 'node:util';

import { normalizePaths } from './normalize.ts';

/**
 * Renders a value as snapshot text. Keys are sorted, so a snapshot does not depend on property
 * insertion order. Strings pass through so callers can mix pre-rendered text into the same snapshot.
 */
export function serializeValue(value: unknown, depth: number = 100): string {
  return typeof value === 'string' ? value : util.inspect(value, { depth, sorted: true });
}

/**
 * Rewrites every string reachable from `value` through `replace`, **in place**.
 *
 * In place, and not on a clone, on purpose. `util.inspect` renders a value's class name and labels
 * repeated references as `<ref *1>` / `[Circular *1]`, so a clone would serialize differently from
 * the original — the very thing a snapshot is pinning. The values passed here are throwaway (a
 * generator's returned state, a freshly parsed `ApiData`), so mutating them costs nothing.
 *
 * `seen` guards the cyclic graphs this walks: a parsed document references itself, and the committed
 * core-model snapshots carry `[Circular *N]` markers to prove it.
 */
export function rewriteStrings(
  value: unknown,
  replace: (text: string) => string,
  seen: Set<object> = new Set<object>(),
): void {
  if (typeof value !== 'object' || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);

  if (value instanceof Map) {
    for (const [key, entry] of value) {
      if (typeof entry === 'string') {
        const replaced = replace(entry);
        // Re-setting an existing key keeps its position, so insertion order survives.
        if (replaced !== entry) value.set(key, replaced);
      } else {
        rewriteStrings(entry, replace, seen);
      }
      rewriteStrings(key, replace, seen);
    }
    return;
  }

  if (value instanceof Set) {
    const entries = [...value];
    if (entries.some((entry) => typeof entry === 'string' && replace(entry) !== entry)) {
      value.clear();
      for (const entry of entries) value.add(typeof entry === 'string' ? replace(entry) : entry);
    }
    for (const entry of value) rewriteStrings(entry, replace, seen);
    return;
  }

  // Own enumerable properties only — array indices included, since an array's elements are exactly
  // that. Anything on the prototype belongs to the class, not to this value's snapshot.
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      const replaced = replace(entry);
      if (replaced !== entry) (value as Record<string, unknown>)[key] = replaced;
    } else {
      rewriteStrings(entry, replace, seen);
    }
  }
}

/**
 * Serializes `value` with machine-specific paths already rewritten.
 *
 * The rewriting happens on the **values**, before serialization, and that ordering is the whole
 * point. `util.inspect` decides whether to break an object across lines from the rendered width of
 * what it is given, so normalizing the finished text leaves the line layout encoding the length of
 * whatever absolute path the machine happened to use — a snapshot written on a Windows checkout then
 * fails on Linux CI purely because `/tmp/…` is shorter than `C:\Users\…\Temp\…`.
 *
 * Every snapshot kind that serializes a value goes through here, so the two cannot drift apart
 * again.
 *
 * When `extraReplace` is the output-directory neutralizer, it runs **before** `normalizePaths`, not
 * after: `outputDir` can itself sit inside `repoRootDir` (nothing stops `TMPDIR`/`TEMP` from pointing
 * into the working tree), and if `normalizePaths` ran first it would consume the leaked path's
 * `repoRootDir` prefix and leave the random per-run directory name — the one part of the path that is
 * never machine-independent — sitting in the committed snapshot. Running the output-directory
 * replacement first avoids this, and produces identical output to the old order in the ordinary case
 * where the two roots are disjoint. `normalizeFileTree` in `./normalize.ts` composes the same two
 * functions, in the same order, for the same reason — the two must not drift apart on this either.
 */
export function serializeNormalized(value: unknown, extraReplace?: (text: string) => string): string {
  const replace = extraReplace ? (text: string) => normalizePaths(extraReplace(text)) : normalizePaths;
  // A pre-rendered string has no structure to walk; `serializeValue` passes it through verbatim.
  if (typeof value === 'string') return replace(value);

  rewriteStrings(value, replace);
  return serializeValue(value);
}
