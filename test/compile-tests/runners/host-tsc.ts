import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import {
  type CompileUnit,
  type Diagnostic,
  isNotFound,
  normalizeMessageUrls,
  parseTscDiagnostics,
  relativizeDiagnostic,
  runCommand,
  walkFiles,
} from '@goast/test-harness';

/**
 * Per-invocation ceiling on one `tsc` run, after which the unit is a harness failure.
 *
 * Like `runTsc` and `runKotlin`, a timeout is a harness failure rather than a clean unit: a killed run's
 * output is whatever was flushed before the signal. A healthy run is well under a second per unit
 * (~25 files at most), so this only has to be far enough above that to never fire.
 */
const TIMEOUT_MS = 5 * 60 * 1000;

/** The repo's own TypeScript 7 `tsc`, from the root `typescript` devDependency. */
const TSC = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin', 'tsc');

/**
 * `test/docker/node/tsconfig.base.json` minus its container-only `typeRoots`/`types: ['k6']`.
 *
 * `moduleResolution: 'bundler'` because the corpus's relative imports carry no `.ts` extension by
 * design. `types: []` so no `@types` package that happens to be visible from the temp dir leaks in.
 */
const COMPILER_OPTIONS = {
  target: 'ES2022',
  module: 'ESNext',
  moduleResolution: 'bundler',
  lib: ['ES2022', 'DOM'],
  strict: true,
  noEmit: true,
  allowJs: true,
  skipLibCheck: true,
  types: [],
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
};

/**
 * Type-checks TypeScript units on the host with `tsc`, one program per unit.
 *
 * **Every `.ts` file in the unit is a root, not an entry point.** Following imports from a barrel
 * checks only what it reaches, and 41 of the 108 host units contain unreachable files — 58 measured:
 * `utils/fetch-client.utils.ts` in the 38 `fetch-clients` units whose spec generates no client, plus 20
 * generated model files the generator never exports (`models/.ts`, `models/a_1.ts`,
 * `models/my-thing_1..4.ts`, `models/thing-2_1.ts`, `models/_1.ts`, `models/_2.ts` across
 * `v3/extreme-names`, `v3/name-collisions` and `v3/non-ascii-names`). Those are the files defects 18,
 * 21 and 22 are about, so an entry-point gate would be blind to them.
 *
 * Roots go into a temp tsconfig's `files` rather than an `include` glob: tsc's wildcard matcher skips
 * dot-prefixed entries, which would silently drop `models/.ts`.
 */
export async function runHostTsc(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const filesByUnit = new Map<string, string[]>();
  for (const unit of units) {
    filesByUnit.set(unit.id, await collectTypeScriptFiles(unit.treeDir));
  }

  // A unit that contributed no files compiles trivially and reports nothing, indistinguishable from a
  // genuinely clean unit.
  const uncovered = units.filter((unit) => filesByUnit.get(unit.id)!.length === 0);
  if (uncovered.length > 0) {
    throw new Error(
      `${uncovered.length} unit(s) contributed no TypeScript files to tsc: ` +
        `${uncovered.map((u) => u.id).join(', ')}. Their tree holds no \`.ts\` file at all; a unit ` +
        'reporting no diagnostics for this reason has not actually been checked.',
    );
  }

  const configDir = await mkdtemp(join(tmpdir(), 'goast-host-tsc-'));
  try {
    const results = new Map<string, Diagnostic[]>();
    for (const unit of units) {
      results.set(unit.id, await checkUnit(unit, filesByUnit.get(unit.id)!, join(configDir, 'tsconfig.json')));
    }
    return results;
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
}

/**
 * Every `.ts` file under a unit's tree, matched on the name so the dotfile `models/.ts` (no extension
 * per `extname`) is kept. A missing tree yields no files, so the caller's coverage assertion names it.
 */
async function collectTypeScriptFiles(treeDir: string): Promise<string[]> {
  try {
    return (await walkFiles(treeDir)).filter((file) => file.endsWith('.ts'));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

/** Windows paths compare case-insensitively. */
function pathKey(path: string): string {
  return process.platform === 'win32' ? path.toLowerCase() : path;
}

/**
 * Type-checks one unit, working around the `tsc` CLI dropping semantic diagnostics on a syntax error.
 *
 * Measured with TypeScript 7.0.2: when any file in the program (root or only imported) has a syntax
 * error, the CLI reports the syntax errors of *all* such files and no semantic diagnostic for any
 * file. Four host units contain `models/.ts` (`export type  = {`), so one generator-emitted syntax error
 * would hide every other diagnostic in its unit.
 *
 * So: a clean exit is the answer. Otherwise a `--noCheck` run (syntax only) tells whether the full run
 * was cut short. If it was, its syntax errors are recorded, the offending roots dropped, and the
 * remaining roots checked once more — one retry suffices because tsc reports every unparseable file at
 * once. An unparseable file that is not a root, or that a remaining root still imports, cannot be
 * dropped and is a loud failure: the rest of the unit cannot honestly be reported as checked.
 */
async function checkUnit(unit: CompileUnit, files: readonly string[], configPath: string): Promise<Diagnostic[]> {
  const full = await tsc(unit, files, configPath, []);
  if (full.code === 0) return [];

  const syntax = await tsc(unit, files, configPath, ['--noCheck']);
  if (syntax.diagnostics.length === 0) {
    assertParsed(unit, full);
    return full.diagnostics.map((diagnostic) => portable(diagnostic, unit.treeDir));
  }

  const roots = new Map(files.map((file) => [pathKey(file), file]));
  const dropped = new Set<string>();
  for (const failure of syntax.diagnostics) {
    const key = pathKey(failure.file);
    if (!roots.has(key) && !dropped.has(key)) {
      throw new Error(
        `tsc cannot parse ${failure.file === '' ? '<no file>' : failure.file}, which is not a root of ${unit.id}, ` +
          'so it cannot be excluded and every other file in the unit goes unchecked. Either an import inside ' +
          `the unit reaches an unparseable file, or the error carries no position.\n\n${syntax.output}`,
      );
    }
    roots.delete(key);
    dropped.add(key);
  }

  const rest = roots.size === 0 ? undefined : await tsc(unit, [...roots.values()], configPath, []);
  const reachable = rest?.diagnostics.filter((diagnostic) => dropped.has(pathKey(diagnostic.file))) ?? [];
  if (reachable.length > 0) {
    throw new Error(
      `tsc still reports ${[...new Set(reachable.map((d) => d.file))].join(', ')} for ${unit.id} after dropping it ` +
        'from the roots, so a remaining root imports it and its syntax error hides every semantic diagnostic.\n\n' +
        rest!.output,
    );
  }
  if (rest !== undefined && rest.code !== 0) assertParsed(unit, rest);

  return [...syntax.diagnostics, ...(rest?.diagnostics ?? [])].map((diagnostic) => portable(diagnostic, unit.treeDir));
}

type TscRun = { code: number; output: string; diagnostics: Diagnostic[] };

/** One `tsc` invocation over `roots`, bounded by {@link TIMEOUT_MS}, with each `file` made absolute. */
async function tsc(
  unit: CompileUnit,
  roots: readonly string[],
  configPath: string,
  extraArgs: string[],
): Promise<TscRun> {
  await writeFile(configPath, JSON.stringify({ compilerOptions: COMPILER_OPTIONS, files: roots }, null, 2) + '\n');

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const { code, stdout, stderr } = await runCommand(
    process.execPath,
    [TSC, '-p', configPath, '--pretty', 'false', ...extraArgs],
    { signal },
  );
  const output = stdout + stderr;
  if (signal.aborted) {
    throw new Error(
      `tsc timed out after ${TIMEOUT_MS}ms for ${unit.id}. Its output cannot be trusted as a complete result.\n\n` +
        output,
    );
  }

  // tsc reports files relative to its working directory, which is this process's.
  const diagnostics = parseTscDiagnostics(output).map((diagnostic) =>
    diagnostic.file === '' ? diagnostic : { ...diagnostic, file: resolve(diagnostic.file) },
  );
  return { code, output, diagnostics };
}

function assertParsed(unit: CompileUnit, run: TscRun): void {
  if (run.diagnostics.length === 0) {
    throw new Error(
      `tsc exited ${run.code} for ${unit.id} but no diagnostics were parsed. ` +
        'The output format has probably changed; the gate would be vacuously green.\n\n' +
        run.output,
    );
  }
}

/** Unit-relative paths in both the `file` field and any URL embedded in the message. */
function portable(diagnostic: Diagnostic, treeDir: string): Diagnostic {
  return {
    ...relativizeDiagnostic(diagnostic, treeDir),
    message: normalizeMessageUrls(diagnostic.message, treeDir),
  };
}
