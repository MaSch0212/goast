#!/usr/bin/env node
/**
 * Type-checks a `tsconfig.json` using the TypeScript compiler API, not the `tsc` CLI binary.
 *
 * The CLI's own driver (`emitFilesAndReportErrors` in `typescript.js`) only computes semantic
 * diagnostics when the program has **zero** syntactic diagnostics anywhere in it:
 *
 * ```js
 * addRange(allDiagnostics, program.getSyntacticDiagnostics(...));
 * if (allDiagnostics.length === configFileParsingDiagnosticsLength) {
 *   // ... only reached when there were no syntax errors ...
 *   addRange(allDiagnostics, program.getSemanticDiagnostics(...));
 * }
 * ```
 *
 * Verified directly against this repo's corpus: every TypeScript profile's `v3/non-ascii-names` unit
 * carries a real, committed syntax error (defect 21 in `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`
 * — a schema whose normalized name is empty renders as `export type  = {`, invalid TypeScript). Running
 * a single combined `tsc --noEmit` over a whole profile's 54 units — as the CLI is designed to be run —
 * means that one syntax error silently discards every semantic diagnostic (every `TS2456`, every real
 * type error) for the other 53 units too. `code !== 0` stays true and diagnostics are still parsed (the
 * syntax error itself), so the existing "non-zero exit with zero diagnostics" vacuous-green guard does
 * not catch this — the profile would report only the two known syntax defects and silently hide
 * everything else, indistinguishable from "no other unit has a problem."
 *
 * `ts.getPreEmitDiagnostics` — the same public, stable API `ts-jest` and `ttypescript` build on — has no
 * such short-circuit: it unconditionally concatenates config, options, syntactic, global, and semantic
 * diagnostics. Using it here keeps the one-program-per-profile performance shape the gate is built
 * around while actually finding what a per-unit `tsc` invocation would.
 *
 * Config parsing (`extends`, `include` glob expansion, `typeRoots`, everything) goes through
 * `ts.getParsedCommandLineOfConfigFile`, the exact function the CLI itself calls — so behavior stays
 * identical to `tsc` for anything other than the short-circuit above.
 *
 * Diagnostics are rendered with the public `ts.formatDiagnostic`, which produces the same
 * `file(line,col): error TSxxxx: message` text `tsc` itself prints, so `parseTscDiagnostics` needs no
 * awareness that this script exists.
 *
 * Two more properties matter to the caller (`test/compile-tests/runners/tsc.ts`), both hardened after a
 * review round found them:
 *
 * - **Every write happens through `main()`'s return value, never `process.exit()`.** `runContainer`
 *   captures stdout over a pipe, and Node's stdout is asynchronous on a pipe — a `process.exit()` call
 *   discards whatever is still buffered. Measured directly against this image: at 40,000 lines only
 *   16,686 arrived; at 200,000, only 85,065. `code !== 0 && diagnostics.length === 0` cannot see this,
 *   because plenty of diagnostics still parse — the run just silently loses its tail. Setting
 *   `process.exitCode` and letting the event loop drain naturally is what avoids it.
 * - **Every root file the program actually compiled is reported**, one per `##GOAST-ROOT##` line, so the
 *   runner can confirm each unit contributed at least one file to the program. A misconfigured `include`
 *   (a typo, a pattern matching nothing, `tsc`'s own dot-file exclusion — see `runners/tsc.ts`'s comment
 *   on `include` for a real instance of the last one) otherwise compiles and exits 0 with nothing to say,
 *   which reads identically to "checked and clean."
 */
import process from 'node:process';
import { relative } from 'node:path';

import ts from 'typescript';

function main() {
  const [, , configPath] = process.argv;
  if (configPath === undefined) {
    console.error('usage: check.mjs <tsconfig.json>');
    return 2;
  }

  const diagnosticsHost = {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => '\n',
  };

  let fatalConfigDiagnostic;
  const parseConfigHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    getCurrentDirectory: () => process.cwd(),
    // Recoverable per-entry config errors land in `parsed.errors` below and are handled the same way as
    // any other diagnostic. This callback only fires for the unrecoverable kind (e.g. malformed JSON),
    // where `getParsedCommandLineOfConfigFile` returns `undefined` instead.
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      fatalConfigDiagnostic = diagnostic;
    },
  };

  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, parseConfigHost);
  if (parsed === undefined) {
    if (fatalConfigDiagnostic !== undefined) {
      process.stdout.write(ts.formatDiagnostic(fatalConfigDiagnostic, diagnosticsHost));
    }
    return 2;
  }

  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
    projectReferences: parsed.projectReferences,
  });

  // Reported before diagnostics, and unconditionally (clean or not) — the runner needs this exactly
  // when a unit has zero diagnostics, since that is the case a broken `include` is indistinguishable
  // from a genuinely clean unit without it. `parsed.fileNames` are the config's own root names, already
  // absolute; the ambient `k6-jslib.d.ts` (outside the tree, so `relative` climbs out with a leading
  // `..`) is filtered rather than reported as a bare line, since no unit's prefix could ever match it.
  const cwd = process.cwd();
  for (const fileName of parsed.fileNames) {
    const relativePath = relative(cwd, fileName).replace(/\\/g, '/');
    if (relativePath.startsWith('..')) continue;
    process.stdout.write(`##GOAST-ROOT## ${relativePath}\n`);
  }

  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];

  let hasError = false;
  for (const diagnostic of diagnostics) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) hasError = true;
    process.stdout.write(ts.formatDiagnostic(diagnostic, diagnosticsHost));
  }

  return hasError ? 2 : 0;
}

process.exitCode = main();
