import { dirname } from 'node:path';

import { ensureDir } from '@std/fs';

import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { normalizePaths } from './normalize.ts';
import { firstTextDifference, formatDifferenceExcerpt } from './text-diff.ts';

const encoder = new TextEncoder();

/**
 * Compares `text` against the committed snapshot at `snapshotFile`.
 *
 * Used for snapshots that are not file trees: a generator's returned `state` object and the parsed
 * `ApiData` model. Behaves like {@link verifyFileTree} with respect to write and check modes.
 */
export async function verifyText(snapshotFile: string, text: string, options: VerifyOptions = {}): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const normalized = normalizePaths(text);

  let expected: string | undefined;
  try {
    expected = await Deno.readTextFile(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  if (expected === normalized) return;

  if (mode === 'check') {
    if (expected === undefined) {
      throw new Error(
        `Snapshot file does not exist: ${snapshotFile}\n\n` +
          'Run `deno task test:output` to create it, then commit the result.',
      );
    }
    throw new Error(formatTextMismatch(snapshotFile, expected, normalized));
  }

  await ensureDir(dirname(snapshotFile));
  await Deno.writeTextFile(snapshotFile, normalized);
  console.info(`snapshot updated ${snapshotFile}`);
}

function formatTextMismatch(snapshotFile: string, expected: string, actual: string): string {
  const lines = [`Snapshot mismatch: ${snapshotFile}`, ''];
  const difference = firstTextDifference(encoder.encode(expected), encoder.encode(actual));

  if (difference !== null && difference !== 'binary') {
    lines.push(`First difference at line ${difference.lineNumber}:`, ...formatDifferenceExcerpt(difference));
  }

  lines.push('', 'Run `deno task test:output` to update the snapshot, then commit the result.');
  return lines.join('\n');
}
