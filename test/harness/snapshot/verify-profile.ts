import { join } from 'node:path';

import { captureConsole } from './capture-console.ts';
import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { serializeNormalized } from './serialize.ts';
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
        // Normalized on the *value*, before serialization: `util.inspect` chooses its line breaks
        // from the rendered width of what it is handed, so rewriting the finished text would leave
        // the layout encoding the length of this machine's temp path.
        () =>
          verifyText(
            snapshot.stateFile,
            serializeNormalized(run.value, (text) => replaceOutputDir(text, outputDir)) + '\n',
            { mode },
          ),
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
 * generation directory is rewritten to `<output>` via {@link replaceOutputDir} because it is a
 * fresh temp path on every run and `normalizePaths` only knows about paths inside the repository.
 */
function formatGenerationError(error: unknown, outputDir: string): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return replaceOutputDir(text, outputDir);
}

/**
 * Rewrites every occurrence of `outputDir` in `text` to `<output>`, with separators normalized to
 * forward slashes.
 *
 * The temp directory differs on every run — it is never machine-independent — so any spelling of
 * it that leaks into snapshot text (an error message, or a generator's serialized `state`) must be
 * neutralized before the text is compared or committed. A generator is free to render the path
 * using the platform-native separator, a forward-slash spelling, or — inside a `util.inspect`
 * string literal, as generator `state` objects often are — a doubled-backslash spelling (every
 * backslash in the whole string is escaped, including the separators *after* the directory, not
 * just the ones inside it). Doubled first so it is consumed before the shorter native spelling can
 * partially match inside it.
 *
 * Once the directory itself is replaced, the trailing path (e.g. `\models.ts`, or its escaped form
 * `\\models.ts`) still carries whichever separator style its match used. Two backslash characters
 * always mean one escaped separator, so they collapse to a single `/` first; only then are any
 * remaining lone backslashes — the unescaped-native case — turned into `/` too. Collapsing pairs
 * before singles keeps an escaped separator from becoming two slashes instead of one.
 */
function replaceOutputDir(text: string, outputDir: string): string {
  let replaced = text;
  for (const variant of outputDirSpellings(outputDir)) {
    replaced = replaced.split(variant).join('<output>');
  }
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
