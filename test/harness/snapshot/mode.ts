/** Whether a mismatching snapshot is rewritten on disk or reported as a failure. */
export type SnapshotMode = 'write' | 'check';

/** Common options for the snapshot verification entry points. */
export type VerifyOptions = {
  /** Overrides the mode resolved from the environment. */
  mode?: SnapshotMode;
};

const FALSY_ENV_VALUES = new Set(['', '0', 'false']);

/**
 * Resolves the snapshot mode from the environment.
 *
 * `GOAST_SNAPSHOT` wins when set. Otherwise the mode is `check` on CI and `write` everywhere else,
 * so that a local run updates snapshots and CI fails on drift.
 *
 * @param get Reads an environment variable. Injectable for tests.
 */
export function resolveSnapshotMode(
  get: (key: string) => string | undefined = (key) => Deno.env.get(key),
): SnapshotMode {
  const explicit = get('GOAST_SNAPSHOT');
  if (explicit === 'write' || explicit === 'check') return explicit;
  if (explicit !== undefined && explicit !== '') {
    throw new Error(`Invalid GOAST_SNAPSHOT value: "${explicit}". Expected "write" or "check".`);
  }

  const ci = get('CI');
  return ci !== undefined && !FALSY_ENV_VALUES.has(ci) ? 'check' : 'write';
}
