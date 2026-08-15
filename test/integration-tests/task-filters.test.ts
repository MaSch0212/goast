import { dirname, relative, resolve } from 'node:path';

import { expect } from '@std/expect';
import { walk } from '@std/fs/walk';
import { describe, it } from '@std/testing/bdd';

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
 */

/** A suite name a `--filter` could legitimately select, and where it was found. */
type Suite = { name: string; file: string };

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

/** Every suite name a `--filter` in `deno.json` could legitimately be aimed at. */
async function collectSuiteNames(): Promise<SuiteNames> {
  const suites: Suite[] = [];
  const unresolved: Unresolved[] = [];
  let files = 0;

  for (const root of ['test', 'packages']) {
    for await (const entry of walk(resolve(repoRootDir, root), { match: [/\.test\.ts$/], skip: SKIP })) {
      files++;
      const source = await Deno.readTextFile(entry.path);
      const file = relative(repoRootDir, entry.path).replace(/\\/g, '/');

      for (const match of [...source.matchAll(SUITE_CALL), ...source.matchAll(TOP_LEVEL_IT)]) {
        const [, single, double, template] = match;
        const literal = single ?? double;
        if (literal !== undefined) {
          suites.push({ name: literal, file });
          continue;
        }

        const names = await expandTemplate(file, entry.path, source, template);
        if (names === undefined) unresolved.push({ raw: template, file });
        else for (const name of names) suites.push({ name, file });
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

/** Every `--filter` in `deno.json`, paired with the task that carries it. */
function filtersFromTasks(tasks: Record<string, string>): { task: string; filter: string }[] {
  const found: { task: string; filter: string }[] = [];
  for (const [task, command] of Object.entries(tasks)) {
    for (const match of command.matchAll(/--filter\s+(?:"([^"]*)"|'([^']*)'|(\S+))/g)) {
      found.push({ task, filter: match[1] ?? match[2] ?? match[3] });
    }
  }
  return found;
}

const denoJson = JSON.parse(await Deno.readTextFile(resolve(repoRootDir, 'deno.json'))) as {
  tasks: Record<string, string>;
};
const filters = filtersFromTasks(denoJson.tasks);
const { suites, unresolved, files } = await collectSuiteNames();

describe('deno task --filter arguments', () => {
  // Three emptiness checks before the real one. Each of the three inputs — the task list, the walk,
  // and the name extraction — can come back empty through an ordinary refactor, and an empty input
  // makes the assertion below pass over nothing, which is the exact failure mode this file exists to
  // rule out for the tasks themselves.
  it('finds filtered tasks to check', () => {
    expect(filters.length, 'no filtered tasks found — has deno.json changed shape?').toBeGreaterThan(0);
  });

  it('finds test files to read suite names out of', () => {
    expect(files, 'the walk found no *.test.ts files — has the tree moved?').toBeGreaterThan(50);
  });

  it('finds suite names in them', () => {
    expect(suites.length, 'no describe/it names extracted — has SUITE_CALL stopped matching?')
      .toBeGreaterThan(100);
  });

  it('every filtered task matches at least one suite name', () => {
    const names = suites.map((suite) => suite.name);
    const hint = unresolved.length === 0
      ? ''
      : `\nUnresolved template suite names (not searched): ${
        unresolved.map((u) => `${u.file}: \`${u.raw}\``).join(', ')
      }`;

    for (const { task, filter } of filters) {
      expect(
        names.some((name) => name.includes(filter)),
        `task \`${task}\` filters on \`${filter}\`, which matches no suite name.${hint}`,
      ).toBe(true);
    }
  });

  // Without this, renaming a template `describe` would quietly retire its resolver: the names it used
  // to contribute would vanish from the set and nothing would say so, leaving the check above weaker
  // than it reads.
  it('every template resolver still names a template that exists', () => {
    expect([...Object.keys(TEMPLATE_RESOLVERS)].filter((key) => !usedResolvers.has(key))).toEqual([]);
  });
});
