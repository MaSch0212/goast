import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';

/** The task that regenerates the `k6-clients` target's record. */
const K6_UPDATE_COMMAND = 'deno task test:integration:k6';

/**
 * Where a target's load failure is committed.
 *
 * `__load-failure.txt` cannot collide with a per-case artifact: `wireSnapshotFile` builds those by replacing
 * `/` with `__` in a case id, and no case id starts with a separator, so no per-case name can begin `__`.
 */
export function targetFailureFile(wireRootDir: string, profile: string): string {
  return join(wireRootDir, profile, '__load-failure.txt');
}

/**
 * Compares a target's load failure against its committed record.
 *
 * The sibling of `verifyWireDeviations`, with the same three-way contract — write, delete-when-fixed, refuse in
 * check — and for the same reason: a generator fix has to show up as a reviewable deletion rather than as a
 * silent pass.
 *
 * What differs is what the file *means*. A per-case artifact says "this case behaves differently from the
 * contract". This one says "the generated code could not be loaded at all, so **no case was measured**". That
 * distinction is load-bearing, because tier 4's central rule is that an absent per-case artifact means the case
 * conforms — and for a target in this state, the absence of all 19 means nothing of the sort. The orphan sweep
 * and `test/README.md` both have to know that, which is why `WIRE_TARGETS` carries the state rather than it
 * being inferred from a file's presence.
 */
export async function verifyTargetLoadFailure(
  snapshotFile: string,
  failure: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const updateCommand = options.updateCommand ?? K6_UPDATE_COMMAND;

  if (failure !== '') {
    await verifyText(snapshotFile, failure, { mode, updateCommand });
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
      `${snapshotFile} is committed, but this target no longer fails to load.\n\n` +
        `A generator fix probably landed. Run \`${updateCommand}\` and commit the deletion — and note that ` +
        `this target can now drive cases, so its entry in test/integration/targets.ts should lose its ` +
        `\`state: 'load-failure'\` and the leg should start recording per-case artifacts.`,
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`target load failure removed ${snapshotFile}`);
}
