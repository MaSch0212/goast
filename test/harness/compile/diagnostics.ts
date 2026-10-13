import { posix, relative, win32 } from 'node:path';

import { repoRootDir } from '../paths.ts';
import type { Diagnostic } from './types.ts';

/**
 * Renders diagnostics as snapshot text: one per line, `file:line:col message`.
 *
 * Sorted and deduped because the order a compiler reports in is not stable — Gradle interleaves
 * parallel subprojects, and a single `tsc` program visits files in module-graph order. Order is not
 * under test; the set of diagnostics is. A message is collapsed onto one line so that a diagnostic is
 * always exactly one snapshot line, which keeps a mismatch excerpt readable.
 */
export function formatDiagnostics(diagnostics: readonly Diagnostic[]): string {
  const lines = new Set<string>();
  for (const diagnostic of [...diagnostics].sort(compareDiagnostics)) {
    lines.add(renderDiagnostic(diagnostic));
  }
  return [...lines].map((line) => `${line}\n`).join('');
}

function renderDiagnostic(diagnostic: Diagnostic): string {
  const file = diagnostic.file === '' ? '<no file>' : diagnostic.file;
  const position = diagnostic.line === null
    ? ''
    : diagnostic.column === null
    ? `:${diagnostic.line}`
    : `:${diagnostic.line}:${diagnostic.column}`;
  return `${file}${position} ${collapse(diagnostic.message)}`;
}

/** Whitespace runs, including newlines, become a single space. */
function collapse(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

/**
 * Orders diagnostics by file, then numeric line, then numeric column, then message.
 *
 * Compares the structured fields directly rather than round-tripping through the rendered string:
 * the rendered `<no file>` sentinel contains a space, which broke an earlier regex-based
 * re-parse of the rendered line. A `null` line or column sorts before any number, so a
 * position-less diagnostic in a file precedes a positioned one in the same file.
 */
function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  const line = compareNullableNumber(a.line, b.line);
  if (line !== 0) return line;
  const column = compareNullableNumber(a.column, b.column);
  if (column !== 0) return column;
  return a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
}

/** `null` sorts before any number. */
function compareNullableNumber(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a - b;
}

/**
 * Relative path from `base` to `target`, forward-slashed — or `undefined` if `target` climbs outside
 * `base` (a `..`-prefixed result) rather than resolving to a descendant of it.
 *
 * The single place that decides what "a path relative to a unit" looks like, shared by
 * {@link relativizeDiagnostic} (ambient, host-native `path.relative`) and
 * {@link normalizeMessageUrls} (explicit `path.win32`/`path.posix`, chosen by a decoded URL's own
 * shape rather than the host's — see that function's doc comment for why).
 */
function relativeUnitPath(
  base: string,
  target: string,
  impl: { relative(from: string, to: string): string } = { relative },
): string | undefined {
  const rel = impl.relative(base, target).replace(/\\/g, '/');
  return rel === '' || rel.startsWith('../') ? undefined : rel;
}

/**
 * Rewrites a diagnostic's absolute path to a path relative to `treeDir`, forward-slashed.
 *
 * A path the compiler reported from outside the tree — a container-internal build file, a dependency —
 * is kept verbatim, because silently relativizing it would produce a `../../..` chain that encodes the
 * synthesized build's layout in the snapshot.
 */
export function relativizeDiagnostic(diagnostic: Diagnostic, treeDir: string): Diagnostic {
  if (diagnostic.file === '') return diagnostic;
  const rel = relativeUnitPath(treeDir, diagnostic.file);
  return rel === undefined ? diagnostic : { ...diagnostic, file: rel };
}

/** Any `file://` URL embedded free-form in diagnostic text, stopping at whitespace or a quote. */
const EMBEDDED_URL = /file:\/\/[^\s"'<>]+/g;

/** A Windows drive-absolute path such as `C:/foo` or `C:\foo`, as opposed to a POSIX `/foo`. */
function isWindowsDrivePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path);
}

/**
 * Decodes a `file://` URL to a plain absolute path, in whichever OS flavor the URL itself encodes: a
 * Windows drive path (`C:/foo/bar`) or a POSIX path (`/foo/bar`).
 *
 * Deliberately uses the WHATWG `URL` parser rather than `node:url`'s `fileURLToPath`, which refuses to
 * parse a *foreign*-OS URL on whichever host actually runs it — a POSIX-style URL throws `TypeError:
 * File URL path must be absolute` under Node/Deno on Windows, and the reverse is true on POSIX. That
 * host-coupling is exactly the property that made the original bug possible (see
 * {@link normalizeMessageUrls}'s doc comment): whichever host captured a diagnostic, its URL flavor
 * matched that host, and a later, differently-hosted comparison disagreed on it. Parsing manually here
 * keeps the conversion itself independent of which OS is running it, which is what lets a single test
 * process exercise both the Windows-drive and the POSIX branch and confirm they agree.
 *
 * Exported for {@link parseKotlinDiagnostics} in `parse-kotlin.ts`, which needs the identical
 * conversion for the `file:///path:line:col` diagnostics Kotlin itself emits: `node:url`'s
 * `fileURLToPath` is the wrong tool there for exactly the reason above, verified directly — it throws
 * on this repo's own Windows checkouts for the POSIX-style URLs a Linux-image compiler run produces.
 */
export function decodeFileUrl(url: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'file:') return undefined;

  const pathname = decodeURIComponent(parsed.pathname);
  // A Windows drive path is URL-encoded with a leading `/` before the drive letter (`/C:/foo`) because
  // a URL path always starts with `/`; a POSIX path's leading `/` already *is* its root, so only the
  // Windows form has one to strip.
  const withoutLeadingSlash = pathname.slice(1);
  return isWindowsDrivePath(withoutLeadingSlash) ? withoutLeadingSlash : pathname;
}

/**
 * Rewrites every `file://` URL embedded in a diagnostic's message to the same portable form
 * {@link relativizeDiagnostic} already gives the diagnostic's own `file` field: unit-relative and
 * forward-slashed when the URL points inside the unit's tree, `<root>/`-prefixed and repo-relative
 * when it points elsewhere inside the checkout, and left untouched otherwise — a path outside the repo
 * entirely (not expected in this corpus, but not assumed impossible), or one that resolves onto a
 * different drive than the checkout (no relative path exists between them; `isAbsolute` catches this,
 * since `path.relative` across Windows drives returns the target unchanged rather than a `..`-prefixed
 * climb).
 *
 * `relativizeDiagnostic` only rewrites the structured `file` field. A compiler's message can carry its
 * own `file://` URL too — `deno check`'s `TS2307`'s `not a dependency and not in import map from
 * "file://…"` clause does, and Kotlin's `e: file:///path:line:col message` format carries one as the
 * *entire* diagnostic-opening line — and that URL would otherwise survive into the committed snapshot
 * as raw text. The later repo-root normalization pass (`normalizePaths`, run by `verifyText`) matches
 * the checkout root against literal text, and a `file://` URL's boundary with the root differs by
 * platform: on Windows the root has no leading separator of its own (`E:\...`), so `file:///E:/...`
 * leaves `file:///` before the match; on POSIX the root already starts with `/` (`/home/...`), so
 * `file:///home/...` leaves only `file://` before the match — one committed snapshot, two different
 * literal strings for the identical path, depending on which platform captured it. Converting the URL
 * to a real path here, before this text is ever formatted or normalized, removes the ambiguity instead
 * of asking two separate normalizers to agree on it.
 */
export function normalizeMessageUrls(message: string, treeDir: string): string {
  return message.replace(EMBEDDED_URL, (url) => {
    const absolute = decodeFileUrl(url);
    if (absolute === undefined) return url;

    const impl = isWindowsDrivePath(absolute) ? win32 : posix;

    const relToTree = relativeUnitPath(treeDir, absolute, impl);
    if (relToTree !== undefined && !impl.isAbsolute(relToTree)) return relToTree;

    const relToRoot = relativeUnitPath(repoRootDir, absolute, impl);
    if (relToRoot !== undefined && !impl.isAbsolute(relToRoot)) return `<root>/${relToRoot}`;

    return url;
  });
}
