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
  for (const diagnostic of diagnostics) lines.add(renderDiagnostic(diagnostic));
  return [...lines].sort(compareRendered).map((line) => `${line}\n`).join('');
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
 * Orders rendered lines by file, then numeric line, then numeric column, then message.
 *
 * Plain string comparison would put line 10 before line 9, which makes a snapshot diff hard to read
 * for no benefit.
 */
function compareRendered(a: string, b: string): number {
  const pa = splitRendered(a);
  const pb = splitRendered(b);
  if (pa.file !== pb.file) return pa.file < pb.file ? -1 : 1;
  if (pa.line !== pb.line) return pa.line - pb.line;
  if (pa.column !== pb.column) return pa.column - pb.column;
  return pa.message < pb.message ? -1 : pa.message > pb.message ? 1 : 0;
}

function splitRendered(line: string): { file: string; line: number; column: number; message: string } {
  const match = /^(?<file>\S+?)(?::(?<line>\d+)(?::(?<column>\d+))?)? (?<message>.*)$/.exec(line);
  if (match?.groups === undefined) return { file: line, line: -1, column: -1, message: '' };
  return {
    file: match.groups.file,
    line: match.groups.line === undefined ? -1 : Number(match.groups.line),
    column: match.groups.column === undefined ? -1 : Number(match.groups.column),
    message: match.groups.message,
  };
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
