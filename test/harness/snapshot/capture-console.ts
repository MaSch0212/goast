import * as util from 'node:util';

/** The outcome of a captured run, with whatever the function printed. */
export type CaptureResult<T> =
  | { ok: true; value: T; output: string }
  | { ok: false; error: unknown; output: string };

/**
 * Runs `fn` with `console` output collected rather than printed, and reports the outcome instead of
 * throwing.
 *
 * The generators log a line per generated file with no way to turn it off, which would bury the
 * per-profile snapshot summary across hundreds of profile-and-spec pairs. Callers print the captured
 * output only when the run failed.
 *
 * Patches a global, so runs must not overlap. Test files execute sequentially — do not pass
 * `--parallel` to `deno test`.
 */
export async function captureConsole<T>(fn: () => Promise<T> | T): Promise<CaptureResult<T>> {
  const chunks: string[] = [];
  const capture = (...args: unknown[]) => {
    chunks.push(util.format(...args) + '\n');
  };

  const originals = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
    error: console.error,
  };
  Object.assign(console, { log: capture, info: capture, warn: capture, debug: capture, error: capture });

  try {
    const value = await fn();
    return { ok: true, value, output: chunks.join('') };
  } catch (error) {
    return { ok: false, error, output: chunks.join('') };
  } finally {
    Object.assign(console, originals);
  }
}
