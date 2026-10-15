import { readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { isNotFound, repoRootDir, walkFiles } from '@goast/test-harness';

import { DRIVER_UNITS } from '../integration/kotlin-clients/build.ts';
import { SERVER_UNITS } from '../integration/spring-controllers/build.ts';
import { profiles } from '../output-tests/profiles.ts';

/**
 * `vitest run -t <pattern>` exits 0 when it matches nothing: every test in the selected files reports as
 * skipped (measured on vitest 5.0.4: `vitest run test/cases -t no-such-test` → "7 skipped", exit 0).
 *
 * A script whose pattern carries a typo — or names a `describe` someone later renamed — runs zero tests,
 * exits 0, and the CI job backed by it is vacuously green, permanently and with no signal. That is the
 * same shape as tier 4's "an absent artifact means this case conforms" inversion, and it gets the same
 * treatment: something that asserts the pattern still selects a test that exists.
 *
 * Vitest semantics this file models, each read from vitest 5.0.4's source and measured:
 *
 * - `-t` is `new RegExp(pattern)` (no flags) tested against a test's **full name**: the `describe` chain
 *   and the test name joined by ` > ` — `createTaskName`'s separator, not a space. `-t "^cases > "`
 *   selects `cases > gives every case a unique id`; `-t "^cases gives"` selects nothing. An empty pattern
 *   is no pattern: it selects everything.
 * - A positional path is a case-insensitive substring of the repo-relative file path, so
 *   `vitest run test/integration` also runs `test/integration-tests/` (measured).
 *
 * The root `package.json` is not the only place a pattern lives. `.github/workflows/build.yml` splits
 * the two Kotlin client families and the controller units into jobs by passing `-t` to
 * `pnpm vitest run` directly, out of a build matrix. Those strings are in exactly the same danger and
 * are checked here the same way.
 *
 * Three things this file learned the hard way, each of which it now checks:
 *
 * 1. **A pattern must match a test in the files its command actually runs.** Matching against every
 *    test in the repo is weaker than it reads: `test:compile:ts:check` filters on `typescript/` over
 *    `test/compile-tests`, and `test/output-tests/output.test.ts` registers `typescript/models`,
 *    `typescript/fetch-clients` and friends — an unscoped check stays green on the strength of tests
 *    that command cannot reach. Every invocation below therefore carries its paths.
 *
 * 2. **The converse matters more.** Splitting a directory into per-unit jobs by pattern once dropped
 *    `integration/spring-controllers boot` out of CI entirely: no `…@sbN` pattern matches it, every leg
 *    stayed green, and the one test asserting the tier-4 infrastructure stopped running. A pattern that
 *    matches something says nothing about the tests nothing matches. `every test is run by some CI job`
 *    is the check that catches it.
 *
 * 3. **A job's real pattern is the one that survives expansion.** The workflow reaches `vitest` through
 *    `pnpm <script>` chains and passes patterns through `env:`, so both are resolved here rather than
 *    pattern-matched at the surface — which also means an unknown script name in a `run:` step fails
 *    this file rather than waiting to fail the job.
 */

/**
 * One registered test: its full name as `-t` sees it, where it lives, and the gates it needs.
 *
 * `gates` is what makes the coverage check mean anything. Every container-backed test is written as
 * `const enabled = (process.env.GOAST_… ?? '') !== ''` and registered behind `describe.skipIf(!enabled)`
 * or `if (enabled)`, so a job that runs the file without that variable skips it. A coverage check that
 * ignored this would count the unfiltered `it-fetch-clients` sweep, which runs `test/integration`
 * without `GOAST_INTEGRATION`, as running every Docker leg in the tier.
 */
type TestEntry = { name: string; file: string; gates: string[] };

/**
 * The variables a test file gates its tests on.
 *
 * Only the two container gates. `GOAST_SNAPSHOT` selects a mode rather than deciding whether tests run,
 * so requiring it would demand coverage that means nothing.
 */
const GATE_VARIABLES = ['GOAST_INTEGRATION', 'GOAST_COMPILE'];

/** Which gates a file reads. Whole-file, which over-approximates for a file that mixes gated and not. */
function gatesOf(source: string): string[] {
  return GATE_VARIABLES.filter((name) => source.includes(`process.env.${name}`));
}

/** A `describe` whose name is a template literal no resolver here can turn into concrete names. */
type Unresolved = { raw: string; file: string };

/** Everything `collectTests` could work out, plus what it could not. */
type CollectedTests = { tests: TestEntry[]; unresolved: Unresolved[]; files: number };

/** Trees with no test files that are expensive or pointless to walk. */
const SKIP = [
  /[\\/]test[\\/](output|compile|wire|specs|docker)$/,
  /[\\/](node_modules|npm|out|dist|coverage|\.git|\.goast-cache)$/,
];

/**
 * A `describe`/`it`/`test` call opening a line, with the name argument it registers under.
 *
 * Anchored to the line's first token, which also keeps `route.test(` and calls in comments out. The name
 * is a string or template literal, or else an expression (`it(unit.id, …)`) recorded as its source text.
 * `.skip`/`.todo` mark a test no job is meant to run; `.skipIf(…)` is a gate, which `gatesOf` models.
 */
const CALL =
  /^([ \t]*)(describe|it|test)((?:\.(?:skipIf|runIf|only|skip|todo)(?:\([^()\n]*\))?)*)\(\s*(?:'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`|([^,()\n]+?)\s*,)/gm;

/** The `${...}` holes in a template literal. */
const INTERPOLATION = /\$\{([^}]*)\}/g;

/**
 * `describe` templates whose holes are filled from data no amount of reading the source can produce.
 *
 * Keyed by `<repo-relative file>::<template source>` so that renaming either the file or the template
 * makes the entry dead — and a dead entry is a failure below, not a silent loss of names.
 */
const TEMPLATE_RESOLVERS: Record<string, (source: string) => string[]> = {
  // `profile` here is a key of the map built from `CONTAINER_TS_PROFILES`, read back out of the file
  // rather than duplicated, so the two cannot drift apart without the emptiness check below firing.
  'test/compile-tests/compile.test.ts::typescript/${profile} (tsc)': (source) =>
    stringArrayConst(source, 'CONTAINER_TS_PROFILES').map((profile) => `typescript/${profile} (tsc)`),
  'test/integration/kotlin-clients/integration.test.ts::integration/${unit.id}': () =>
    DRIVER_UNITS.map((unit) => `integration/${unit.id}`),
  'test/integration/spring-controllers/integration.test.ts::integration/${unit.id}': () =>
    SERVER_UNITS.map((unit) => `integration/${unit.id}`),
  'test/output-tests/output.test.ts::${profile.language}/${profile.name}': () =>
    profiles.map((profile) => `${profile.language}/${profile.name}`),
};

/** Resolver keys that matched a template actually present in the repo, filled in by `expandTemplate`. */
const usedResolvers = new Set<string>();

/** `const NAME = [ 'a', 'b' ] as const;` — the elements, or `[]` if the declaration is gone. */
function stringArrayConst(source: string, name: string): string[] {
  const declaration = new RegExp(`const ${name}(?::[^=]*)? = \\[([^\\]]*)\\]`).exec(source);
  if (declaration === null) return [];
  return [...declaration[1].matchAll(/'([^']*)'/g)].map((match) => match[1]);
}

/** `const NAME = 'value';`, exported or not. */
function stringConst(source: string, name: string): string | undefined {
  return new RegExp(`(?:^|\\n)\\s*(?:export )?const ${name}(?::[^=]*)? = '([^']*)';`).exec(source)?.[1];
}

/** The module specifier a named import comes from, if the file imports that name at all. */
function importSpecifier(source: string, name: string): string | undefined {
  const imports = source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g);
  for (const [, names, specifier] of imports) {
    if (
      names.split(',').some(
        (entry) =>
          entry
            .trim()
            .split(/\s+as\s+/)[0]
            .trim() === name,
      )
    )
      return specifier;
  }
  return undefined;
}

/**
 * Resolves a bare identifier used inside a template literal to the string it holds.
 *
 * Looks in the file itself first, then in the module the file imports the name from — the two shapes
 * `PROFILE` actually takes across the integration tests (declared locally in `fetch-clients` and
 * `k6-clients`, re-exported from `build.ts` in `angular-services` and `easy-network-stub`).
 */
async function resolveIdentifier(file: string, source: string, name: string): Promise<string | undefined> {
  const local = stringConst(source, name);
  if (local !== undefined) return local;

  const specifier = importSpecifier(source, name);
  if (specifier === undefined || !specifier.startsWith('.')) return undefined;

  const target = resolve(dirname(file), specifier);
  try {
    return stringConst(await readFile(target, 'utf8'), name);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw new Error(`Could not read ${target}, imported by ${file} for \`${name}\``, { cause: error });
  }
}

/** Concrete names for one template literal, or `undefined` when a hole cannot be filled. */
async function expandTemplate(
  file: string,
  path: string,
  source: string,
  template: string,
): Promise<string[] | undefined> {
  const resolver = TEMPLATE_RESOLVERS[`${file}::${template}`];
  if (resolver !== undefined) {
    usedResolvers.add(`${file}::${template}`);
    const names = resolver(source);
    return names.length === 0 ? undefined : names;
  }

  let names = [template];
  for (const [hole, expression] of template.matchAll(INTERPOLATION)) {
    if (!/^[A-Za-z_$][\w$]*$/.test(expression.trim())) return undefined;
    const value = await resolveIdentifier(path, source, expression.trim());
    if (value === undefined) return undefined;
    names = names.map((name) => name.replace(hole, () => value));
  }
  return names;
}

/** An open `describe`: the indentation its call starts at, and its possible names (`undefined`: unknown). */
type OpenSuite = { indent: number; names: string[] | undefined; skipped: boolean };

/** A quoted string literal's value: `\n`, `\t` and `\<char>` escapes only, which is all names use. */
function unquote(literal: string): string {
  return literal.replace(/\\(.)/g, (_, char: string) => (char === 'n' ? '\n' : char === 't' ? '\t' : char));
}

/** Leading whitespace width of a line, or `undefined` for a blank one. */
function indentOf(line: string): number | undefined {
  return line.trim() === '' ? undefined : line.length - line.trimStart().length;
}

/**
 * Which lines start inside a template literal or block comment, whose indentation says nothing about
 * nesting — a multi-line YAML fixture sits at column 0 in the middle of an `it`.
 *
 * A small lexer: strings, comments, `${}` nesting and regex literals. A `/` starts a regex when the
 * previous significant character cannot end an operand, which holds for every test file in the repo.
 */
function linesInsideLiterals(source: string): Set<number> {
  const inside = new Set<number>();
  // One entry per open template literal: the `{` depth of its innermost `${` hole, or -1 in its text.
  const templates: number[] = [];
  let braces = 0;
  let line = 0;
  let previous = '';
  let blockComment = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '\n') {
      line++;
      if (blockComment || templates.at(-1) === -1) inside.add(line);
      continue;
    }
    if (blockComment) {
      if (char === '*' && source[index + 1] === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (templates.at(-1) === -1) {
      if (char === '\\') {
        index++;
      } else if (char === '`') {
        templates.pop();
        previous = '`';
      } else if (char === '$' && source[index + 1] === '{') {
        templates[templates.length - 1] = braces++;
        index++;
      }
      continue;
    }
    if (/\s/.test(char)) continue;
    if (char === '/' && source[index + 1] === '/') {
      index = source.indexOf('\n', index) - 1;
      if (index < 0) break;
      continue;
    }
    if (char === '/' && source[index + 1] === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === "'" || char === '"') {
      for (index++; index < source.length && source[index] !== char && source[index] !== '\n'; index++) {
        if (source[index] === '\\') index++;
      }
    } else if (char === '/' && (previous === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(previous))) {
      let inClass = false;
      for (index++; index < source.length && source[index] !== '\n'; index++) {
        const current = source[index];
        if (current === '\\') index++;
        else if (current === '[') inClass = true;
        else if (current === ']') inClass = false;
        else if (current === '/' && !inClass) break;
      }
    } else if (char === '`') {
      templates.push(-1);
    } else if (char === '{') {
      braces++;
    } else if (char === '}') {
      braces--;
      if (templates.length > 0 && templates.at(-1) === braces) templates[templates.length - 1] = -1;
    }
    previous = char;
  }
  return inside;
}

/**
 * The full names of every test one file registers.
 *
 * Nesting is read from indentation, which `pnpm fmt:check` keeps faithful: a call belongs to every open
 * `describe` indented less than it, and a `describe` closes at the first later line indented no deeper
 * than its own call. A test under a `describe` whose name cannot be resolved is reported, not guessed. A
 * test whose own name is an expression or unresolvable template keeps its source text as its name —
 * patterns aim at `describe` names, and dropping the test would hide its `describe` from the converse
 * check.
 */
async function testsOf(file: string, path: string, source: string, unresolved: Unresolved[]): Promise<TestEntry[]> {
  const gates = gatesOf(source);
  const calls = new Map<number, RegExpExecArray>();
  for (const match of source.matchAll(CALL)) {
    calls.set(source.slice(0, match.index).split('\n').length - 1, match);
  }

  const tests: TestEntry[] = [];
  const open: OpenSuite[] = [];
  const lines = source.split('\n');
  const literalLines = linesInsideLiterals(source);
  for (let index = 0; index < lines.length; index++) {
    if (literalLines.has(index)) continue;
    const indent = indentOf(lines[index]);
    if (indent === undefined) continue;
    while (open.length > 0 && open[open.length - 1].indent >= indent) open.pop();

    const call = calls.get(index);
    if (call === undefined) continue;
    const [, , kind, modifiers, single, double, template, expression] = call;
    const skipped = /\.(?:skip|todo)\b(?!If)/.test(modifiers);

    let names: string[] | undefined;
    if (template === undefined) {
      names = [single !== undefined || double !== undefined ? unquote((single ?? double)!) : expression.trim()];
    } else {
      names = await expandTemplate(file, path, source, template);
      if (names === undefined && kind === 'describe') unresolved.push({ raw: template, file });
      if (names === undefined && kind !== 'describe') names = [template];
    }

    if (kind === 'describe') {
      open.push({ indent, names, skipped });
      continue;
    }
    if (skipped || open.some((suite) => suite.skipped)) continue;
    if (open.some((suite) => suite.names === undefined)) continue;

    let chains = [''];
    for (const suite of open) chains = chains.flatMap((chain) => suite.names!.map((name) => `${chain}${name} > `));
    for (const chain of chains) for (const name of names!) tests.push({ name: `${chain}${name}`, file, gates });
  }
  return tests;
}

/** Every test the repo registers, by full name, and the file each lives in. */
async function collectTests(): Promise<CollectedTests> {
  const tests: TestEntry[] = [];
  const unresolved: Unresolved[] = [];
  let files = 0;

  for (const root of ['test', 'packages']) {
    const paths = await walkFiles(resolve(repoRootDir, root), {
      skipDir: (dir) => SKIP.some((pattern) => pattern.test(dir)),
    });
    for (const path of paths.filter((candidate) => candidate.endsWith('.test.ts'))) {
      files++;
      const source = await readFile(path, 'utf8');
      const file = relative(repoRootDir, path).replace(/\\/g, '/');
      tests.push(...(await testsOf(file, path, source, unresolved)));
    }
  }

  return { tests, unresolved, files };
}

// --- What each command actually runs ---------------------------------------------------------------

/**
 * One `vitest` invocation: the path filters it runs, the `-t` pattern it narrows them with, and the
 * environment it runs under.
 *
 * `paths` empty means the invocation named no path and therefore runs every project's test files — the
 * shape of the bare `vitest run` scripts. `env` is what decides whether the gated tests in those paths
 * run at all, and it accumulates from three places that all end up on the same command line: a workflow
 * step's `env:` mapping, the `NAME=value` prefix of the script, and the same prefix on any script that
 * script chains into.
 */
type Invocation = {
  source: string;
  paths: string[];
  filter?: string;
  pattern?: RegExp;
  env: Record<string, string>;
};

/** One command's words, with the environment it inherited from its step and its enclosing script chain. */
type Command = { words: string[]; env: Record<string, string> };

/** Command separators that end one invocation and begin another. A bare `|` does not; it pipes output. */
const SEGMENT_SEPARATOR = /&&|\|\||;|\n/;

/** Double-quoted (with `\` escapes), single-quoted or bare shell word. */
const SHELL_WORD = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;

/** A redirection or pipe: everything after it in a segment is plumbing, not arguments. */
const PLUMBING = /^\d*[<>|]/;

/** A `${{ matrix.<key> }}` standing alone as a whole argument. */
const MATRIX_REFERENCE = /^\$\{\{\s*matrix\.([\w-]+)\s*\}\}$/;

/** `$NAME` or `${NAME}` standing alone as a whole argument. */
const ENV_REFERENCE = /^\$\{?([A-Za-z_][\w]*)\}?$/;

/** The `-t` spellings vitest accepts. Any other flag is reported: it might take a path-shaped value. */
const PATTERN_FLAGS = ['-t', '--testNamePattern'];

/** Splits a shell script into the commands it runs in sequence. */
function commandSegments(script: string): string[] {
  return script
    .split(SEGMENT_SEPARATOR)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/** The words of one segment, up to the first pipe or redirection, unquoted the way `sh` does. */
function words(segment: string): string[] {
  const found: string[] = [];
  for (const match of segment.matchAll(SHELL_WORD)) {
    if (match[3] !== undefined && PLUMBING.test(match[3])) break;
    found.push(match[1]?.replace(/\\([$`"\\\n])/g, '$1') ?? match[2] ?? match[3]);
  }
  return found;
}

/** The `NAME=value` prefix a command carries, which is how every script in `package.json` sets its gates. */
function assignments(parts: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const part of parts) {
    const assignment = /^([A-Za-z_]\w*)=(.*)$/.exec(part);
    if (assignment === null) break;
    env[assignment[1]] = assignment[2];
  }
  return env;
}

/** Does `node_modules/.bin` provide this command, which `pnpm <name>` falls back to without a script? */
async function isBin(name: string): Promise<boolean> {
  const path = resolve(repoRootDir, 'node_modules', '.bin', name);
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw new Error(`Could not stat ${path}`, { cause: error });
  }
}

/**
 * Expands `pnpm <script>` (and `pnpm run <script>`) into the segments that script runs, recursively.
 *
 * `pnpm <name>` without a script of that name runs the `node_modules/.bin` command instead, which is how
 * the workflow reaches `vitest` directly. A name that is neither is reported rather than skipped:
 * `pnpm typo` in a `run:` step is a job that dies, and this file already holds both sides of that
 * comparison. `pnpm --filter …` runs workspace packages' own scripts, which run no tests.
 */
async function expandSegments(
  script: string,
  scripts: Record<string, string>,
  problems: string[],
  source: string,
  inherited: Record<string, string> = {},
  seen: string[] = [],
): Promise<Command[]> {
  const expanded: Command[] = [];

  for (const segment of commandSegments(script)) {
    const parts = words(segment);
    const env = { ...inherited, ...assignments(parts) };
    const rest = parts.slice(Object.keys(assignments(parts)).length);
    if (rest[0] !== 'pnpm') {
      expanded.push({ words: rest, env });
      continue;
    }

    const args = rest[1] === 'run' ? rest.slice(2) : rest.slice(1);
    const name = args[0];
    if (name === undefined || name.startsWith('-')) continue;
    const command = scripts[name];
    if (command !== undefined) {
      if (seen.includes(name)) continue; // A script chain that loops has bigger problems than this file.
      expanded.push(...(await expandSegments(command, scripts, problems, source, env, [...seen, name])));
    } else if (await isBin(name)) {
      expanded.push({ words: args, env });
    } else {
      problems.push(`${source} runs \`pnpm ${name}\`, which is neither a package.json script nor a binary`);
    }
  }

  return expanded;
}

/** The values a matrix gives one key, from both spellings, plus the legs that supply none. */
function matrixValues(matrix: Record<string, unknown>, key: string): { values: string[]; missing: number } {
  const values: string[] = [];
  let missing = 0;

  const plain = matrix[key];
  if (Array.isArray(plain)) values.push(...plain.map(String));

  const include = matrix.include;
  if (Array.isArray(include)) {
    for (const entry of include) {
      const value = (entry as Record<string, unknown>)?.[key];
      if (typeof value === 'string') values.push(value);
      else if (!Array.isArray(plain)) missing++;
    }
  }
  return { values, missing };
}

/**
 * The concrete strings one `-t` argument can take at run time.
 *
 * Two indirections to walk, in the order the value travels: the argument may name a step environment
 * variable, and that variable's value may name a matrix key. Both are followed rather than
 * pattern-matched at the surface, because the point of the check downstream is what the job runs, not
 * what it looks like.
 *
 * Every `include` leg is required to define a key the workflow reads. A leg that lost it does not merely
 * go unchecked: GitHub expands the missing value to the empty string, vitest treats `-t ""` as no pattern
 * and runs *every* test in the directory, and that leg silently stops being the one-unit job it is named
 * after. Catching it needs the per-leg count; "did anything supply this key" passes on a sibling.
 */
function resolveFilter(
  argument: string,
  env: Record<string, string>,
  matrix: Record<string, unknown>,
  source: string,
): { values: string[]; problems: string[] } {
  const problems: string[] = [];

  let value = argument;
  const environment = ENV_REFERENCE.exec(value);
  if (environment !== null) {
    const fromEnv = env[environment[1]];
    if (fromEnv === undefined) {
      return { values: [], problems: [`${source} filters on \`${argument}\`, which nothing in scope sets`] };
    }
    value = fromEnv;
  }

  const reference = MATRIX_REFERENCE.exec(value);
  if (reference !== null) {
    const { values, missing } = matrixValues(matrix, reference[1]);
    if (values.length === 0) {
      return {
        values: [],
        problems: [`${source} filters on \`${value}\`, but its matrix supplies no \`${reference[1]}\``],
      };
    }
    if (missing > 0) {
      problems.push(
        `${source} filters on \`${value}\`, but ${missing} of its matrix legs define no \`${reference[1]}\``,
      );
    }
    return { values, problems };
  }

  if (value.includes('${{')) {
    return { values: [], problems: [`${source} filters on \`${value}\`, which this check cannot resolve`] };
  }
  return { values: [value], problems };
}

/**
 * The invocations one already-expanded segment produces.
 *
 * A segment that is not `vitest` produces none; neither does `vitest list`, which runs nothing. A `vitest`
 * segment produces as many invocations as its pattern has possible values — a matrix reference stands
 * for every leg at once.
 */
function invocationsFromSegment(
  { words: parts, env }: Command,
  source: string,
  matrix: Record<string, unknown>,
  problems: string[],
): Invocation[] {
  if (parts[0] !== 'vitest') return [];
  const args = parts[1] === 'run' ? parts.slice(2) : parts.slice(1);
  if (args[0] === 'list') return [];

  const paths: string[] = [];
  let filter: string | undefined;

  for (let index = 0; index < args.length; index++) {
    const part = args[index];
    const [flag, inline] = part.split(/=(.*)/s);
    if (PATTERN_FLAGS.includes(flag)) {
      filter = inline ?? args[++index];
      continue;
    }
    if (part.startsWith('-')) {
      problems.push(`${source} passes \`${part}\` to vitest, which this check does not model`);
      continue;
    }
    paths.push(part.replace(/\\/g, '/'));
  }

  if (filter === undefined) return [{ source, paths, env }];

  const { values, problems: filterProblems } = resolveFilter(filter, env, matrix, source);
  problems.push(...filterProblems);
  const invocations: Invocation[] = [];
  for (const value of values) {
    let pattern: RegExp;
    try {
      pattern = new RegExp(value);
    } catch (error) {
      problems.push(`${source} filters on \`${value}\`, which is not a valid regular expression: ${error}`);
      continue;
    }
    // vitest treats an empty pattern as none.
    invocations.push({ source, paths, filter: value, pattern: value === '' ? undefined : pattern, env });
  }
  return invocations;
}

/** Every `vitest` invocation `package.json` describes, one entry per script, chains expanded. */
async function invocationsFromScripts(
  scripts: Record<string, string>,
): Promise<{ invocations: Invocation[]; problems: string[] }> {
  const invocations: Invocation[] = [];
  const problems: string[] = [];

  for (const [script, command] of Object.entries(scripts)) {
    const source = `script \`${script}\``;
    for (const segment of await expandSegments(command, scripts, problems, source)) {
      invocations.push(...invocationsFromSegment(segment, source, {}, problems));
    }
  }
  return { invocations, problems };
}

/** As much of `build.yml` as this file reads. Everything else in the workflow is ignored. */
type Workflow = {
  env?: Record<string, string>;
  jobs?: Record<
    string,
    {
      env?: Record<string, string>;
      strategy?: { matrix?: Record<string, unknown> };
      steps?: { run?: string; env?: Record<string, string> }[];
    }
  >;
};

/** Every `vitest` run the workflow reaches, through whatever chain of scripts and variables. */
async function invocationsFromWorkflow(
  workflow: Workflow,
  scripts: Record<string, string>,
): Promise<{ invocations: Invocation[]; problems: string[] }> {
  const invocations: Invocation[] = [];
  const problems: string[] = [];

  for (const [job, definition] of Object.entries(workflow.jobs ?? {})) {
    const matrix = definition.strategy?.matrix ?? {};
    for (const step of definition.steps ?? []) {
      if (typeof step?.run !== 'string') continue;
      const source = `job \`${job}\` (build.yml)`;
      const env = { ...workflow.env, ...definition.env, ...step.env };
      for (const segment of await expandSegments(step.run, scripts, problems, source, env)) {
        invocations.push(...invocationsFromSegment(segment, source, matrix, problems));
      }
    }
  }
  return { invocations, problems };
}

/** Does an invocation reach this file at all? No paths means it named none, so it runs the whole tree. */
function pathCovers(paths: string[], file: string): boolean {
  return paths.length === 0 || paths.some((path) => file.toLowerCase().includes(path.toLowerCase()));
}

/** Would this invocation run this test — in scope, past the pattern, and with the test's gates open? */
function runs(invocation: Invocation, test: TestEntry): boolean {
  return (
    pathCovers(invocation.paths, test.file) &&
    (invocation.pattern === undefined || invocation.pattern.test(test.name)) &&
    test.gates.every((gate) => (invocation.env[gate] ?? '') !== '')
  );
}

// --- The checks -------------------------------------------------------------------------------------

const packageJson = JSON.parse(await readFile(resolve(repoRootDir, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

/**
 * `build.yml`, or the reason it could not be read.
 *
 * Parsed rather than pattern-matched, and the parse failure is reported as a test failure rather than
 * thrown at import: a workflow that does not parse is one GitHub refuses to run at all, and the shape
 * that produces it is easy to write by accident — a `run:` value like `echo "results: ${{ … }}"` is a
 * plain scalar containing `: `, which YAML reads as a nested mapping. This check caught exactly that.
 */
const workflowFile = resolve(repoRootDir, '.github', 'workflows', 'build.yml');
let workflow: Workflow = {};
let parseError: string | undefined;
try {
  workflow = parseYaml(await readFile(workflowFile, 'utf8')) as Workflow;
} catch (error) {
  parseError = error instanceof Error ? error.message : String(error);
}

const { invocations: scriptInvocations, problems: scriptProblems } = await invocationsFromScripts(packageJson.scripts);
const { invocations: ciInvocations, problems: ciProblems } = await invocationsFromWorkflow(
  workflow,
  packageJson.scripts,
);

const { tests, unresolved, files } = await collectTests();

/** What the unresolved templates mean for a failure message: names that were never in the comparison. */
const unresolvedHint =
  unresolved.length === 0
    ? ''
    : `\nUnresolved template describe names (not searched): ${unresolved
        .map((entry) => `${entry.file}: \`${entry.raw}\``)
        .join(', ')}`;

/** Filtered invocations that select nothing, reported as strings so a failure names all of them at once. */
function filtersMatchingNothing(invocations: Invocation[]): string[] {
  return invocations
    .filter((invocation) => invocation.filter !== undefined && !tests.some((test) => runs(invocation, test)))
    .map(
      (invocation) =>
        `${invocation.source} filters on \`${invocation.filter}\` over ${
          invocation.paths.join(' ') || '(the whole tree)'
        }, which matches no test there`,
    );
}

describe('package.json -t patterns', () => {
  // Three emptiness checks before the real one. Each of the three inputs — the script list, the walk,
  // and the name extraction — can come back empty through an ordinary refactor, and an empty input
  // makes the assertion below pass over nothing, which is the exact failure mode this file exists to
  // rule out for the scripts themselves.
  it('finds filtered scripts to check', () => {
    const filtered = scriptInvocations.filter((invocation) => invocation.filter !== undefined);
    expect(filtered.length, 'no filtered scripts found — has package.json changed shape?').toBeGreaterThan(0);
  });

  it('finds test files to read test names out of', () => {
    expect(files, 'the walk found no *.test.ts files — has the tree moved?').toBeGreaterThan(50);
  });

  it('finds test names in them', () => {
    expect(tests.length, 'no test names extracted — has CALL stopped matching?').toBeGreaterThan(100);
  });

  it('resolves every script chain it reads', () => {
    expect(scriptProblems).toEqual([]);
  });

  it('every filtered script matches a test in the files it runs', () => {
    expect(filtersMatchingNothing(scriptInvocations), unresolvedHint).toEqual([]);
  });

  // Without this, renaming a template `describe` would quietly retire its resolver: the names it used
  // to contribute would vanish from the set and nothing would say so, leaving the check above weaker
  // than it reads.
  it('every template resolver still names a template that exists', () => {
    expect(Object.keys(TEMPLATE_RESOLVERS).filter((key) => !usedResolvers.has(key))).toEqual([]);
  });
});

describe('build.yml -t patterns', () => {
  it('parses the workflow', () => {
    expect(parseError, `.github/workflows/build.yml is not valid YAML: ${parseError}`).toBe(undefined);
  });

  // Same emptiness reasoning as above, aimed at the workflow: the jobs that split the Kotlin client
  // families and the controller units exist only as `-t` patterns in a build matrix, and if this file
  // stopped finding them it would pass over nothing while those jobs ran zero tests.
  it('finds filtered jobs to check', () => {
    const filtered = ciInvocations.filter((invocation) => invocation.filter !== undefined);
    expect(filtered.length, 'no -t found in build.yml — has the workflow changed shape?').toBeGreaterThan(0);
  });

  // Covers both indirections and the script names themselves: a `run:` step naming a script that does
  // not exist, a matrix key the job stopped supplying, and a leg that dropped the key its siblings carry.
  it('resolves every script, variable and matrix key the workflow reads', () => {
    expect(ciProblems).toEqual([]);
  });

  it('every filtered job matches a test in the files it runs', () => {
    expect(filtersMatchingNothing(ciInvocations), unresolvedHint).toEqual([]);
  });
});

describe('CI coverage of the test tree', () => {
  // The direction that catches a test falling out of the graph rather than a pattern falling off a test.
  //
  // `integration/spring-controllers boot` is why this exists: splitting the controllers job into per-unit
  // legs by pattern left no leg matching that name, so the suite asserting the whole tier-4 boot path —
  // offline resolution, the `run` task, the published port, readiness polling — stopped running in CI,
  // and every check in this file stayed green because each pattern still matched the units it was aimed
  // at. A forward check cannot see a gap; only this one can.
  //
  // Scope: every test this file can resolve, in every file the walk reaches. Directories with no tests
  // of their own (the snapshot trees, `test/specs`, `test/docker`) are outside the walk and so outside
  // this check. `.skip`/`.todo` tests are excluded: nothing is meant to run them.
  it('every test is run by at least one CI job', () => {
    const uncovered = tests
      .filter((test) => !ciInvocations.some((invocation) => runs(invocation, test)))
      .map((test) => `${test.file} :: ${test.name}`);

    expect(
      [...new Set(uncovered)],
      'these tests exist but no job in build.yml selects them, so nothing in CI runs them',
    ).toEqual([]);
  });
});
