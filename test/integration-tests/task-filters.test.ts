import { dirname, relative, resolve } from 'node:path';

import { expect } from '@std/expect';
import { walk } from '@std/fs/walk';
import { describe, it } from '@std/testing/bdd';
import { parse as parseYaml } from 'yaml';

import { repoRootDir } from '@goast/test-harness';

import { DRIVER_UNITS } from '../integration/kotlin-clients/build.ts';
import { SERVER_UNITS } from '../integration/spring-controllers/build.ts';
import { profiles } from '../output-tests/profiles.ts';

/**
 * `deno test --filter` exits 0 when it matches nothing.
 *
 * A task whose filter carries a typo — or whose filter names a `describe` someone later renamed — runs
 * zero tests, exits 0, and the CI job backed by it is vacuously green, permanently and with no signal.
 * That is the same shape as tier 4's "an absent artifact means this case conforms" inversion, and it
 * gets the same treatment: something that asserts the filter still names a suite that exists.
 *
 * Deno's `--filter` is a plain substring match against **top-level** test names (the `/regex/` form
 * documented for `Deno.test` does not apply here — measured on 2.9.5: `--filter "/unit disc/"`
 * filters out all 11 tests in `test/compile-tests`). So a filter `F` matches a suite `S` exactly when
 * `S.includes(F)`, which is the relation asserted below.
 *
 * `deno.json` is not the only place a filter lives. `.github/workflows/build.yml` splits the two Kotlin
 * client families and the controller units into jobs by passing `--filter` to `deno test` directly, out
 * of a build matrix. Those strings are in exactly the same danger as the ones in `deno.json` and are
 * checked here the same way — a CI job running zero tests and exiting 0 is the failure this file exists
 * to make impossible, and it does not matter which file spelled the filter.
 *
 * Three things this file learned the hard way, each of which it now checks:
 *
 * 1. **A filter must match a suite in the directory its command actually runs.** Matching against every
 *    suite name in the repo is not the same assertion and is weaker than it reads: `test:compile:ts:check`
 *    filters on `typescript/` over `test/compile-tests`, and `test/output-tests/output.test.ts` registers
 *    `typescript/models`, `typescript/fetch-clients` and friends — so the unscoped check stayed green on
 *    the strength of suites that command cannot reach. Every invocation below therefore carries its paths.
 *
 * 2. **The converse matters more.** Splitting a directory into per-unit jobs by filter silently dropped
 *    `integration/spring-controllers boot` out of CI entirely: no `…@sbN` filter is a substring of it,
 *    every leg stayed green, and the one test asserting the tier-4 infrastructure stopped running. The
 *    forward direction cannot see that — a filter that matches something says nothing about the suites
 *    nothing matches. `every suite is run by some CI job` is the check that catches it.
 *
 * 3. **A job's real filter is the one that survives expansion.** The workflow reaches `deno test` through
 *    `deno task` chains and passes filters through `env:`, so both are resolved here rather than
 *    pattern-matched at the surface — which also means an unknown task name in a `run:` step fails this
 *    file rather than waiting to fail the job.
 */

/**
 * A suite name a `--filter` could legitimately select, where it was found, and what has to be set for it
 * to register at all.
 *
 * `gates` is what makes the coverage check below mean anything. Every container-backed suite in the tree
 * is written as `const enabled = (Deno.env.get('GOAST_…') ?? '') !== ''` with the `describe` inside
 * `if (enabled)`, so a job that runs the file without that variable set does not skip the suite — the
 * suite never exists. A coverage check that ignored this would count the unfiltered `it-fetch-clients`
 * sweep, which runs `test/integration` without `GOAST_INTEGRATION`, as running every Docker leg in the
 * tier. Measured: with the gate ignored, deleting the `boot` matrix leg from `build.yml` left this file
 * green, which is the whole defect it is supposed to catch.
 */
type Suite = { name: string; file: string; gates: string[] };

/**
 * The variables a test file gates its own registration on.
 *
 * Only the two container gates. `GOAST_SNAPSHOT` selects a mode rather than deciding whether suites
 * exist, so requiring it would demand coverage that means nothing.
 */
const GATE_VARIABLES = ['GOAST_INTEGRATION', 'GOAST_COMPILE'];

/** Which gates a file reads. Whole-file, which over-approximates for the one file that mixes both. */
function gatesOf(source: string): string[] {
  return GATE_VARIABLES.filter((name) => source.includes(`Deno.env.get('${name}')`));
}

/** A `describe` whose name is a template literal no resolver here can turn into concrete names. */
type Unresolved = { raw: string; file: string };

/** Everything `collectSuiteNames` could work out, plus what it could not. */
type SuiteNames = { suites: Suite[]; unresolved: Unresolved[]; files: number };

/** Trees with no test files that are expensive or pointless to walk. */
const SKIP = [
  /[\\/]test[\\/](output|compile|wire|specs|cases|docker)([\\/]|$)/,
  /[\\/](node_modules|npm|out|coverage|\.git|\.goast-cache)([\\/]|$)/,
];

/** `describe('x')`, `describe("x")`, `` describe(`x`) `` — and the same for `Deno.test`. */
const SUITE_CALL = /(?:\bdescribe|\bDeno\.test)\(\s*(?:'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`)/g;

/**
 * A top-level `it`, which registers a test in its own right rather than a step.
 *
 * Anchored at column 0 deliberately. `--filter` only ever sees top-level names, and every `it` nested
 * in a `describe` is indented by `deno fmt`; collecting nested ones would let a filter naming a step
 * pass this guard while selecting nothing at run time.
 */
const TOP_LEVEL_IT = /^it\(\s*(?:'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`)/gm;

/** The `${...}` holes in a template literal. */
const INTERPOLATION = /\$\{([^}]*)\}/g;

/**
 * Templates whose holes are filled from data no amount of reading the source can produce.
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
    if (names.split(',').some((entry) => entry.trim().split(/\s+as\s+/)[0].trim() === name)) return specifier;
  }
  return undefined;
}

/**
 * Resolves a bare identifier used inside a template literal to the string it holds.
 *
 * Looks in the file itself first, then in the module the file imports the name from — the two shapes
 * `PROFILE` actually takes across the integration suites (declared locally in `fetch-clients` and
 * `k6-clients`, re-exported from `build.ts` in `angular-services` and `easy-network-stub`).
 */
async function resolveIdentifier(file: string, source: string, name: string): Promise<string | undefined> {
  const local = stringConst(source, name);
  if (local !== undefined) return local;

  const specifier = importSpecifier(source, name);
  if (specifier === undefined || !specifier.startsWith('.')) return undefined;

  try {
    return stringConst(await Deno.readTextFile(resolve(dirname(file), specifier)), name);
  } catch {
    return undefined;
  }
}

/** Every suite name a `--filter` could legitimately be aimed at, and the file each lives in. */
async function collectSuiteNames(): Promise<SuiteNames> {
  const suites: Suite[] = [];
  const unresolved: Unresolved[] = [];
  let files = 0;

  for (const root of ['test', 'packages']) {
    for await (const entry of walk(resolve(repoRootDir, root), { match: [/\.test\.ts$/], skip: SKIP })) {
      files++;
      const source = await Deno.readTextFile(entry.path);
      const file = relative(repoRootDir, entry.path).replace(/\\/g, '/');
      const gates = gatesOf(source);

      for (const match of [...source.matchAll(SUITE_CALL), ...source.matchAll(TOP_LEVEL_IT)]) {
        const [, single, double, template] = match;
        const literal = single ?? double;
        if (literal !== undefined) {
          suites.push({ name: literal, file, gates });
          continue;
        }

        const names = await expandTemplate(file, entry.path, source, template);
        if (names === undefined) unresolved.push({ raw: template, file });
        else for (const name of names) suites.push({ name, file, gates });
      }
    }
  }

  return { suites, unresolved, files };
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

// --- What each command actually runs ---------------------------------------------------------------

/**
 * One `deno test` invocation: the paths it runs, the filter it narrows them with, and the environment it
 * runs under.
 *
 * `paths` empty means the invocation named no path and therefore runs everything `deno.json`'s `test`
 * config includes — the shape of the bare `deno test -A` tasks. `env` is what decides whether the gated
 * suites in those paths register at all, and it accumulates from three places that all end up on the
 * same command line: a workflow step's `env:` mapping, the `NAME=value` prefix of the task command, and
 * the same prefix on any task that command chains into.
 */
type Invocation = { source: string; paths: string[]; filter?: string; env: Record<string, string> };

/** One command, with the environment it inherited from its step and its enclosing task chain. */
type Command = { command: string; env: Record<string, string> };

/** Command separators that end one invocation and begin another. A bare `|` does not; it pipes output. */
const SEGMENT_SEPARATOR = /&&|\|\||;|\n/;

/** Quoted or bare shell word. */
const SHELL_WORD = /"([^"]*)"|'([^']*)'|(\S+)/g;

/** A redirection or pipe: everything after it in a segment is plumbing, not arguments. */
const PLUMBING = /^\d*[<>|]/;

/** A `${{ matrix.<key> }}` standing alone as a whole argument. */
const MATRIX_REFERENCE = /^\$\{\{\s*matrix\.([\w-]+)\s*\}\}$/;

/** `$NAME` or `${NAME}` standing alone as a whole argument. */
const ENV_REFERENCE = /^\$\{?([A-Za-z_][\w]*)\}?$/;

/** Splits a shell script into the commands it runs in sequence. */
function commandSegments(script: string): string[] {
  return script.split(SEGMENT_SEPARATOR).map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}

/** The words of one segment, up to the first pipe or redirection. */
function words(segment: string): string[] {
  const found: string[] = [];
  for (const match of segment.matchAll(SHELL_WORD)) {
    const word = match[1] ?? match[2] ?? match[3];
    if (PLUMBING.test(word)) break;
    found.push(word);
  }
  return found;
}

/**
 * Expands `deno task <name>` into the segments that task runs, recursively.
 *
 * An unknown name is reported rather than skipped: `deno task typo` in a `run:` step is a job that dies
 * on `Task not found`, and this file already holds both sides of that comparison.
 */
function expandSegments(
  script: string,
  tasks: Record<string, string>,
  problems: string[],
  source: string,
  inherited: Record<string, string> = {},
  seen: string[] = [],
): Command[] {
  const expanded: Command[] = [];

  for (const segment of commandSegments(script)) {
    const parts = words(segment);
    const env = { ...inherited, ...assignments(parts) };
    const denoAt = parts.indexOf('deno');
    if (denoAt >= 0 && parts[denoAt + 1] === 'task' && parts[denoAt + 2] !== undefined) {
      const name = parts[denoAt + 2];
      if (seen.includes(name)) continue; // A task chain that loops has bigger problems than this file.
      const command = tasks[name];
      if (command === undefined) {
        problems.push(`${source} runs \`deno task ${name}\`, which is not a task in deno.json`);
        continue;
      }
      expanded.push(...expandSegments(command, tasks, problems, source, env, [...seen, name]));
      continue;
    }
    expanded.push({ command: segment, env });
  }

  return expanded;
}

/** The `NAME=value` prefix a command carries, which is how every task in `deno.json` sets its gates. */
function assignments(parts: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const part of parts) {
    const assignment = /^([A-Za-z_]\w*)=(.*)$/.exec(part);
    if (assignment === null) break;
    env[assignment[1]] = assignment[2];
  }
  return env;
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
 * The concrete strings one `--filter` argument can take at run time.
 *
 * Two indirections to walk, in the order the value travels: the argument may name a step environment
 * variable, and that variable's value may name a matrix key. Both are followed rather than pattern-matched
 * at the surface, because the point of the check downstream is what the job runs, not what it looks like.
 *
 * Every `include` leg is required to define a key the workflow reads. A leg that lost it does not merely
 * go unchecked: GitHub expands the missing value to the empty string, `--filter ""` is a substring match
 * that selects *every* test in the directory, and that leg silently stops being the one-unit job it is
 * named after. Catching it needs the per-leg count; "did anything supply this key" passes on a sibling.
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
 * A segment with no `deno test` in it produces none. A segment with one produces as many as its filter
 * has possible values — a matrix reference stands for every leg at once.
 */
function invocationsFromSegment(
  { command, env }: Command,
  source: string,
  matrix: Record<string, unknown>,
  problems: string[],
): Invocation[] {
  const parts = words(command);
  const denoAt = parts.indexOf('deno');
  if (denoAt < 0 || parts[denoAt + 1] !== 'test') return [];

  const paths: string[] = [];
  let filter: string | undefined;

  for (let index = denoAt + 2; index < parts.length; index++) {
    const part = parts[index];
    if (part === '--filter') {
      filter = parts[++index];
      continue;
    }
    if (part.startsWith('--filter=')) {
      filter = part.slice('--filter='.length);
      continue;
    }
    // Flags this file does not model. None of them take a path-shaped value that would be mistaken for
    // one below, because `deno test`'s value-taking flags all use `--flag=value` in this repo.
    if (part.startsWith('-')) continue;
    paths.push(part.replace(/\\/g, '/').replace(/\/$/, ''));
  }

  if (filter === undefined) return [{ source, paths, env }];

  const { values, problems: filterProblems } = resolveFilter(filter, env, matrix, source);
  problems.push(...filterProblems);
  return values.map((value) => ({ source, paths, filter: value, env }));
}

/** Every `deno test` `deno.json` describes, one entry per task, chains expanded. */
function invocationsFromTasks(tasks: Record<string, string>): { invocations: Invocation[]; problems: string[] } {
  const invocations: Invocation[] = [];
  const problems: string[] = [];

  for (const [task, command] of Object.entries(tasks)) {
    const source = `task \`${task}\``;
    for (const segment of expandSegments(command, tasks, problems, source)) {
      invocations.push(...invocationsFromSegment(segment, source, {}, problems));
    }
  }
  return { invocations, problems };
}

/** As much of `build.yml` as this file reads. Everything else in the workflow is ignored. */
type Workflow = {
  env?: Record<string, string>;
  jobs?: Record<string, {
    env?: Record<string, string>;
    strategy?: { matrix?: Record<string, unknown> };
    steps?: { run?: string; env?: Record<string, string> }[];
  }>;
};

/** Every `deno test` the workflow reaches, through whatever chain of tasks and variables. */
function invocationsFromWorkflow(
  workflow: Workflow,
  tasks: Record<string, string>,
): { invocations: Invocation[]; problems: string[] } {
  const invocations: Invocation[] = [];
  const problems: string[] = [];

  for (const [job, definition] of Object.entries(workflow.jobs ?? {})) {
    const matrix = definition.strategy?.matrix ?? {};
    for (const step of definition.steps ?? []) {
      if (typeof step?.run !== 'string') continue;
      const source = `job \`${job}\` (build.yml)`;
      const env = { ...workflow.env, ...definition.env, ...step.env };
      for (const segment of expandSegments(step.run, tasks, problems, source, env)) {
        invocations.push(...invocationsFromSegment(segment, source, matrix, problems));
      }
    }
  }
  return { invocations, problems };
}

/** Does an invocation reach this file at all? No paths means it named none, so it runs the whole tree. */
function pathCovers(paths: string[], file: string): boolean {
  return paths.length === 0 || paths.some((path) => file === path || file.startsWith(`${path}/`));
}

/** Would this invocation run this suite — in scope, past the filter, and with the suite's gates open? */
function runs(invocation: Invocation, suite: Suite): boolean {
  return pathCovers(invocation.paths, suite.file) &&
    (invocation.filter === undefined || suite.name.includes(invocation.filter)) &&
    suite.gates.every((gate) => (invocation.env[gate] ?? '') !== '');
}

// --- The checks -------------------------------------------------------------------------------------

const denoJson = JSON.parse(await Deno.readTextFile(resolve(repoRootDir, 'deno.json'))) as {
  tasks: Record<string, string>;
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
  workflow = parseYaml(await Deno.readTextFile(workflowFile)) as Workflow;
} catch (error) {
  parseError = error instanceof Error ? error.message : String(error);
}

const { invocations: taskInvocations, problems: taskProblems } = invocationsFromTasks(denoJson.tasks);
const { invocations: ciInvocations, problems: ciProblems } = invocationsFromWorkflow(workflow, denoJson.tasks);

const { suites, unresolved, files } = await collectSuiteNames();

/** What the unresolved templates mean for a failure message: names that were never in the comparison. */
const unresolvedHint = unresolved.length === 0
  ? ''
  : `\nUnresolved template suite names (not searched): ${
    unresolved.map((entry) => `${entry.file}: \`${entry.raw}\``).join(', ')
  }`;

/** Filtered invocations that select nothing, reported as strings so a failure names all of them at once. */
function filtersMatchingNothing(invocations: Invocation[]): string[] {
  return invocations
    .filter((invocation) => invocation.filter !== undefined && !suites.some((suite) => runs(invocation, suite)))
    .map((invocation) =>
      `${invocation.source} filters on \`${invocation.filter}\` over ${
        invocation.paths.join(' ') || '(the whole tree)'
      }, which matches no suite there`
    );
}

describe('deno task --filter arguments', () => {
  // Three emptiness checks before the real one. Each of the three inputs — the task list, the walk,
  // and the name extraction — can come back empty through an ordinary refactor, and an empty input
  // makes the assertion below pass over nothing, which is the exact failure mode this file exists to
  // rule out for the tasks themselves.
  it('finds filtered tasks to check', () => {
    const filtered = taskInvocations.filter((invocation) => invocation.filter !== undefined);
    expect(filtered.length, 'no filtered tasks found — has deno.json changed shape?').toBeGreaterThan(0);
  });

  it('finds test files to read suite names out of', () => {
    expect(files, 'the walk found no *.test.ts files — has the tree moved?').toBeGreaterThan(50);
  });

  it('finds suite names in them', () => {
    expect(suites.length, 'no describe/it names extracted — has SUITE_CALL stopped matching?')
      .toBeGreaterThan(100);
  });

  it('resolves every task chain it reads', () => {
    expect(taskProblems).toEqual([]);
  });

  it('every filtered task matches a suite in the directory it runs', () => {
    expect(filtersMatchingNothing(taskInvocations), unresolvedHint).toEqual([]);
  });

  // Without this, renaming a template `describe` would quietly retire its resolver: the names it used
  // to contribute would vanish from the set and nothing would say so, leaving the check above weaker
  // than it reads.
  it('every template resolver still names a template that exists', () => {
    expect([...Object.keys(TEMPLATE_RESOLVERS)].filter((key) => !usedResolvers.has(key))).toEqual([]);
  });
});

describe('build.yml --filter arguments', () => {
  it('parses the workflow', () => {
    expect(parseError, `.github/workflows/build.yml is not valid YAML: ${parseError}`).toBe(undefined);
  });

  // Same emptiness reasoning as above, aimed at the workflow: the jobs that split the Kotlin client
  // families and the controller units exist only as `--filter` strings in a build matrix, and if this
  // file stopped finding them it would pass over nothing while those jobs ran zero tests.
  it('finds filtered jobs to check', () => {
    const filtered = ciInvocations.filter((invocation) => invocation.filter !== undefined);
    expect(filtered.length, 'no --filter found in build.yml — has the workflow changed shape?')
      .toBeGreaterThan(0);
  });

  // Covers both indirections and the task names themselves: a `run:` step naming a task that does not
  // exist, a matrix key the job stopped supplying, and a leg that dropped the key its siblings carry.
  it('resolves every task, variable and matrix key the workflow reads', () => {
    expect(ciProblems).toEqual([]);
  });

  it('every filtered job matches a suite in the directory it runs', () => {
    expect(filtersMatchingNothing(ciInvocations), unresolvedHint).toEqual([]);
  });
});

describe('CI coverage of the test tree', () => {
  // The direction that catches a suite falling out of the graph rather than a filter falling off a suite.
  //
  // `integration/spring-controllers boot` is why this exists: splitting the controllers job into per-unit
  // legs by `--filter` left no leg whose filter is a substring of that name, so the suite asserting the
  // whole tier-4 boot path — offline resolution, the `run` task, the published port, readiness polling —
  // stopped running in CI, and every check in this file stayed green because each filter still matched
  // the units it was aimed at. A forward check cannot see a gap; only this one can.
  //
  // Scope: every suite name this file can resolve, in every file the walk reaches. Directories with no
  // suites of their own (`test/cases`, `test/docker`, the snapshot trees) are outside the walk and so
  // outside this check; `test/cases` is run by the `unit` job regardless.
  it('every suite is run by at least one CI job', () => {
    const uncovered = suites
      .filter((suite) => !ciInvocations.some((invocation) => runs(invocation, suite)))
      .map((suite) => `${suite.file} :: ${suite.name}`);

    expect(
      [...new Set(uncovered)],
      'these suites exist but no job in build.yml selects them, so nothing in CI runs them',
    ).toEqual([]);
  });
});
