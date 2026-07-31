import { join } from 'node:path';

import { type CompileUnit, type Diagnostic, relativizeDiagnostic } from '@goast/test-harness';
import { parseDenoCheckDiagnostics } from '../../harness/compile/parse-deno-check.ts';
import { normalizeMessageUrls } from './normalize-message-urls.ts';

/**
 * Barrel files a unit is checked through. Every one that exists is passed to the same `deno check`
 * invocation together (a `fetch-clients` unit has both `models.ts` and `clients.ts`, and checking them
 * in one program is what lets `clients.ts`'s imports of `models.ts` be resolved rather than re-checked
 * from scratch).
 */
const ENTRY_POINTS = ['models.ts', 'clients.ts'];

/**
 * Type-checks TypeScript units on the host with `deno check`.
 *
 * `--no-lock` because the corpus is not a Deno project and has no lockfile to honour.
 * `--unstable-sloppy-imports` because the corpus is generated for npm/bundler consumption and its
 * relative imports carry no `.ts` extension by design (a normal, valid style under `moduleResolution:
 * "bundler"`/`"node16"`) — Deno's native resolver otherwise rejects every single one of them with
 * `TS2307`, which would drown the two or three genuine defects this gate exists to surface under
 * hundreds of unrelated "add a '.ts' extension" errors. Confirmed empirically: without the flag, every
 * unit in the corpus fails; with it, only the units already named as known defects
 * (`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` defects 7 and 18) do.
 * `env: { NO_COLOR: '1' }` because `deno check` colorizes its output whenever it judges stdout/stderr
 * to be a terminal — true in some CI and shell setups even when the stream is piped — and the parser
 * is anchored on plain text.
 *
 * Deno writes diagnostics to stderr and progress to stdout, so both are captured and concatenated — a
 * format change that moved diagnostics between the two streams would otherwise silently empty the gate.
 */
export async function runDenoCheck(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>();

  for (const unit of units) {
    const entries: string[] = [];
    for (const entry of ENTRY_POINTS) {
      const path = join(unit.treeDir, entry);
      try {
        await Deno.lstat(path);
        entries.push(path);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    }
    if (entries.length === 0) {
      throw new Error(
        `No entry point in ${unit.treeDir}. Expected one of: ${ENTRY_POINTS.join(', ')}. ` +
          'A unit with no barrel cannot be type-checked as a whole; add its barrel name to ENTRY_POINTS.',
      );
    }

    const command = new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-lock', '--unstable-sloppy-imports', ...entries],
      env: { NO_COLOR: '1' },
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);

    const diagnostics = parseDenoCheckDiagnostics(output)
      .map((diagnostic) => relativizeDiagnostic(diagnostic, unit.treeDir))
      .map((diagnostic) => ({ ...diagnostic, message: normalizeMessageUrls(diagnostic.message, unit.treeDir) }));

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `deno check exited ${code} for ${unit.id} but no diagnostics were parsed. ` +
          'The output format has probably changed; the gate would be vacuously green.\n\n' + output,
      );
    }

    results.set(unit.id, diagnostics);
  }

  return results;
}
