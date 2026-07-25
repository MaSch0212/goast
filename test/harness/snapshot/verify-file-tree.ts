import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { normalizeFileTree } from './normalize.ts';
import { formatMismatchReport } from './text-diff.ts';
import { applyTreeDiff, diffFileTrees, formatDiffCounts, isEmptyDiff, readFileTree } from './tree.ts';

/**
 * Compares the tree produced by `generate` against the committed snapshot at `snapshotDir`.
 *
 * In `write` mode the snapshot is updated to match and the check passes, so the change surfaces as a
 * regular git diff. In `check` mode a mismatch throws.
 *
 * @param snapshotDir Directory holding the committed snapshot.
 * @param generate Writes the generated files into the directory it is handed.
 */
export async function verifyFileTree(
  snapshotDir: string,
  generate: (outputDir: string) => Promise<void> | void,
  options: VerifyOptions = {},
): Promise<void> {
  const outputDir = await Deno.makeTempDir({ prefix: 'goast-snapshot-' });
  try {
    await generate(outputDir);
    await verifyGeneratedTree(snapshotDir, outputDir, options);
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
}

/**
 * Compares an already-populated `outputDir` against the committed snapshot at `snapshotDir`.
 *
 * Split out of {@link verifyFileTree} so a caller that needs the generator's return value can run
 * the generation itself and still reuse the reconciliation.
 */
export async function verifyGeneratedTree(
  snapshotDir: string,
  outputDir: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const actual = normalizeFileTree(await readFileTree(outputDir));
  const expected = await readFileTree(snapshotDir);

  // Safety rail: a generator that throws early or silently emits nothing must not be able to
  // delete a *populated* committed snapshot in write mode. A generator that legitimately emits
  // zero files (e.g. a spec with no components/schemas) is fine as long as the committed
  // snapshot is empty or absent too.
  if (actual.size === 0 && expected.size > 0) {
    throw new Error(
      `Generation produced no files for snapshot "${snapshotDir}". Refusing to continue, ` +
        `because write mode would delete the entire snapshot.`,
    );
  }

  const diff = diffFileTrees(expected, actual);
  if (isEmptyDiff(diff)) return;

  if (mode === 'check') {
    throw new Error(formatMismatchReport(snapshotDir, diff, expected, actual));
  }

  await applyTreeDiff(snapshotDir, actual, diff);
  console.info(`snapshot updated ${snapshotDir}: ${formatDiffCounts(diff)}`);
}
