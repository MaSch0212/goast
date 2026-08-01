import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';
import { formatDiagnostics } from './diagnostics.ts';
import type { CompileUnit, Diagnostic } from './types.ts';

/**
 * The task that regenerates tier 3's snapshots.
 *
 * Every message this file produces names it, including the ones it delegates to {@link verifyText}:
 * that engine defaults to tier 2's `deno task test:output`, which regenerates nothing under
 * `test/compile/` and would leave a newly-failing unit failing with the same message.
 */
const COMPILE_UPDATE_COMMAND = 'deno task test:compile';

/** Where a unit's diagnostics are committed. */
export function compileSnapshotFile(compileRootDir: string, unit: CompileUnit): string {
  return join(compileRootDir, unit.language, unit.profile, unit.versionDir, `${unit.spec}.txt`);
}

/**
 * Compares a unit's diagnostics against its committed snapshot.
 *
 * A clean unit has no file, so "compiles now but a snapshot is committed" needs its own handling that
 * {@link verifyText} does not provide: write mode removes the stale file, and check mode refuses. That
 * refusal is what turns a generator fix into a reviewable deletion instead of a silent pass — the same
 * reasoning as the committed `.error.txt` handling in `snapshot/verify-profile.ts`.
 */
export async function verifyCompileDiagnostics(
  snapshotFile: string,
  diagnostics: readonly Diagnostic[],
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const updateCommand = options.updateCommand ?? COMPILE_UPDATE_COMMAND;

  if (diagnostics.length > 0) {
    await verifyText(snapshotFile, formatDiagnostics(diagnostics), { mode, updateCommand });
    return;
  }

  let exists = true;
  try {
    await Deno.lstat(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    exists = false;
  }
  if (!exists) return;

  if (mode === 'check') {
    throw new Error(
      `${snapshotFile} is committed, but this unit no longer fails to compile.\n\n` +
        `A generator fix probably landed. Run \`${updateCommand}\` and commit the deletion.`,
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`snapshot removed ${snapshotFile}`);
}
