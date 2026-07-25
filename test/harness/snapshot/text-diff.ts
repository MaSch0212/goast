import type { FileTree, TreeDiff } from './tree.ts';

/** The first place two text files diverge, with a few lines of context on either side. */
export type TextDifference = {
  /** 1-based line number of the divergence. */
  lineNumber: number;
  /** Context lines immediately before the divergence. */
  before: string[];
  /** The expected line, or `undefined` when the expected side ended. */
  expected: string | undefined;
  /** The actual line, or `undefined` when the actual side ended. */
  actual: string | undefined;
  /** Context lines immediately after the divergence, taken from the actual side. */
  after: string[];
};

/** Maximum files to detail in a mismatch report before summarising the rest. */
const MAX_DETAILED_FILES = 3;

/**
 * Locates the first differing line between two buffers.
 *
 * Returns `null` when they are byte-identical and `'binary'` when either side contains a NUL byte,
 * in which case a line diff would be meaningless.
 */
export function firstTextDifference(
  expected: Uint8Array,
  actual: Uint8Array,
  contextLines = 3,
): TextDifference | 'binary' | null {
  if (expected.includes(0) || actual.includes(0)) return 'binary';

  const decoder = new TextDecoder();
  const expectedLines = decoder.decode(expected).split('\n');
  const actualLines = decoder.decode(actual).split('\n');

  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i++) {
    if (expectedLines[i] === actualLines[i]) continue;
    return {
      lineNumber: i + 1,
      before: actualLines.slice(Math.max(0, i - contextLines), i),
      expected: expectedLines[i],
      actual: actualLines[i],
      after: actualLines.slice(i + 1, i + 1 + contextLines),
    };
  }
  return null;
}

/** Builds the human-readable failure message for a check-mode mismatch. */
export function formatMismatchReport(
  snapshotDir: string,
  diff: TreeDiff,
  expected: FileTree,
  actual: FileTree,
): string {
  const lines: string[] = [`Snapshot mismatch: ${snapshotDir}`, ''];

  for (const path of diff.added) lines.push(`  + ${path}`);
  for (const path of diff.changed) lines.push(`  ~ ${path}`);
  for (const path of diff.removed) lines.push(`  - ${path}`);

  const detailed = diff.changed.slice(0, MAX_DETAILED_FILES);
  for (const path of detailed) {
    lines.push('', ...formatFileDifference(path, expected.get(path)!, actual.get(path)!));
  }
  if (diff.changed.length > detailed.length) {
    lines.push('', `  ... and ${diff.changed.length - detailed.length} more changed file(s)`);
  }

  lines.push('', 'Run `deno task test:output` to update the snapshot, then commit the result.');
  return lines.join('\n');
}

/**
 * Renders a {@link TextDifference} as gutter-numbered context lines, with the expected line marked
 * `-` and the actual line marked `+`.
 */
export function formatDifferenceExcerpt(difference: TextDifference): string[] {
  const { lineNumber, before, after } = difference;
  const gutter = String(lineNumber + after.length).length;
  const pad = (n: number) => String(n).padStart(gutter, ' ');

  const lines: string[] = [];
  before.forEach((line, i) => lines.push(`   ${pad(lineNumber - before.length + i)} | ${line}`));
  if (difference.expected !== undefined) lines.push(`  -${pad(lineNumber)} | ${difference.expected}`);
  if (difference.actual !== undefined) lines.push(`  +${pad(lineNumber)} | ${difference.actual}`);
  after.forEach((line, i) => lines.push(`   ${pad(lineNumber + 1 + i)} | ${line}`));
  return lines;
}

function formatFileDifference(path: string, expected: Uint8Array, actual: Uint8Array): string[] {
  const difference = firstTextDifference(expected, actual);
  if (difference === null) return [];
  if (difference === 'binary') return [`First difference in ${path}: binary content differs`];

  return [
    `First difference in ${path} at line ${difference.lineNumber}:`,
    ...formatDifferenceExcerpt(difference),
  ];
}
