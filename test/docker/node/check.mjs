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
 */
import process from 'node:process';

import ts from 'typescript';

const [, , configPath] = process.argv;
if (configPath === undefined) {
  console.error('usage: check.mjs <tsconfig.json>');
  process.exit(2);
}

const diagnosticsHost = {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => '\n',
};

const parseConfigHost = {
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  getCurrentDirectory: () => process.cwd(),
  onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
    process.stdout.write(ts.formatDiagnostic(diagnostic, diagnosticsHost));
    process.exit(2);
  },
};

const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, parseConfigHost);
if (parsed === undefined) {
  // onUnRecoverableConfigFileDiagnostic above already reported and exited for a fatal config error.
  process.exit(2);
}

const program = ts.createProgram({
  rootNames: parsed.fileNames,
  options: parsed.options,
  projectReferences: parsed.projectReferences,
});

const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];

let hasError = false;
for (const diagnostic of diagnostics) {
  if (diagnostic.category === ts.DiagnosticCategory.Error) hasError = true;
  process.stdout.write(ts.formatDiagnostic(diagnostic, diagnosticsHost));
}

process.exit(hasError ? 2 : 0);
