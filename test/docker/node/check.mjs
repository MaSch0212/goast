#!/usr/bin/env node
/**
 * Type-checks a `tsconfig.json` as one program with the image's TypeScript 7 `tsc`, without losing
 * semantic diagnostics to a syntax error.
 *
 * TypeScript 7 ships no compiler JS API, only the CLI, and the CLI reports nothing but syntax errors as
 * soon as any file in the program has one: the syntax errors of every unparseable file, no semantic
 * diagnostic for any file. Every profile in this corpus has such files (`models/.ts` and friends), so a
 * plain `tsc -p` would hide every real type error in the whole profile. So:
 *
 * 1. Full run. Clean exit, or failure without syntax errors, is the answer.
 * 2. Otherwise a `--noCheck` run reports exactly the syntax errors, of all unparseable files at once.
 * 3. Those files are dropped from the roots and the rest is checked once more. A syntax error in a file
 *    that is not a root, or a dropped file a remaining root still imports, is fatal: the rest of the
 *    program cannot honestly be reported as checked.
 *
 * `test/compile-tests/runners/host-tsc.ts` runs the same strategy per host unit; this copy exists
 * because the container sees none of the repo's sources.
 *
 * Output contract with `test/compile-tests/runners/tsc.ts`:
 *
 * - `##GOAST-ROOT## <path>` per config root under the working directory, from `tsc --showConfig` (which
 *   expands `include` into `files`), so the runner can prove every unit contributed files. A broken
 *   `include` otherwise exits 0 with nothing to say, which reads like "checked and clean".
 * - Then `tsc --pretty false` diagnostics verbatim: `file(line,col): error TSxxxx: message`, paths
 *   relative to the working directory.
 * - Or `##GOAST-FATAL## <reason>` when the result cannot be trusted. The runner throws on it.
 *
 * Output is written once, at the end, and the exit code set via `process.exitCode`, never
 * `process.exit()`: stdout is asynchronous on a pipe and `process.exit()` drops whatever is still
 * buffered (measured: 16,686 of 40,000 lines arrived), while plenty of diagnostics still parse.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { inspect } from 'node:util';

const TSC = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin', 'tsc');

const DIAGNOSTIC = /^(?:(?<file>[^(]+)\(\d+,\d+\): )?error TS\d+: /;

function tsc(args) {
  const result = spawnSync(process.execPath, [TSC, ...args], { encoding: 'utf8', maxBuffer: 1024 ** 3 });
  if (result.error !== undefined) throw new Error(`tsc ${args.join(' ')} failed to run`, { cause: result.error });
  if (result.status === null) throw new Error(`tsc ${args.join(' ')} was killed by ${result.signal}`);
  const output = result.stdout + result.stderr;
  return { code: result.status, output, errorFiles: errorFiles(output) };
}

/** File of every error line, cwd-relative as `tsc` prints it; `''` for an error without a position. */
function errorFiles(output) {
  return output
    .split('\n')
    .map((line) => DIAGNOSTIC.exec(line)?.groups)
    .filter((groups) => groups !== undefined)
    .map((groups) => groups.file ?? '');
}

/** Config roots, relative to cwd. */
function rootsOf(configPath) {
  const shown = tsc(['-p', configPath, '--showConfig']);
  if (shown.code !== 0) throw new Error(`tsc --showConfig exited ${shown.code}:\n${shown.output}`);
  const { files } = JSON.parse(shown.output);
  if (!Array.isArray(files)) throw new Error(`tsc --showConfig listed no files:\n${shown.output}`);
  return files.map((file) => relative(process.cwd(), resolve(dirname(configPath), file)).replace(/\\/g, '/'));
}

function check(configPath, roots) {
  const full = tsc(['-p', configPath, '--pretty', 'false']);
  if (full.code === 0) return { code: 0, output: full.output };

  const syntax = tsc(['-p', configPath, '--pretty', 'false', '--noCheck']);
  if (syntax.errorFiles.length === 0) return { code: full.code, output: full.output };

  const remaining = new Set(roots);
  const dropped = new Set(syntax.errorFiles);
  for (const file of dropped) {
    if (!remaining.delete(file)) {
      throw new Error(
        `tsc cannot parse ${file === '' ? '<no file>' : file}, which is not a root, so it cannot be excluded ` +
          'and every other file goes unchecked. Either an import reaches an unparseable file, or the error ' +
          `carries no position.\n${syntax.output}`,
      );
    }
  }
  if (remaining.size === 0) return { code: syntax.code, output: syntax.output };

  const dir = mkdtempSync(join(tmpdir(), 'goast-check-'));
  try {
    const restConfig = join(dir, 'tsconfig.json');
    writeFileSync(
      restConfig,
      JSON.stringify({ extends: configPath, files: [...remaining].map((file) => resolve(file)), include: [] }),
    );
    const rest = tsc(['-p', restConfig, '--pretty', 'false']);
    const reached = [...new Set(rest.errorFiles.filter((file) => dropped.has(file)))];
    if (reached.length > 0) {
      throw new Error(
        `tsc still reports ${reached.join(', ')} after dropping it from the roots, so a remaining root ` +
          `imports it and its syntax error hides every semantic diagnostic.\n${rest.output}`,
      );
    }
    return { code: syntax.code, output: syntax.output + rest.output };
  } finally {
    rmSync(dir, { recursive: true });
  }
}

function main() {
  const [, , configArg] = process.argv;
  if (configArg === undefined) {
    process.stderr.write('usage: check.mjs <tsconfig.json>\n');
    return 2;
  }
  const configPath = resolve(configArg);

  let report;
  let result;
  try {
    // `..`-prefixed roots (the ambient `k6-jslib.d.ts`) are outside the tree; no unit prefix could match.
    const roots = rootsOf(configPath);
    report = roots.filter((root) => !root.startsWith('..')).map((root) => `##GOAST-ROOT## ${root}\n`);
    result = check(configPath, roots);
  } catch (error) {
    process.stdout.write(`##GOAST-FATAL## ${inspect(error)}\n`);
    return 2;
  }

  process.stdout.write(report.join('') + result.output);
  return result.code === 0 ? 0 : 2;
}

process.exitCode = main();
