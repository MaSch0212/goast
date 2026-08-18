import { walk } from '@std/fs/walk';

import { type CompileUnit, type Diagnostic, normalizeMessageUrls, relativizeDiagnostic } from '@goast/test-harness';
import { isUnparseableModuleMessage, parseDenoCheckDiagnostics } from '../../harness/compile/parse-deno-check.ts';

/**
 * Per-unit ceiling on one `deno check` invocation, after which the unit is a harness failure.
 *
 * `runTsc` and `runKotlin` both bound their compiler and both treat a timeout as a harness failure
 * rather than a clean unit, because a killed run's output is whatever happened to be flushed before the
 * signal landed. This runner had no bound at all, which was the one place the three runners' shared
 * contract genuinely diverged. The impact is low — no host unit imports a bare specifier, so `deno
 * check` never touches the network — so the value only has to be far enough above the real cost (a
 * fraction of a second per unit, ~25 files at most) to never fire on a healthy run.
 */
const TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Type-checks TypeScript units on the host with `deno check`.
 *
 * **Every `.ts` file in the unit is passed to `deno check`, not an entry point.** Handing it a barrel
 * and letting it follow imports checks only what the barrel reaches, and 41 of the 108 host units
 * contain at least one unreachable file — 58 files, measured: `utils/fetch-client.utils.ts` in the 38
 * `fetch-clients` units whose spec generates no client, plus 20 generated *model* files that the
 * generator emits and then never exports (`models/.ts`, `models/a_1.ts`, `models/my-thing_1..4.ts`,
 * `models/thing-2_1.ts`, `models/_1.ts`, `models/_2.ts` across `v3/extreme-names`,
 * `v3/name-collisions` and `v3/non-ascii-names` in both profiles). Those are precisely the files
 * defects 18, 21 and 22 are about, so an entry-point gate was blind to the defects it existed to
 * catch: `test/compile/typescript/angular-services/v3/non-ascii-names.txt` (container group, globs
 * files) recorded 12 diagnostics from `models/.ts`, `_1.ts` and `_2.ts` while
 * `test/compile/typescript/models/v3/non-ascii-names.txt` (host group, followed imports) recorded one
 * unrelated `TS2307` — same files, same defect, two answers.
 *
 * `--no-lock` because the corpus is not a Deno project and has no lockfile to honour.
 * `--unstable-sloppy-imports` because the corpus is generated for npm/bundler consumption and its
 * relative imports carry no `.ts` extension by design (a normal, valid style under `moduleResolution:
 * "bundler"`/`"node16"`) — Deno's native resolver otherwise rejects every single one of them with
 * `TS2307`, which would drown the two or three genuine defects this gate exists to surface under
 * hundreds of unrelated "add a '.ts' extension" errors.
 * `env: { NO_COLOR: '1' }` because `deno check` colorizes its output whenever it judges stdout/stderr
 * to be a terminal — true in some CI and shell setups even when the stream is piped — and the parser
 * is anchored on plain text.
 *
 * Deno writes diagnostics to stderr and progress to stdout, so both are captured and concatenated — a
 * format change that moved diagnostics between the two streams would otherwise silently empty the gate.
 */
export async function runDenoCheck(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const filesByUnit = new Map<string, string[]>();
  for (const unit of units) {
    filesByUnit.set(unit.id, await collectTypeScriptFiles(unit.treeDir));
  }

  // The per-unit coverage assertion the other two runners have and this one lacked: `runTsc` requires
  // each unit to contribute at least one root file to the tsc program, and `runKotlin` requires each
  // unit's Gradle task to report something other than NO-SOURCE. With a file list rather than an entry
  // point, the equivalent is direct — a unit that contributed no files compiles trivially and reports
  // nothing, which is indistinguishable from a genuinely clean unit.
  const uncovered = units.filter((unit) => filesByUnit.get(unit.id)!.length === 0);
  if (uncovered.length > 0) {
    throw new Error(
      `${uncovered.length} unit(s) contributed no TypeScript files to deno check: ` +
        `${uncovered.map((u) => u.id).join(', ')}. Their tree holds no \`.ts\` file at all; a unit ` +
        'reporting no diagnostics for this reason has not actually been checked.',
    );
  }

  const results = new Map<string, Diagnostic[]>();
  for (const unit of units) {
    results.set(unit.id, await checkUnit(unit, filesByUnit.get(unit.id)!));
  }
  return results;
}

/**
 * Every `.ts` file under a unit's tree, sorted so the argument list is reproducible.
 *
 * Matched on the file *name*, not with `walk`'s `exts` filter: `extname('.ts')` is `''`, because a
 * leading-dot name is a dotfile with no extension, so an extension filter silently drops the
 * `models/.ts` file that defect 18/21 produces in six of these units. That is the same dot-file trap
 * `runTsc`'s `include` glob fell into, arrived at from the other direction.
 *
 * A missing tree returns no files rather than throwing, so the caller's coverage assertion — which
 * names the unit — reports it instead of a bare `NotFound` from the walk.
 */
async function collectTypeScriptFiles(treeDir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of walk(treeDir, { includeDirs: false, includeSymlinks: false })) {
      if (entry.name.endsWith('.ts')) files.push(entry.path);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return files.sort();
}

/** Windows paths compare case-insensitively, and `deno check` can echo a differently-cased drive letter. */
function pathKey(path: string): string {
  return Deno.build.os === 'windows' ? path.toLowerCase() : path;
}

/**
 * Type-checks one unit, working around `deno check`'s fatal abort on an unparseable module.
 *
 * `deno check` will not build a module graph containing a file it cannot parse: it prints one
 * {@link UNPARSEABLE_MODULE_PREFIX} error, exits non-zero, and type-checks *nothing else*. Verified
 * directly, and it holds whether the unparseable file is a root or only imported: a three-file spike
 * (`a.ts` importing a syntactically broken `b.ts`, plus an independent `c.ts` with a type error)
 * reports only `b.ts`'s parse error, with `c.ts`'s `TS2322` appearing only once `b.ts` leaves the
 * graph. It also reports only the *first* such file, not all of them.
 *
 * That is the same shape as the `tsc` short-circuit Task 4 removed from the container group, and it
 * matters here because six of these units contain `models/.ts`, whose content is `export type  = {`.
 * So: record the parse failure as the diagnostic it is, drop that file from the root list, and run
 * again — each pass removes exactly one file, so this terminates in at most one run per file. The
 * alternative is one generator-emitted syntax error hiding every other diagnostic in its unit.
 *
 * A file that cannot be dropped because it is not a root — it is reachable through an import from one —
 * is a loud failure rather than a partial result. That is the state the corpus would reach if defect 18
 * (the unresolvable `'<output>/models/.ts'` specifier that currently keeps this file out of the graph)
 * were fixed while defect 21 (its empty name) were not, and there is no honest way to report the rest
 * of such a unit as clean.
 */
async function checkUnit(unit: CompileUnit, files: readonly string[]): Promise<Diagnostic[]> {
  const roots = new Map(files.map((file) => [pathKey(file), file]));
  const parseFailures: Diagnostic[] = [];

  for (let attempt = 0; attempt <= files.length; attempt++) {
    const { code, output, timedOut } = await denoCheck([...roots.values()]);

    if (timedOut) {
      throw new Error(
        `deno check timed out after ${TIMEOUT_MS}ms for ${unit.id}. Its output cannot be trusted as a ` +
          `complete result.\n\n${output}`,
      );
    }

    const diagnostics = parseDenoCheckDiagnostics(output);
    const unparseable = diagnostics.filter((d) => isUnparseableModuleMessage(d.message));

    if (unparseable.length === 0) {
      if (code !== 0 && diagnostics.length === 0) {
        throw new Error(
          `deno check exited ${code} for ${unit.id} but no diagnostics were parsed. ` +
            'The output format has probably changed; the gate would be vacuously green.\n\n' + output,
        );
      }
      return [...parseFailures, ...diagnostics].map((diagnostic) => portable(diagnostic, unit.treeDir));
    }

    for (const failure of unparseable) {
      if (!roots.delete(pathKey(failure.file))) {
        throw new Error(
          `deno check cannot parse ${failure.file === '' ? '<unknown file>' : failure.file}, and it is ` +
            `not among the files still passed as roots for ${unit.id}, so it cannot be excluded that way — every ` +
            'remaining file in the unit therefore goes unchecked and the unit cannot be reported on at all. Either ' +
            'an import inside the unit reaches an unparseable file, or the error line no longer carries a ' +
            `parseable position.\n\n${output}`,
        );
      }
      parseFailures.push(failure);
    }
  }

  // Each iteration removes one root, so the loop above always returns or throws first.
  throw new Error(`deno check never produced a parseable result for ${unit.id} in ${files.length + 1} attempts.`);
}

/** One `deno check` invocation over `roots`, bounded by {@link TIMEOUT_MS}. */
async function denoCheck(roots: readonly string[]): Promise<{ code: number; output: string; timedOut: boolean }> {
  const process = new Deno.Command(Deno.execPath(), {
    args: ['check', '--no-lock', '--unstable-sloppy-imports', ...roots],
    env: { NO_COLOR: '1' },
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      process.kill('SIGKILL');
    } catch {
      // Already exited; nothing to kill.
    }
  }, TIMEOUT_MS);

  let code: number;
  let stdout: Uint8Array;
  let stderr: Uint8Array;
  try {
    ({ code, stdout, stderr } = await process.output());
  } finally {
    clearTimeout(timer);
  }

  const decoder = new TextDecoder();
  return { code, output: decoder.decode(stdout) + decoder.decode(stderr), timedOut };
}

/** Unit-relative paths in both the `file` field and any URL embedded in the message. */
function portable(diagnostic: Diagnostic, treeDir: string): Diagnostic {
  return {
    ...relativizeDiagnostic(diagnostic, treeDir),
    message: normalizeMessageUrls(diagnostic.message, treeDir),
  };
}
