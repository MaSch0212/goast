import { join } from 'node:path';

import { captureConsole } from './capture-console.ts';
import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { serializeValue } from './serialize.ts';
import { verifyGeneratedTree } from './verify-file-tree.ts';
import { verifyText } from './verify-text.ts';

/** Where one profile-and-spec pair keeps its three possible snapshots. */
export type ProfileSnapshot = {
  /** Directory holding the generated file tree. */
  treeDir: string;
  /** Serialized generator state, beside the tree so the tree holds only generated source. */
  stateFile: string;
  /** Generation error message, present only when generation fails. */
  errorFile: string;
};

/** Derives the three snapshot paths for a spec inside a profile's version directory. */
export function profileSnapshotPaths(baseDir: string, specName: string): ProfileSnapshot {
  return {
    treeDir: join(baseDir, specName),
    stateFile: join(baseDir, `${specName}.state.txt`),
    errorFile: join(baseDir, `${specName}.error.txt`),
  };
}

/**
 * Gates one profile-and-spec pair on all of its snapshots.
 *
 * On success the file tree and the serialized `state` must both match, and every mismatch is
 * reported in one run rather than the first one hiding the rest. On failure the error message
 * becomes the snapshot and the tree is dropped — a partially written tree is order-dependent and
 * says nothing useful — so a generator crash is a reviewable committed fact instead of a red test.
 *
 * A pair has exactly one of the two forms. Holding both an error file and a tree is a failure.
 */
export async function verifyProfile(
  snapshot: ProfileSnapshot,
  generate: (outputDir: string) => unknown,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const outputDir = await Deno.makeTempDir({ prefix: 'goast-snapshot-' });

  try {
    const run = await captureConsole(() => generate(outputDir));

    if (!run.ok) {
      const message = formatGenerationError(run.error, outputDir) + '\n';

      if (mode === 'check') {
        // A committed error snapshot that still matches is a pass: the recorded failure is the
        // expected outcome. Only a *changed* failure, or a leftover tree, is a problem.
        const failures: string[] = [];
        for (const stale of [snapshot.treeDir, snapshot.stateFile]) {
          if (await pathExists(stale)) {
            failures.push(
              `Generation failed, but ${stale} is still committed. Run \`deno task test:output\` ` +
                'and commit the result.',
            );
          }
        }
        try {
          await verifyText(snapshot.errorFile, message, { mode });
        } catch (error) {
          failures.push(
            [
              `Generation failed for ${snapshot.treeDir}`,
              '',
              message.trimEnd(),
              ...(run.output ? ['', 'Generator output:', run.output.trimEnd()] : []),
              '',
              error instanceof Error ? error.message : String(error),
            ].join('\n'),
          );
        }
        if (failures.length > 0) throw new Error(failures.join('\n\n'));
        return;
      }

      await removePath(snapshot.treeDir, { recursive: true });
      await removePath(snapshot.stateFile);
      await verifyText(snapshot.errorFile, message, { mode });
      return;
    }

    if (await pathExists(snapshot.errorFile)) {
      if (mode === 'check') {
        throw new Error(
          `Generation for ${snapshot.treeDir} no longer fails, but ${snapshot.errorFile} is still ` +
            'committed. Run `deno task test:output` and commit the result.',
        );
      }
      await removePath(snapshot.errorFile);
    }

    const failures: string[] = [];
    for (
      const verify of [
        () => verifyGeneratedTree(snapshot.treeDir, outputDir, { mode }),
        () => verifyText(snapshot.stateFile, serializeValue(run.value) + '\n', { mode }),
      ]
    ) {
      try {
        await verify();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (failures.length > 0) throw new Error(failures.join('\n\n'));
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
}

/**
 * Renders a generation failure as snapshot text.
 *
 * The stack is deliberately dropped: it carries line numbers that churn on unrelated edits. The
 * generation directory is rewritten to `<output>` because it is a fresh temp path on every run and
 * `normalizePaths` only knows about paths inside the repository.
 */
function formatGenerationError(error: unknown, outputDir: string): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  let replaced = text;
  for (const variant of outputDirSpellings(outputDir)) {
    replaced = replaced.split(variant).join('<output>');
  }
  return replaced.replace(/<output>[\\/][^\s"']*/g, (path) => path.replace(/\\/g, '/'));
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function removePath(path: string, options: Deno.RemoveOptions = {}): Promise<void> {
  try {
    await Deno.remove(path, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
