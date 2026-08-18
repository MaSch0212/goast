import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';

/** The task that regenerates tier 4's deviation artifacts. */
const WIRE_UPDATE_COMMAND = 'deno task test:integration';

/**
 * Where one case's deviations are committed.
 *
 * `/` in a case id becomes `__`, because ids read as `getPet/ok` and a nested directory per operation
 * would put one file in each — harder to scan than a flat, sorted list per profile.
 */
export function wireSnapshotFile(wireRootDir: string, profile: string, caseId: string): string {
  return join(wireRootDir, profile, `${caseId.replaceAll('/', '__')}.txt`);
}

/**
 * Compares one case's deviations against its committed artifact.
 *
 * A conforming case has no file, so "conforms now but an artifact is committed" needs its own
 * handling: write mode removes the stale file, check mode refuses. That refusal is what turns a
 * generator fix into a reviewable deletion instead of a silent pass — the same reasoning as tier 3's
 * `verifyCompileDiagnostics`.
 */
export async function verifyWireDeviations(
  snapshotFile: string,
  deviations: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const updateCommand = options.updateCommand ?? WIRE_UPDATE_COMMAND;

  if (deviations !== '') {
    await verifyText(snapshotFile, deviations, { mode, updateCommand });
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
      `${snapshotFile} is committed, but this case no longer deviates from the contract.\n\n` +
        `A generator fix probably landed. Run \`${updateCommand}\` and commit the deletion.`,
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`wire deviation removed ${snapshotFile}`);
}
