import { relative } from 'node:path';

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
 * Rewrites a diagnostic's absolute path to a path relative to `treeDir`, forward-slashed.
 *
 * A path the compiler reported from outside the tree — a container-internal build file, a dependency —
 * is kept verbatim, because silently relativizing it would produce a `../../..` chain that encodes the
 * synthesized build's layout in the snapshot.
 */
export function relativizeDiagnostic(diagnostic: Diagnostic, treeDir: string): Diagnostic {
  if (diagnostic.file === '') return diagnostic;
  const rel = relative(treeDir, diagnostic.file).replace(/\\/g, '/');
  if (rel === '' || rel.startsWith('../')) return diagnostic;
  return { ...diagnostic, file: rel };
}
