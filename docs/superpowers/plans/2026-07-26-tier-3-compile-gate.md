# Tier 3 Compile Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that every committed generated tree is valid in its target language, by compiling all 782 compile units
and committing the compiler's diagnostics as reviewable snapshots.

**Architecture:** One compiler invocation per profile, never per tree — a single Gradle build over all Kotlin units, two
`deno check` runs on the host, and one `tsc --noEmit` run per containerized TypeScript profile. Diagnostics are parsed
into a normalized, sorted form and verified against committed snapshots under `test/compile/`, using the same
`GOAST_SNAPSHOT=write|check` machinery tier 2 uses. A unit that compiles cleanly has no snapshot file; a unit that fails
commits its errors.

**Tech Stack:** Deno 2.x, Docker, Gradle + Kotlin JVM plugin, `tsc`, the existing `@goast/test-harness` snapshot engine.

## Global Constraints

- **Deno and Docker are the only prerequisites.** Every other toolchain — JDK, Gradle, Node, `tsc` — lives inside a
  container. Nothing in this plan asks a contributor to install anything else.
- Tiers 1 and 2 must stay Docker-free. `deno task test` must not start a container.
- If `docker` is absent, tier 3 fails with a plain `Docker is required for this tier`, not a spawn error.
- **Do not fix generator defects in this phase.** The gate records what fails; fixes are separate work with their own
  diffs. This mirrors phase 2b, where authoring the corpus and fixing what it found were deliberately separate.
- **Do not edit anything under `test/specs/` or `test/output/`.** Tier 3 reads the committed tree; it never regenerates
  it. Any diff under those paths in this phase is out of scope and a review must reject it.
- Run every command from the repo root.
- New files are UTF-8 with LF endings and no BOM. `deno fmt --check` and `deno lint` must pass at every commit.
- One commit per task.
- **Never run bare `deno task test`** while working on this plan. It runs the tier-2 output tests in *write* mode (which
  is intended for the everyday loop, see Task 7) and would rewrite committed snapshots, masking exactly what you are
  measuring. Use `deno test -A packages/core packages/kotlin packages/typescript test/harness` for unit tests and
  `GOAST_SNAPSHOT=check deno test -A test/output-tests` for tier 2.
- **Name the workspace members individually in that command; do not shorten it to `deno test -A packages test/harness`.**
  Measured during Task 1: a directory argument spanning several workspace members runs each member's tests once per
  member, so `deno test -A packages` reports 309 tests for the 103 that exist and takes 52s. The member-explicit form
  reports the true 128 (42 core + 27 kotlin + 34 typescript + 25 harness) in 17s. A tripled count is not just slow — it
  makes a before/after comparison meaningless, which is what the gate is for.

## Design decisions

Two decisions were taken by the repo owner before this plan was written. They shape everything below.

### Diagnostics are snapshots, not a pass/fail assertion

The corpus deliberately contains generated code that does not compile — that is the corpus doing its job. Ten defects
are registered and unfixed, and several of them produce syntactically invalid output: `data class (` with no identifier
(40 Kotlin files), `val : String? = null` (20), `@ApiResponse(responseCode = null)` (4), five `data class MyThing`
declarations in one Kotlin package, unescaped hard keywords such as `val class:`, 18 TypeScript `TS2456` circular type
aliases, `export type  = {` (20 TypeScript files), and 10 files importing `'<output>/models/.ts'`.

So tier 3 does not assert "everything compiles". It asserts **"exactly these things fail, with exactly these errors"**:

- A unit that compiles cleanly has **no** file under `test/compile/`.
- A unit that fails commits its normalized diagnostics to `test/compile/<language>/<profile>/<versionDir>/<spec>.txt`.
- Fixing a generator defect makes write mode **delete** the file — a visible deletion in the diff.
- A regression adds or changes a file, and check mode fails.

This is the same shape the corpus already uses for generation crashes: `verify-profile.ts` commits an `.error.txt` when
generation throws, and refuses in check mode when a committed `.error.txt` exists but generation now succeeds
(`test/harness/snapshot/verify-profile.ts:88-96`). Tier 3 extends that precedent from "the generator crashed" to "the
compiler rejected the output".

The cost is that compiler diagnostics are verbose and version-sensitive, which the normalization rules and pinned
compiler versions below exist to control.

### The gate records; it does not fix

This phase builds the machinery and commits what it finds. Fixing defects 7, 17-22, the unregistered Kotlin
reserved-word defect, and name deduplication is a later phase with its own diffs. Two of those — name deduplication and
`TS2456` — are open-ended design work, and blocking the compile gate behind them would leave the repo with no compile
coverage for however long they take.

### The gate is opt-in, and the mechanism is not obvious

`deno.json` sets `test.include` to `["packages", "test"]`, so `deno test -A` — which is what `deno task test` runs —
would discover `test/compile-tests/` and start Docker, breaking the constraint two lines above. Three mechanisms were
measured before choosing:

- Adding `test/compile-tests` to `test.exclude` **does not work**: an explicit path argument does not override
  `test.exclude`, so `deno test test/compile-tests` would then find nothing. Verified empirically.
- Naming the files so bare discovery misses them (`compile-gate.ts` rather than `compile.test.ts`) works only when each
  file is named individually on the command line — `deno test <dir>` applies the naming convention and finds nothing.
  Verified empirically. That makes adding a third file a silent no-op, so it is rejected.
- **Chosen:** the driver reads `GOAST_COMPILE` at module top level and **registers no tests at all** when it is unset.
  Bare `deno test -A` loads the module, runs nothing, and starts no container. Registering nothing rather than skipping
  matters: 782 ignored steps in the everyday run would be noise nobody reads.

`test:compile` and `test:compile:check` set `GOAST_COMPILE=1`. Module load still enumerates units, which is filesystem
work and touches no container.

### The invariant that keeps the gate honest

**A non-zero compiler exit with zero parsed diagnostics is a harness failure, never a clean unit.** A parser that
silently stops matching — because a Deno, Gradle, or `tsc` upgrade changed the output format — would otherwise turn the
entire gate vacuously green while reporting success. Every runner asserts this explicitly, and every parser is pinned by
tests against captured fixture output so a format change fails loudly in a unit test first.

## Compile units

A **compile unit** is one committed generated tree: `(language, profile, versionDir, spec)`. Its id is
`<language>/<profile>/<versionDir>/<spec>`, which doubles as its snapshot path. Measured counts on disk today:

| Language   | Profiles | Units   | How it compiles                                            |
| ---------- | -------- | ------- | ---------------------------------------------------------- |
| Kotlin     | 10       | **512** | one Gradle build, 512 subprojects, `--parallel --continue` |
| TypeScript | 2        | **108** | `deno check` on the host, one run per profile              |
| TypeScript | 3        | **162** | `tsc --noEmit` in the `node` image, one run per profile    |

512 rather than 540 because a spec that produced no tree has none to compile: `v3/recursive-refs` errored in all ten
Kotlin profiles, and the two `models` profiles emit nothing for the nine endpoint-only specs.

Unit discovery is driven by the directory actually existing on disk, not by the profile registry alone.

## File Structure

Created:

| Path                                          | Responsibility                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `test/harness/compile/types.ts`               | `CompileUnit`, `Diagnostic`, `CompileProfileKind`                             |
| `test/harness/compile/units.ts`               | `discoverCompileUnits` — enumerate units from the registry plus disk          |
| `test/harness/compile/diagnostics.ts`         | `formatDiagnostics`, `relativizeDiagnostic`, the sort and dedupe rules        |
| `test/harness/compile/verify.ts`              | `verifyCompileDiagnostics` — write/check, including snapshot deletion         |
| `test/harness/compile/parse-deno-check.ts`    | `parseDenoCheckDiagnostics`                                                  |
| `test/harness/compile/parse-tsc.ts`           | `parseTscDiagnostics`                                                        |
| `test/harness/compile/parse-kotlin.ts`        | `parseKotlinDiagnostics`                                                     |
| `test/harness/compile/mod.ts`                 | barrel                                                                       |
| `test/harness/docker.ts`                      | `buildImage`, `runContainer`, `requireDocker`                                 |
| `test/harness/fixtures/`                      | captured compiler output, the parsers' regression fixtures                    |
| `test/docker/node/Dockerfile`                 | Node + `tsc` + `@angular/*`, `rxjs`, `@types/k6`, `easy-network-stub`         |
| `test/docker/node/package.json`               | the pinned dependency set that image bakes in                                |
| `test/docker/node/tsconfig.base.json`         | the compiler options every containerized TypeScript unit is checked under     |
| `test/docker/node/k6-jslib.d.ts`              | ambient declaration for `https://jslib.k6.io/formdata/0.0.2/index.js`         |
| `test/docker/kotlin/Dockerfile`               | JDK + Gradle, dependency cache pre-warmed in a layer                          |
| `test/docker/kotlin/versions.gradle.kts`      | every dependency coordinate, consumed by both the image and the synthesis     |
| `test/docker/kotlin/warmup/`                  | the throwaway project the image builds to populate the cache layer            |
| `test/compile-tests/paths.ts`                  | `compileRootDir`, so no module has to import a `.test.ts` file                 |
| `test/compile-tests/compile.test.ts`          | the tier-3 driver                                                            |
| `test/compile-tests/orphans.test.ts`          | orphan sweep over `test/compile/`                                            |
| `test/compile-tests/runners/deno-check.ts`    | runs `deno check`, returns diagnostics per unit                               |
| `test/compile-tests/runners/tsc.ts`           | runs `tsc --noEmit` in the `node` image                                       |
| `test/compile-tests/runners/kotlin.ts`        | synthesizes the Gradle build, runs it in the `kotlin` image                   |
| `test/compile/`                               | committed diagnostics snapshots                                              |

Modified:

- `test/harness/mod.ts` — export `./compile/mod.ts` and `./docker.ts`.
- `deno.json` — `test:compile`, `test:check`, `test:all`; `fmt.exclude` and `lint.exclude` gain `test/compile/**`.
- `.gitattributes` — `test/compile/** linguist-generated`.
- `test/README.md` — a tier-3 section.
- `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` — Task 8 registers what the gate found.

**Placement rationale.** Diagnostics live in `test/compile/`, not beside the trees in `test/output/`, for two reasons:
`test/output/**` means "written by a generator" and mixing in files written by a compiler blurs that; and tier 2's
orphan sweep (`findOrphanSnapshots`) walks `test/output` and would report every diagnostics file as an orphan. A separate
root keeps both sweeps simple. `test/compile-tests/` mirrors the existing `test/output-tests/` convention.

---

### Task 1: Compile units, diagnostics, and the verify contract

**Files:**

- Create: `test/harness/compile/types.ts`
- Create: `test/harness/compile/units.ts`
- Create: `test/harness/compile/diagnostics.ts`
- Create: `test/harness/compile/verify.ts`
- Create: `test/harness/compile/mod.ts`
- Test: `test/harness/compile/units.test.ts`, `diagnostics.test.ts`, `verify.test.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: `DiscoveredSpec` and `SpecVersionDir` from `test/harness/specs.ts`; `snapshotRootDir` from
  `test/harness/paths.ts`; `verifyText` and `VerifyOptions` from `test/harness/snapshot/`.
- Produces, and every later task depends on exactly these signatures:
  ```ts
  export type CompileUnit = {
    language: 'kotlin' | 'typescript';
    profile: string;
    versionDir: SpecVersionDir;
    spec: string;
    treeDir: string;
    id: string;
  };
  export type Diagnostic = { file: string; line: number | null; column: number | null; message: string };
  export type UnitRegistryEntry = { name: string; language: 'kotlin' | 'typescript'; versions: 'all' | SpecVersionDir[] };

  export function discoverCompileUnits(
    profiles: readonly UnitRegistryEntry[],
    specs: readonly DiscoveredSpec[],
    root?: string,
  ): Promise<CompileUnit[]>;
  export function formatDiagnostics(diagnostics: readonly Diagnostic[]): string;
  export function compileSnapshotFile(compileRootDir: string, unit: CompileUnit): string;
  export function verifyCompileDiagnostics(
    snapshotFile: string,
    diagnostics: readonly Diagnostic[],
    options?: VerifyOptions,
  ): Promise<void>;
  ```

`UnitRegistryEntry` is structurally the subset of `test/output-tests/profiles.ts`'s `Profile` that unit discovery needs.
Declaring it here rather than importing `Profile` keeps `@goast/test-harness` from depending on the test driver, which is
the direction the existing dependency already runs.

- [ ] **Step 1: Write the failing test for unit discovery**

Create `test/harness/compile/units.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { ensureDir } from '@std/fs/ensure-dir';

import type { DiscoveredSpec } from '../specs.ts';
import { discoverCompileUnits } from './units.ts';

const spec = (versionDir: 'v2' | 'v3' | 'v3.1', name: string): DiscoveredSpec => ({
  versionDir,
  version: versionDir === 'v2' ? '2.0' : versionDir === 'v3' ? '3.0' : '3.1',
  name,
  files: [],
});

describe('discoverCompileUnits', () => {
  let root: string;

  beforeEach(async () => {
    root = await Deno.makeTempDir();
  });
  afterEach(async () => {
    await Deno.remove(root, { recursive: true });
  });

  it('yields one unit per existing tree directory', async () => {
    await ensureDir(join(root, 'kotlin', 'models@sb3', 'v3', 'simple'));

    const units = await discoverCompileUnits(
      [{ name: 'models@sb3', language: 'kotlin', versions: 'all' }],
      [spec('v3', 'simple')],
      root,
    );

    expect(units).toEqual([{
      language: 'kotlin',
      profile: 'models@sb3',
      versionDir: 'v3',
      spec: 'simple',
      treeDir: join(root, 'kotlin', 'models@sb3', 'v3', 'simple'),
      id: 'kotlin/models@sb3/v3/simple',
    }]);
  });

  it('skips a spec whose tree does not exist, so an errored generation is not a phantom unit', async () => {
    await ensureDir(join(root, 'kotlin', 'models@sb3', 'v3', 'kept'));
    await Deno.writeTextFile(join(root, 'kotlin', 'models@sb3', 'v3', 'crashed.error.txt'), 'boom\n');

    const units = await discoverCompileUnits(
      [{ name: 'models@sb3', language: 'kotlin', versions: 'all' }],
      [spec('v3', 'kept'), spec('v3', 'crashed')],
      root,
    );

    expect(units.map((u) => u.spec)).toEqual(['kept']);
  });

  it('honours a profile restricted to some version directories', async () => {
    await ensureDir(join(root, 'typescript', 'models', 'v3', 'a'));
    await ensureDir(join(root, 'typescript', 'models', 'v2', 'b'));

    const units = await discoverCompileUnits(
      [{ name: 'models', language: 'typescript', versions: ['v3'] }],
      [spec('v3', 'a'), spec('v2', 'b')],
      root,
    );

    expect(units.map((u) => u.id)).toEqual(['typescript/models/v3/a']);
  });

  it('sorts by id so a run order never depends on directory iteration order', async () => {
    for (const p of ['b-profile', 'a-profile']) {
      await ensureDir(join(root, 'typescript', p, 'v3', 'z'));
      await ensureDir(join(root, 'typescript', p, 'v3', 'a'));
    }

    const units = await discoverCompileUnits(
      [
        { name: 'b-profile', language: 'typescript', versions: 'all' },
        { name: 'a-profile', language: 'typescript', versions: 'all' },
      ],
      [spec('v3', 'z'), spec('v3', 'a')],
      root,
    );

    expect(units.map((u) => u.id)).toEqual([
      'typescript/a-profile/v3/a',
      'typescript/a-profile/v3/z',
      'typescript/b-profile/v3/a',
      'typescript/b-profile/v3/z',
    ]);
  });

  it('ignores an empty tree directory, which has nothing to compile', async () => {
    await ensureDir(join(root, 'typescript', 'models', 'v3', 'empty'));

    const units = await discoverCompileUnits(
      [{ name: 'models', language: 'typescript', versions: 'all' }],
      [spec('v3', 'empty')],
      root,
    );

    expect(units).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/compile/units.test.ts`
Expected: FAIL — `Module not found "./units.ts"`.

- [ ] **Step 3: Write `types.ts`**

```ts
import type { SpecVersionDir } from '../specs.ts';

/** The two target languages tier 3 compiles. */
export type CompileLanguage = 'kotlin' | 'typescript';

/**
 * One committed generated tree that must be valid in its language.
 *
 * `id` is `<language>/<profile>/<versionDir>/<spec>` and is both the unit's stable name in test output
 * and its snapshot path under `test/compile/`.
 */
export type CompileUnit = {
  language: CompileLanguage;
  profile: string;
  versionDir: SpecVersionDir;
  spec: string;
  /** Absolute path to the committed tree. */
  treeDir: string;
  id: string;
};

/**
 * One compiler diagnostic, reduced to what is stable across runs and machines.
 *
 * `file` is relative to the unit's tree with forward slashes, so the snapshot does not encode a
 * container path or a checkout location. It is `''` when the compiler blamed no particular file.
 * `line` and `column` are `null` when the compiler gave none.
 */
export type Diagnostic = {
  file: string;
  line: number | null;
  column: number | null;
  message: string;
};

/** The subset of the tier-2 profile registry that unit discovery needs. */
export type UnitRegistryEntry = {
  name: string;
  language: CompileLanguage;
  versions: 'all' | SpecVersionDir[];
};
```

- [ ] **Step 4: Write `units.ts`**

```ts
import { join } from 'node:path';

import { snapshotRootDir } from '../paths.ts';
import type { DiscoveredSpec } from '../specs.ts';
import type { CompileUnit, UnitRegistryEntry } from './types.ts';

/**
 * Enumerates the compile units present on disk.
 *
 * Membership is decided by the tree directory existing and being non-empty, not by the registry
 * alone: a spec whose generation threw has an `.error.txt` and no tree, and a `models` profile emits
 * nothing at all for an endpoint-only spec. Either would otherwise become a unit with no sources,
 * which a compiler reports as an error about the missing directory rather than about the corpus.
 */
export async function discoverCompileUnits(
  profiles: readonly UnitRegistryEntry[],
  specs: readonly DiscoveredSpec[],
  root: string = snapshotRootDir,
): Promise<CompileUnit[]> {
  const units: CompileUnit[] = [];

  for (const profile of profiles) {
    for (const spec of specs) {
      if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;

      const treeDir = join(root, profile.language, profile.name, spec.versionDir, spec.name);
      if (!(await hasFiles(treeDir))) continue;

      units.push({
        language: profile.language,
        profile: profile.name,
        versionDir: spec.versionDir,
        spec: spec.name,
        treeDir,
        id: `${profile.language}/${profile.name}/${spec.versionDir}/${spec.name}`,
      });
    }
  }

  units.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return units;
}

async function hasFiles(dir: string): Promise<boolean> {
  try {
    for await (const _ of Deno.readDir(dir)) return true;
    return false;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
```

- [ ] **Step 5: Run the discovery tests**

Run: `deno test -A test/harness/compile/units.test.ts`
Expected: PASS, 5 steps.

- [ ] **Step 6: Write the failing test for diagnostics formatting**

Create `test/harness/compile/diagnostics.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { formatDiagnostics } from './diagnostics.ts';
import type { Diagnostic } from './types.ts';

const d = (file: string, line: number | null, column: number | null, message: string): Diagnostic => ({
  file,
  line,
  column,
  message,
});

describe('formatDiagnostics', () => {
  it('renders one diagnostic per line as file:line:col message', () => {
    expect(formatDiagnostics([d('models/pet.ts', 3, 7, 'Type error')]))
      .toBe('models/pet.ts:3:7 Type error\n');
  });

  it('sorts by file, then line, then column, then message', () => {
    const text = formatDiagnostics([
      d('b.ts', 1, 1, 'second file'),
      d('a.ts', 2, 1, 'later line'),
      d('a.ts', 1, 2, 'later column'),
      d('a.ts', 1, 1, 'zzz'),
      d('a.ts', 1, 1, 'aaa'),
    ]);

    expect(text).toBe(
      'a.ts:1:1 aaa\na.ts:1:1 zzz\na.ts:1:2 later column\na.ts:2:1 later line\nb.ts:1:1 second file\n',
    );
  });

  it('dedupes identical diagnostics, which a parallel build can report twice', () => {
    expect(formatDiagnostics([d('a.ts', 1, 1, 'same'), d('a.ts', 1, 1, 'same')]))
      .toBe('a.ts:1:1 same\n');
  });

  it('omits position when the compiler gave none, and renders a missing file as <no file>', () => {
    expect(formatDiagnostics([d('a.kt', null, null, 'no position'), d('', null, null, 'no file')]))
      .toBe('<no file> no file\na.kt no position\n');
  });

  it('collapses a multi-line message onto one line so a diagnostic is always one snapshot line', () => {
    expect(formatDiagnostics([d('a.kt', 1, 1, 'first\n  second\n\n  third')]))
      .toBe('a.kt:1:1 first second third\n');
  });

  it('returns the empty string for no diagnostics', () => {
    expect(formatDiagnostics([])).toBe('');
  });
});
```

Note what the fourth case pins: a diagnostic the compiler blamed on no file sorts before one with a file, because
`<no file>` starts with `<`. That is arbitrary but it must be *stable*, which is what the test is for.

- [ ] **Step 7: Run it and watch it fail**

Run: `deno test -A test/harness/compile/diagnostics.test.ts`
Expected: FAIL — `Module not found "./diagnostics.ts"`.

- [ ] **Step 8: Write `diagnostics.ts`**

```ts
import { relative } from 'node:path';

import type { Diagnostic } from './types.ts';

/**
 * Renders diagnostics as snapshot text: one per line, `file:line:col message`.
 *
 * Sorted and deduped because the order a compiler reports in is not stable — Gradle interleaves
 * parallel subprojects, and a single `tsc` program visits files in module-graph order. Order is not
 * under test; the set of diagnostics is. A message is collapsed onto one line so that a diagnostic is
 * always exactly one snapshot line, which keeps a mismatch excerpt readable.
 */
export function formatDiagnostics(diagnostics: readonly Diagnostic[]): string {
  const lines = new Set<string>();
  for (const diagnostic of diagnostics) lines.add(renderDiagnostic(diagnostic));
  return [...lines].sort(compareRendered).map((line) => `${line}\n`).join('');
}

function renderDiagnostic(diagnostic: Diagnostic): string {
  const file = diagnostic.file === '' ? '<no file>' : diagnostic.file;
  const position = diagnostic.line === null
    ? ''
    : diagnostic.column === null
    ? `:${diagnostic.line}`
    : `:${diagnostic.line}:${diagnostic.column}`;
  return `${file}${position} ${collapse(diagnostic.message)}`;
}

/** Whitespace runs, including newlines, become a single space. */
function collapse(message: string): string {
  return message.replace(/\s+/g, ' ').trim();
}

/**
 * Orders rendered lines by file, then numeric line, then numeric column, then message.
 *
 * Plain string comparison would put line 10 before line 9, which makes a snapshot diff hard to read
 * for no benefit.
 */
function compareRendered(a: string, b: string): number {
  const pa = splitRendered(a);
  const pb = splitRendered(b);
  if (pa.file !== pb.file) return pa.file < pb.file ? -1 : 1;
  if (pa.line !== pb.line) return pa.line - pb.line;
  if (pa.column !== pb.column) return pa.column - pb.column;
  return pa.message < pb.message ? -1 : pa.message > pb.message ? 1 : 0;
}

function splitRendered(line: string): { file: string; line: number; column: number; message: string } {
  const match = /^(?<file>\S+?)(?::(?<line>\d+)(?::(?<column>\d+))?)? (?<message>.*)$/.exec(line);
  if (match?.groups === undefined) return { file: line, line: -1, column: -1, message: '' };
  return {
    file: match.groups.file,
    line: match.groups.line === undefined ? -1 : Number(match.groups.line),
    column: match.groups.column === undefined ? -1 : Number(match.groups.column),
    message: match.groups.message,
  };
}

/**
 * Rewrites a diagnostic's absolute path to a path relative to `treeDir`, forward-slashed.
 *
 * A path the compiler reported from outside the tree — a container-internal build file, a dependency —
 * is kept verbatim, because silently relativizing it would produce a `../../..` chain that encodes the
 * synthesized build's layout in the snapshot.
 */
export function relativizeDiagnostic(diagnostic: Diagnostic, treeDir: string): Diagnostic {
  if (diagnostic.file === '') return diagnostic;
  const rel = relative(treeDir, diagnostic.file).replace(/\\/g, '/');
  if (rel === '' || rel.startsWith('../')) return diagnostic;
  return { ...diagnostic, file: rel };
}
```

- [ ] **Step 9: Run the formatting tests**

Run: `deno test -A test/harness/compile/diagnostics.test.ts`
Expected: PASS, 6 steps.

- [ ] **Step 10: Write the failing test for the verify contract**

Create `test/harness/compile/verify.test.ts`. The deletion behaviour is the point of this file — it is what makes a
fixed defect show up as a diff:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { verifyCompileDiagnostics } from './verify.ts';
import type { Diagnostic } from './types.ts';

const one: Diagnostic[] = [{ file: 'a.kt', line: 1, column: 1, message: 'boom' }];

describe('verifyCompileDiagnostics', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir();
    file = join(dir, 'nested', 'unit.txt');
  });
  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('write mode creates the snapshot for a failing unit, parent directories included', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    expect(await Deno.readTextFile(file)).toBe('a.kt:1:1 boom\n');
  });

  it('check mode passes when the committed snapshot matches', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await verifyCompileDiagnostics(file, one, { mode: 'check' });
  });

  it('check mode fails when a failing unit has no committed snapshot', async () => {
    await expect(verifyCompileDiagnostics(file, one, { mode: 'check' })).rejects.toThrow(
      'does not exist',
    );
  });

  it('write mode deletes a stale snapshot when the unit now compiles', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await verifyCompileDiagnostics(file, [], { mode: 'write' });
    await expect(Deno.stat(file)).rejects.toThrow(Deno.errors.NotFound);
  });

  it('check mode fails when the unit now compiles but a snapshot is still committed', async () => {
    await verifyCompileDiagnostics(file, one, { mode: 'write' });
    await expect(verifyCompileDiagnostics(file, [], { mode: 'check' })).rejects.toThrow(
      'no longer fails to compile',
    );
  });

  it('passes in both modes for a clean unit with no snapshot', async () => {
    await verifyCompileDiagnostics(file, [], { mode: 'check' });
    await verifyCompileDiagnostics(file, [], { mode: 'write' });
  });
});
```

- [ ] **Step 11: Run it and watch it fail**

Run: `deno test -A test/harness/compile/verify.test.ts`
Expected: FAIL — `Module not found "./verify.ts"`.

- [ ] **Step 12: Write `verify.ts`**

```ts
import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';
import { formatDiagnostics } from './diagnostics.ts';
import type { CompileUnit, Diagnostic } from './types.ts';

/** Where a unit's diagnostics are committed. */
export function compileSnapshotFile(compileRootDir: string, unit: CompileUnit): string {
  return join(compileRootDir, unit.language, unit.profile, unit.versionDir, `${unit.spec}.txt`);
}

/**
 * Compares a unit's diagnostics against its committed snapshot.
 *
 * A clean unit has no file, so "compiles now but a snapshot is committed" needs its own handling that
 * {@link verifyText} does not provide: write mode removes the stale file, and check mode refuses. That
 * refusal is what turns a generator fix into a reviewable deletion instead of a silent pass — the same
 * reasoning as the committed `.error.txt` handling in `snapshot/verify-profile.ts`.
 */
export async function verifyCompileDiagnostics(
  snapshotFile: string,
  diagnostics: readonly Diagnostic[],
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();

  if (diagnostics.length > 0) {
    await verifyText(snapshotFile, formatDiagnostics(diagnostics), { mode });
    return;
  }

  let exists = true;
  try {
    await Deno.lstat(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    exists = false;
  }
  if (!exists) return;

  if (mode === 'check') {
    throw new Error(
      `${snapshotFile} is committed, but this unit no longer fails to compile.\n\n` +
        'A generator fix probably landed. Run `deno task test:compile` and commit the deletion.',
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`snapshot removed ${snapshotFile}`);
}
```

- [ ] **Step 13: Run the verify tests**

Run: `deno test -A test/harness/compile/verify.test.ts`
Expected: PASS, 6 steps.

- [ ] **Step 14: Write the barrel and export it**

Create `test/harness/compile/mod.ts`:

```ts
export * from './diagnostics.ts';
export * from './types.ts';
export * from './units.ts';
export * from './verify.ts';
```

Add to `test/harness/mod.ts`, keeping the file's existing alphabetical order:

```ts
export * from './compile/mod.ts';
```

- [ ] **Step 15: Run the full gate set and commit**

```bash
deno fmt --check
deno lint
deno test -A packages/core packages/kotlin packages/typescript test/harness
```

Expected: all pass. `git diff --stat -- test/output test/specs` must be empty.

```bash
git add test/harness deno.json
git commit -m "test(harness): add compile-unit discovery and diagnostics snapshots"
```

---

### Task 2: The Docker-free TypeScript gate

**Files:**

- Create: `test/harness/compile/parse-deno-check.ts`
- Create: `test/harness/fixtures/deno-check-errors.txt`
- Create: `test/compile-tests/runners/deno-check.ts`
- Create: `test/compile-tests/compile.test.ts`
- Test: `test/harness/compile/parse-deno-check.test.ts`
- Modify: `test/harness/compile/mod.ts`

**Interfaces:**

- Consumes: everything Task 1 produced.
- Produces:
  ```ts
  export function parseDenoCheckDiagnostics(output: string): Diagnostic[];
  export function runDenoCheck(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>>;
  ```
  `runDenoCheck` returns diagnostics keyed by `CompileUnit.id`, with an entry for every unit it was
  given — an empty array means "compiled clean". Later runners return the same shape.

This task delivers a working tier 3 end to end for the 108 `models` and `fetch-clients` units with no container
involved. Doing it before any Docker work means the snapshot contract, the driver, and the run/report loop are all
proven before container complexity enters.

- [ ] **Step 1: Capture real `deno check` output as a fixture**

`v3/extreme-names` is known to fail under `models`, because it contains schemas whose names normalize to the empty
string. Capture what the compiler actually says:

```bash
deno check --no-lock test/output/typescript/models/v3/extreme-names/models.ts > test/harness/fixtures/deno-check-errors.txt 2>&1 || true
```

Read the file. It is the ground truth for the parser, and the parser's tests assert against it verbatim rather than
against a format you assumed. If the file comes back empty, that unit compiles after all — in that case capture from
`test/output/typescript/models/v3/non-ascii-names/models.ts` instead, and if that is also clean, write a two-line
deliberately broken `.ts` file in a temp directory, capture from that, and say so in your report.

- [ ] **Step 2: Write the failing parser test**

Create `test/harness/compile/parse-deno-check.test.ts`. Two kinds of test: hand-written cases that pin the format, and
one fixture case that pins reality.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseDenoCheckDiagnostics } from './parse-deno-check.ts';

describe('parseDenoCheckDiagnostics', () => {
  it('extracts code, message, and position from one error', () => {
    const output = [
      'error: TS2322 [ERROR]: Type \'string\' is not assignable to type \'number\'.',
      'const x: number = "a";',
      '      ^',
      '    at file:///repo/test/output/typescript/models/v3/a/models/pet.ts:1:7',
      '',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: '/repo/test/output/typescript/models/v3/a/models/pet.ts',
      line: 1,
      column: 7,
      message: 'TS2322 Type \'string\' is not assignable to type \'number\'.',
    }]);
  });

  it('extracts several errors from one run', () => {
    const output = [
      'error: TS1005 [ERROR]: \';\' expected.',
      '    at file:///repo/a.ts:2:3',
      '',
      'error: TS2456 [ERROR]: Type alias \'X\' circularly references itself.',
      '    at file:///repo/b.ts:9:1',
      '',
      'Found 2 errors.',
    ].join('\n');

    expect(parseDenoCheckDiagnostics(output).map((d) => d.file)).toEqual(['/repo/a.ts', '/repo/b.ts']);
  });

  it('keeps an error that carries no position', () => {
    const output = 'error: Module not found "file:///repo/models/.ts".\n';

    expect(parseDenoCheckDiagnostics(output)).toEqual([{
      file: '',
      line: null,
      column: null,
      message: 'Module not found "file:///repo/models/.ts".',
    }]);
  });

  it('finds no diagnostics in clean output', () => {
    expect(parseDenoCheckDiagnostics('Check file:///repo/a.ts\n')).toEqual([]);
  });

  it('parses the captured fixture, so a Deno upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(
      new URL('../fixtures/deno-check-errors.txt', import.meta.url),
    );
    const diagnostics = parseDenoCheckDiagnostics(fixture);

    expect(diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of diagnostics) expect(diagnostic.message).not.toBe('');
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `deno test -A test/harness/compile/parse-deno-check.test.ts`
Expected: FAIL — `Module not found "./parse-deno-check.ts"`.

- [ ] **Step 4: Write `parse-deno-check.ts`**

Adjust the regexes to the fixture you captured if it disagrees with what is written here; the fixture is authoritative
and its test is what tells you.

```ts
import { fileURLToPath } from 'node:url';

import type { Diagnostic } from './types.ts';

const ERROR_LINE = /^error: (?:(?<code>TS\d+) \[ERROR\]: )?(?<message>.*)$/;
const AT_LINE = /^\s+at (?<url>file:\/\/\S*?):(?<line>\d+):(?<column>\d+)$/;

/**
 * Parses `deno check` output into diagnostics.
 *
 * The format is human-oriented and has no machine alternative, so this is anchored on the two lines
 * that carry meaning: `error: [CODE] message` opens a diagnostic, and the following indented
 * `at file://…:line:col` locates it. Everything between them is the source excerpt and the caret,
 * which are derivable from the position and would only add churn to a snapshot.
 *
 * An error with no `at` line — a module-resolution failure, for instance — is kept with no position
 * rather than dropped. Dropping it would let a whole unit fail to resolve while the gate reported
 * nothing.
 */
export function parseDenoCheckDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const error = ERROR_LINE.exec(lines[i]);
    if (error?.groups === undefined) continue;

    const code = error.groups.code;
    const message = code === undefined ? error.groups.message : `${code} ${error.groups.message}`;

    let position: { file: string; line: number; column: number } | undefined;
    for (let j = i + 1; j < lines.length; j++) {
      if (ERROR_LINE.test(lines[j])) break;
      const at = AT_LINE.exec(lines[j]);
      if (at?.groups === undefined) continue;
      position = {
        file: fileURLToPath(at.groups.url),
        line: Number(at.groups.line),
        column: Number(at.groups.column),
      };
      break;
    }

    diagnostics.push({
      file: position?.file ?? '',
      line: position?.line ?? null,
      column: position?.column ?? null,
      message,
    });
  }

  return diagnostics;
}
```

- [ ] **Step 5: Run the parser tests**

Run: `deno test -A test/harness/compile/parse-deno-check.test.ts`
Expected: PASS, 5 steps.

- [ ] **Step 6: Write the runner**

Create `test/compile-tests/runners/deno-check.ts`. One `deno check` per unit here, not per profile: `deno check` reports
positions as absolute paths, so a single run over 54 units would be attributable, but a module-resolution error with no
position could not be attributed to a unit at all — and those are exactly what the `<output>/models/.ts` defect
produces.

```ts
import { join } from 'node:path';

import { type CompileUnit, type Diagnostic, relativizeDiagnostic } from '@goast/test-harness';
import { parseDenoCheckDiagnostics } from '../../harness/compile/parse-deno-check.ts';

/** Barrel files a unit is checked through, in preference order; the first that exists is used. */
const ENTRY_POINTS = ['models.ts', 'clients.ts'];

/**
 * Type-checks TypeScript units on the host with `deno check`.
 *
 * `--no-lock` because the corpus is not a Deno project and has no lockfile to honour. Deno writes
 * diagnostics to stderr and progress to stdout, so both are captured and concatenated — a format
 * change that moved diagnostics between the two streams would otherwise silently empty the gate.
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
      args: ['check', '--no-lock', ...entries],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);

    const diagnostics = parseDenoCheckDiagnostics(output)
      .map((diagnostic) => relativizeDiagnostic(diagnostic, unit.treeDir));

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
```

- [ ] **Step 7: Write the driver, host groups only**

First create `test/compile-tests/paths.ts`, so that no module has to import a `.test.ts` file:

```ts
import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/**
 * Root of the committed compile diagnostics.
 *
 * Deliberately outside `test/output`, which means "written by a generator": mixing in files written by
 * a compiler would blur that, and tier 2's orphan sweep walks `test/output` and would report every
 * diagnostics file as an orphan.
 */
export const compileRootDir: string = join(repoRootDir, 'test', 'compile');
```

Then create `test/compile-tests/compile.test.ts`:

```ts
import { describe, it } from '@std/testing/bdd';

import {
  type CompileUnit,
  compileSnapshotFile,
  type Diagnostic,
  discoverCompileUnits,
  discoverSpecs,
  verifyCompileDiagnostics,
} from '@goast/test-harness';

import { profiles } from '../output-tests/profiles.ts';
import { compileRootDir } from './paths.ts';
import { runDenoCheck } from './runners/deno-check.ts';

/**
 * Tier 3 is opt-in, and this guard is what makes it so.
 *
 * `deno.json` includes all of `test/` in test discovery, so `deno task test` would otherwise find this
 * file and start a container — breaking the rule that tiers 1 and 2 never touch Docker. Registering no
 * tests at all, rather than registering skipped ones, keeps 782 ignored steps out of the everyday run.
 * `deno task test:compile` sets the variable.
 */
const enabled = (Deno.env.get('GOAST_COMPILE') ?? '') !== '';

/** TypeScript profiles that need no npm package, so they are checked on the host. */
const HOST_TS_PROFILES = new Set(['models', 'fetch-clients']);

const specs = enabled ? await discoverSpecs() : [];
const units = enabled ? await discoverCompileUnits(profiles, specs) : [];

const hostTsUnits = units.filter((u) => u.language === 'typescript' && HOST_TS_PROFILES.has(u.profile));

/**
 * Compiles once per group, then asserts once per unit.
 *
 * The compile step is its own `it` so that a build failure is reported as one failure naming the
 * group, rather than as the same error repeated by every unit in it.
 */
describe('typescript/host (deno check)', () => {
  let results: Map<string, Diagnostic[]> | undefined;

  it('compiles every host TypeScript unit', async () => {
    results = await runDenoCheck(hostTsUnits);
  });

  for (const unit of hostTsUnits) {
    it(unit.id, async () => {
      await verifyUnit(unit, results);
    });
  }
});

async function verifyUnit(unit: CompileUnit, results: Map<string, Diagnostic[]> | undefined): Promise<void> {
  if (results === undefined) throw new Error('The compile step did not run; its failure is the real one.');
  const diagnostics = results.get(unit.id);
  if (diagnostics === undefined) {
    throw new Error(`No result for ${unit.id}. The runner must return an entry for every unit it is given.`);
  }
  await verifyCompileDiagnostics(compileSnapshotFile(compileRootDir, unit), diagnostics);
}
```

- [ ] **Step 8: Run the gate in write mode and read what it found**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=write deno test -A test/compile-tests
```

Then prove the opt-in guard works, which is the constraint it exists to protect:

```bash
deno test -A test/compile-tests
```

Expected: `0 passed`, and no container started. Report both results.

Expected: passes, and creates snapshot files under `test/compile/typescript/`. Then look:

```bash
git status --porcelain test/compile
```

Record in your report: how many of the 108 host units failed, which ones, and the total diagnostic count. Read at least
three snapshots and say whether each matches a defect already in
`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` — defect 7 (`TS2456`), 18 (`<output>` import), and 21
(`export type  = {`) are the ones to expect. **Anything that matches no registered defect is a new discovery: name it,
do not fix it.**

- [ ] **Step 9: Prove the gate is deterministic and check mode agrees**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests
```

Expected: passes with no file changes. Then `git status --porcelain test/compile` must show nothing but the untracked
files from Step 8. If check mode disagrees with write mode, stop and report it — a non-deterministic gate is worse than
no gate.

- [ ] **Step 10: Prove the harness invariant actually fires**

This is a deliberate fault injection, and it is the one test that proves the gate cannot go vacuously green. Temporarily
break the parser by replacing the body of `parseDenoCheckDiagnostics` with `return [];`, then run:

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests
```

Expected: fails with `but no diagnostics were parsed`. Restore the parser and confirm the suite passes again. Report both
outcomes. Do not commit the broken parser.

- [ ] **Step 11: Commit**

```bash
git add test/harness test/compile-tests test/compile
git commit -m "test(compile): gate models and fetch-clients with deno check"
```

---

### Task 3: The Docker layer

**Files:**

- Create: `test/harness/docker.ts`
- Test: `test/harness/docker.test.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export type DockerMount = { source: string; target: string; readOnly?: boolean };
  export type RunContainerOptions = {
    image: string;
    args?: string[];
    mounts?: DockerMount[];
    env?: Record<string, string>;
    volumes?: { name: string; target: string }[];
    hostGateway?: boolean;
    workdir?: string;
    timeoutMs?: number;
  };
  export type ContainerResult = { code: number; stdout: string; stderr: string };

  export function requireDocker(): Promise<void>;
  export function dockerRunArgs(options: RunContainerOptions): string[];
  export function imageTag(name: string, contextHash: string): string;
  export function hashBuildContext(contextDir: string): Promise<string>;
  export function buildImage(name: string, contextDir: string): Promise<string>;
  export function runContainer(options: RunContainerOptions): Promise<ContainerResult>;
  ```
  `buildImage` returns the resolved tag, which callers pass to `runContainer` as `image`.

`docker.ts` was deferred from phase 1 to here on purpose: building it earlier would have meant an untested abstraction or
Docker-dependent tests with no workload. Tasks 4 and 5 are that workload.

The argv construction and tag derivation are pure and get real unit tests. The two functions that shell out are covered
by one smoke test that is skipped when Docker is absent, because a test that requires Docker to pass would violate the
constraint that tiers 1 and 2 stay Docker-free.

- [ ] **Step 1: Write the failing tests for the pure parts**

Create `test/harness/docker.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { dockerRunArgs, hashBuildContext, imageTag, requireDocker } from './docker.ts';

describe('dockerRunArgs', () => {
  it('always removes the container, so a failed run leaves nothing behind', () => {
    expect(dockerRunArgs({ image: 'img' })).toEqual(['run', '--rm', 'img']);
  });

  it('renders a read-only mount with the readonly flag', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: '/a', target: '/b', readOnly: true }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=/a,target=/b,readonly', 'img']);
  });

  it('renders a writable mount without it', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: '/a', target: '/b' }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=/a,target=/b', 'img']);
  });

  it('renders a named volume, env, workdir, host gateway, and trailing command args in a stable order', () => {
    expect(dockerRunArgs({
      image: 'img',
      args: ['gradle', 'compileKotlin'],
      volumes: [{ name: 'goast-gradle', target: '/home/gradle/.gradle' }],
      env: { GRADLE_OPTS: '-Xmx2g' },
      workdir: '/work',
      hostGateway: true,
    })).toEqual([
      'run',
      '--rm',
      '--mount',
      'type=volume,source=goast-gradle,target=/home/gradle/.gradle',
      '--env',
      'GRADLE_OPTS=-Xmx2g',
      '--workdir',
      '/work',
      '--add-host',
      'host.docker.internal:host-gateway',
      'img',
      'gradle',
      'compileKotlin',
    ]);
  });

  it('converts a Windows path to a form the daemon accepts', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: 'E:\\repo\\test', target: '/t' }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=E:/repo/test,target=/t', 'img']);
  });
});

describe('imageTag', () => {
  it('embeds the context hash so a stale image cannot be silently reused', () => {
    expect(imageTag('kotlin', 'abcdef1234')).toBe('goast-test-kotlin:abcdef1234');
  });
});

describe('hashBuildContext', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir();
    await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM scratch\n');
  });
  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('is stable across calls', async () => {
    expect(await hashBuildContext(dir)).toBe(await hashBuildContext(dir));
  });

  it('changes when any file in the context changes', async () => {
    const before = await hashBuildContext(dir);
    await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM scratch\nRUN true\n');
    expect(await hashBuildContext(dir)).not.toBe(before);
  });

  it('changes when a file is added, not only when one is edited', async () => {
    const before = await hashBuildContext(dir);
    await Deno.writeTextFile(join(dir, 'extra.txt'), 'x\n');
    expect(await hashBuildContext(dir)).not.toBe(before);
  });
});

describe('requireDocker', () => {
  it('either resolves or explains that Docker is required, never a spawn error', async () => {
    try {
      await requireDocker();
    } catch (error) {
      expect(String(error)).toContain('Docker is required for this tier');
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/docker.test.ts`
Expected: FAIL — `Module not found "./docker.ts"`.

- [ ] **Step 3: Write `docker.ts`**

```ts
import { join, relative } from 'node:path';

import { walk } from '@std/fs/walk';

export type DockerMount = { source: string; target: string; readOnly?: boolean };

export type RunContainerOptions = {
  image: string;
  /** The command and its arguments, replacing the image's default. */
  args?: string[];
  mounts?: DockerMount[];
  env?: Record<string, string>;
  /** Named volumes, used to persist a dependency cache between runs. */
  volumes?: { name: string; target: string }[];
  /** Adds `host.docker.internal`, so a containerized process can reach a server on the host. */
  hostGateway?: boolean;
  workdir?: string;
  /** Defaults to 15 minutes. The container is killed when it expires. */
  timeoutMs?: number;
};

export type ContainerResult = { code: number; stdout: string; stderr: string };

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Fails with one plain sentence when Docker is unusable.
 *
 * Tiers 3 and 4 need it; tiers 1 and 2 never touch it. Without this check the first symptom is a
 * `NotFound` from `Deno.Command`, which reads like a bug in the harness rather than a missing
 * prerequisite.
 */
export async function requireDocker(): Promise<void> {
  let code: number;
  try {
    ({ code } = await new Deno.Command('docker', {
      args: ['version', '--format', '{{.Server.Version}}'],
      stdout: 'null',
      stderr: 'null',
    }).output());
  } catch {
    throw new Error('Docker is required for this tier, and the `docker` command was not found.');
  }
  if (code !== 0) {
    throw new Error('Docker is required for this tier, and the daemon did not respond.');
  }
}

/** Forward slashes: the daemon rejects a Windows-style bind source. */
function normalizeMountPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/** The `docker run` argv, split out from {@link runContainer} so it can be asserted directly. */
export function dockerRunArgs(options: RunContainerOptions): string[] {
  const args = ['run', '--rm'];

  for (const mount of options.mounts ?? []) {
    const spec = `type=bind,source=${normalizeMountPath(mount.source)},target=${mount.target}` +
      (mount.readOnly === true ? ',readonly' : '');
    args.push('--mount', spec);
  }
  for (const volume of options.volumes ?? []) {
    args.push('--mount', `type=volume,source=${volume.name},target=${volume.target}`);
  }
  for (const [key, value] of Object.entries(options.env ?? {})) {
    args.push('--env', `${key}=${value}`);
  }
  if (options.workdir !== undefined) args.push('--workdir', options.workdir);
  if (options.hostGateway === true) args.push('--add-host', 'host.docker.internal:host-gateway');

  args.push(options.image, ...(options.args ?? []));
  return args;
}

/** `goast-test-<name>:<contextHash>`. */
export function imageTag(name: string, contextHash: string): string {
  return `goast-test-${name}:${contextHash}`;
}

/**
 * A short digest of every file in the build context.
 *
 * The tag derives from this, so editing a Dockerfile or any file it copies produces a different tag
 * and the stale image cannot be silently reused. Paths are included alongside contents so that
 * renaming a file changes the hash too.
 */
export async function hashBuildContext(contextDir: string): Promise<string> {
  const parts: string[] = [];
  const paths: string[] = [];
  for await (const entry of walk(contextDir, { includeDirs: false, includeSymlinks: false })) {
    paths.push(entry.path);
  }
  paths.sort();
  for (const path of paths) {
    parts.push(relative(contextDir, path).replace(/\\/g, '/'));
    parts.push(await Deno.readTextFile(path));
  }

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\u0000')));
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the image for `contextDir` and returns its tag.
 *
 * `type=gha` cache in CI and a local cache directory otherwise, so a warm run reuses layers. The
 * build is skipped when an image with the derived tag already exists locally.
 */
export async function buildImage(name: string, contextDir: string): Promise<string> {
  await requireDocker();
  const tag = imageTag(name, await hashBuildContext(contextDir));

  const inspect = await new Deno.Command('docker', {
    args: ['image', 'inspect', tag],
    stdout: 'null',
    stderr: 'null',
  }).output();
  if (inspect.code === 0) return tag;

  const cacheArgs = Deno.env.get('CI') !== undefined && Deno.env.get('CI') !== ''
    ? ['--cache-from', 'type=gha', '--cache-to', 'type=gha,mode=max']
    : ['--cache-from', `type=local,src=${join(Deno.env.get('TMPDIR') ?? '/tmp', 'goast-docker-cache')}`];

  const { code, stderr } = await new Deno.Command('docker', {
    args: ['buildx', 'build', '--load', '--tag', tag, ...cacheArgs, contextDir],
    stdout: 'inherit',
    stderr: 'piped',
  }).output();
  const errorText = new TextDecoder().decode(stderr);
  if (code !== 0) throw new Error(`Failed to build image ${tag}:\n${errorText}`);
  return tag;
}

/** Runs a container to completion, killing it if `timeoutMs` expires. */
export async function runContainer(options: RunContainerOptions): Promise<ContainerResult> {
  await requireDocker();

  const process = new Deno.Command('docker', {
    args: dockerRunArgs(options),
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const timeout = setTimeout(() => {
    try {
      process.kill('SIGKILL');
    } catch {
      // Already exited; nothing to kill.
    }
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const { code, stdout, stderr } = await process.output();
    return {
      code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `deno test -A test/harness/docker.test.ts`
Expected: PASS, 11 steps.

- [ ] **Step 5: Export it and commit**

Add `export * from './docker.ts';` to `test/harness/mod.ts` in alphabetical position.

```bash
deno fmt --check
deno lint
deno test -A packages/core packages/kotlin packages/typescript test/harness
git add test/harness
git commit -m "test(harness): add the Docker layer for tiers 3 and 4"
```

---

### Task 4: The `node` image and the containerized TypeScript gate

**Files:**

- Create: `test/docker/node/Dockerfile`
- Create: `test/docker/node/package.json`
- Create: `test/docker/node/tsconfig.base.json`
- Create: `test/docker/node/k6-jslib.d.ts`
- Create: `test/harness/compile/parse-tsc.ts`
- Create: `test/harness/fixtures/tsc-errors.txt`
- Create: `test/compile-tests/runners/tsc.ts`
- Test: `test/harness/compile/parse-tsc.test.ts`
- Modify: `test/compile-tests/compile.test.ts`, `test/harness/compile/mod.ts`

**Interfaces:**

- Consumes: Task 1's types and verify, Task 3's `buildImage` and `runContainer`.
- Produces:
  ```ts
  export function parseTscDiagnostics(output: string): Diagnostic[];
  export function runTsc(profile: string, units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>>;
  ```

**Three facts about the corpus this task must accommodate**, all verified on the committed tree:

1. `angular-services` imports `@angular/common/http`, `@angular/core`, and `rxjs`.
2. `easy-network-stub` imports `easy-network-stub`.
3. `k6-clients` emits **JavaScript**, not TypeScript: `.js` files carrying `// @ts-check` and JSDoc types, which import
   type-only from sibling `.ts` files. It also imports `https://jslib.k6.io/formdata/0.0.2/index.js`, which `tsc` cannot
   resolve — hence `k6-jslib.d.ts`. `allowJs` is therefore required, and `checkJs` is not, because every generated `.js`
   file opts in with its own `// @ts-check`.

- [ ] **Step 1: Write the image's dependency set**

Create `test/docker/node/package.json`. Pin exact versions — a floating range would make the image's tag stable while
its contents drift:

```json
{
  "name": "goast-compile-node",
  "private": true,
  "dependencies": {
    "@angular/common": "19.2.0",
    "@angular/core": "19.2.0",
    "easy-network-stub": "3.4.0",
    "rxjs": "7.8.1",
    "zone.js": "0.15.0"
  },
  "devDependencies": {
    "@types/k6": "0.54.0",
    "typescript": "5.7.3"
  }
}
```

Verify every version resolves before moving on:

```bash
docker run --rm -v "$PWD/test/docker/node:/w" -w /w node:22-alpine npm install --package-lock-only
```

If a version does not exist, bump it to the nearest published release, record what you changed and why in your report,
and delete the `package-lock.json` this command creates — the image installs from `package.json`, and committing a lock
file would add a second place to keep in sync.

- [ ] **Step 2: Write the compiler options**

Create `test/docker/node/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "skipLibCheck": true,
    "types": ["k6"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

`skipLibCheck` is deliberate: this gate is about the *generated* code, and an error inside `@angular/core`'s own
declarations would be noise attributable to no corpus entry. `strict` is deliberate too — a generated type that only
type-checks with `strict: false` is not a type a consumer can use.

- [ ] **Step 3: Write the ambient declaration for the k6 jslib module**

Create `test/docker/node/k6-jslib.d.ts`:

```ts
/**
 * `k6-clients` output imports FormData from a URL, which is how k6 loads its extras and which `tsc`
 * cannot resolve. Declaring the module keeps the import from becoming a resolution error that would
 * bury every real diagnostic in the unit. The shape is deliberately minimal — only what the generated
 * request builder uses — so a change in how the generator uses FormData surfaces as a type error
 * rather than passing against an `any`.
 */
declare module 'https://jslib.k6.io/formdata/0.0.2/index.js' {
  export class FormData {
    append(name: string, value: unknown, filename?: string): void;
    body(): ArrayBuffer;
    readonly boundary: string;
  }
}
```

- [ ] **Step 4: Write the Dockerfile**

Create `test/docker/node/Dockerfile`:

```dockerfile
FROM node:22-alpine

WORKDIR /opt/goast

# Dependencies land in their own layer, so editing tsconfig or the ambient declarations does not
# reinstall them.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY tsconfig.base.json k6-jslib.d.ts ./

# The committed tree is bind-mounted read-only at /tree, and tsc runs from /opt/goast so that module
# resolution finds /opt/goast/node_modules. Writing nothing into /tree is what keeps the gate from
# mutating reviewed output.
ENV NODE_PATH=/opt/goast/node_modules
ENTRYPOINT ["node", "/opt/goast/node_modules/typescript/bin/tsc"]
```

- [ ] **Step 5: Capture real `tsc` output as a fixture**

```bash
docker build -t goast-node-probe test/docker/node
docker run --rm --mount type=bind,source="$PWD/test/output/typescript/angular-services/v3/extreme-names",target=/tree,readonly \
  goast-node-probe --noEmit --project /opt/goast/tsconfig.base.json --rootDir /tree \
  > test/harness/fixtures/tsc-errors.txt 2>&1 || true
```

Read it. If `tsc` rejects that argument combination — `--project` cannot be combined with file arguments — use the form
the runner will actually use: generate a per-run `tsconfig.json` that `extends` the base and lists `include`. Adjust the
capture command to match, and record the working invocation in your report, because Step 8 depends on it. If the file is
empty, capture from `v3/non-ascii-names` instead.

- [ ] **Step 6: Write the failing parser test**

Create `test/harness/compile/parse-tsc.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseTscDiagnostics } from './parse-tsc.ts';

describe('parseTscDiagnostics', () => {
  it('extracts file, position, code, and message', () => {
    expect(parseTscDiagnostics("/tree/models/pet.ts(12,5): error TS2322: Type 'a' is not assignable.\n"))
      .toEqual([{
        file: '/tree/models/pet.ts',
        line: 12,
        column: 5,
        message: "TS2322 Type 'a' is not assignable.",
      }]);
  });

  it('keeps a diagnostic with no file position', () => {
    expect(parseTscDiagnostics('error TS18003: No inputs were found in config file.\n'))
      .toEqual([{ file: '', line: null, column: null, message: 'TS18003 No inputs were found in config file.' }]);
  });

  it('joins a continuation line into the message it belongs to', () => {
    const output = [
      "/tree/a.ts(1,1): error TS2345: Argument of type 'X' is not assignable.",
      "  Type 'X' is missing the following properties: y",
      '',
    ].join('\n');

    expect(parseTscDiagnostics(output)).toEqual([{
      file: '/tree/a.ts',
      line: 1,
      column: 1,
      message: "TS2345 Argument of type 'X' is not assignable. Type 'X' is missing the following properties: y",
    }]);
  });

  it('ignores warnings and the trailing summary', () => {
    expect(parseTscDiagnostics('/tree/a.ts(1,1): warning TS6133: unused.\nFound 0 errors.\n')).toEqual([]);
  });

  it('finds nothing in empty output', () => {
    expect(parseTscDiagnostics('')).toEqual([]);
  });

  it('parses the captured fixture, so a tsc upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(new URL('../fixtures/tsc-errors.txt', import.meta.url));
    const diagnostics = parseTscDiagnostics(fixture);
    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 7: Write `parse-tsc.ts`, then run the tests**

```ts
import type { Diagnostic } from './types.ts';

const DIAGNOSTIC = /^(?:(?<file>[^(]+)\((?<line>\d+),(?<column>\d+)\): )?(?<severity>error|warning) (?<code>TS\d+): (?<message>.*)$/;

/**
 * Parses `tsc --noEmit` output into diagnostics.
 *
 * Only errors are kept. Warnings churn on a compiler upgrade without indicating anything about the
 * generated code, and a snapshot that churns for that reason stops being read.
 *
 * A line indented under a diagnostic is a continuation of its message — `tsc` elaborates a type
 * mismatch that way — and is folded into the message it follows, because a diagnostic must occupy
 * exactly one snapshot line.
 */
export function parseTscDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  let current: Diagnostic | undefined;
  let currentIsError = false;

  for (const line of output.split('\n')) {
    const match = DIAGNOSTIC.exec(line);
    if (match?.groups !== undefined) {
      currentIsError = match.groups.severity === 'error';
      current = {
        file: match.groups.file ?? '',
        line: match.groups.line === undefined ? null : Number(match.groups.line),
        column: match.groups.column === undefined ? null : Number(match.groups.column),
        message: `${match.groups.code} ${match.groups.message}`,
      };
      if (currentIsError) diagnostics.push(current);
      continue;
    }

    if (current !== undefined && currentIsError && /^\s+\S/.test(line)) {
      current.message = `${current.message} ${line.trim()}`;
      continue;
    }
    current = undefined;
  }

  return diagnostics;
}
```

Run: `deno test -A test/harness/compile/parse-tsc.test.ts`
Expected: PASS, 6 steps.

- [ ] **Step 8: Write the runner**

Create `test/compile-tests/runners/tsc.ts`. One `tsc` invocation per profile, over all 54 of its units at once: a single
program is far cheaper than 54 process starts, and every diagnostic carries a file path, so attribution is by path.

```ts
import { join } from 'node:path';

import { ensureDir } from '@std/fs/ensure-dir';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseTscDiagnostics } from '../../harness/compile/parse-tsc.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');
const TREE_MOUNT = '/tree';
const CONFIG_MOUNT = '/run';

/**
 * Type-checks a containerized TypeScript profile with one `tsc --noEmit`.
 *
 * The generated `tsconfig.json` extends the image's base and lists every unit's directory, so one
 * program covers the whole profile. Units never import across unit boundaries, so a shared program is
 * safe; if that ever changes, a cross-unit import would surface as a resolution error naming both
 * paths, which is the right way to find out.
 */
export async function runTsc(
  profile: string,
  units: readonly CompileUnit[],
): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('node', CONTEXT_DIR);

  const runDir = await Deno.makeTempDir({ prefix: 'goast-tsc-' });
  try {
    const treeRoot = join(repoRootDir, 'test', 'output', 'typescript', profile);
    const include = units.map((unit) => `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/**/*`);
    await ensureDir(runDir);
    await Deno.writeTextFile(
      join(runDir, 'tsconfig.json'),
      JSON.stringify({
        extends: '/opt/goast/tsconfig.base.json',
        include,
        files: ['/opt/goast/k6-jslib.d.ts'],
      }, null, 2) + '\n',
    );

    const { code, stdout, stderr } = await runContainer({
      image,
      args: ['--noEmit', '--project', `${CONFIG_MOUNT}/tsconfig.json`],
      mounts: [
        { source: treeRoot, target: TREE_MOUNT, readOnly: true },
        { source: runDir, target: CONFIG_MOUNT, readOnly: true },
      ],
      workdir: '/opt/goast',
    });

    const output = stdout + stderr;
    const diagnostics = parseTscDiagnostics(output);

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `tsc exited ${code} for profile ${profile} but no diagnostics were parsed. ` +
          'The output format has probably changed; the gate would be vacuously green.\n\n' + output,
      );
    }

    for (const diagnostic of diagnostics) {
      const unit = attribute(diagnostic, units);
      if (unit === undefined) {
        throw new Error(
          `Could not attribute a diagnostic to a unit in profile ${profile}: ` +
            `${diagnostic.file}:${diagnostic.line} ${diagnostic.message}`,
        );
      }
      results.get(unit.id)!.push(
        relativizeDiagnostic(
          { ...diagnostic, file: diagnostic.file },
          `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}`,
        ),
      );
    }

    return results;
  } finally {
    await Deno.remove(runDir, { recursive: true });
  }
}

/** Longest matching prefix, so `v3/a` never claims a diagnostic belonging to `v3/ab`. */
function attribute(diagnostic: Diagnostic, units: readonly CompileUnit[]): CompileUnit | undefined {
  let best: CompileUnit | undefined;
  for (const unit of units) {
    const prefix = `${TREE_MOUNT}/${unit.versionDir}/${unit.spec}/`;
    if (!diagnostic.file.startsWith(prefix)) continue;
    if (best === undefined || prefix.length > `${TREE_MOUNT}/${best.versionDir}/${best.spec}/`.length) {
      best = unit;
    }
  }
  return best;
}
```

A diagnostic with no file, or one `tsc` blamed on `/opt/goast/k6-jslib.d.ts`, cannot be attributed to a unit and makes
the runner throw. That is correct: it means the gate's own configuration is broken, which must not be recorded as a
corpus finding.

- [ ] **Step 9: Add the containerized group to the driver**

In `test/compile-tests/compile.test.ts`, add below the host group:

```ts
const CONTAINER_TS_PROFILES = ['angular-services', 'k6-clients', 'easy-network-stub'] as const;

for (const profile of CONTAINER_TS_PROFILES) {
  const profileUnits = units.filter((u) => u.language === 'typescript' && u.profile === profile);

  describe(`typescript/${profile} (tsc)`, () => {
    let results: Map<string, Diagnostic[]> | undefined;

    it('compiles every unit', async () => {
      results = await runTsc(profile, profileUnits);
    });

    for (const unit of profileUnits) {
      it(unit.id, async () => {
        await verifyUnit(unit, results);
      });
    }
  });
}
```

- [ ] **Step 10: Run in write mode, then check mode, and report what the gate found**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=write deno test -A test/compile-tests
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests
```

Expected: write mode passes and creates snapshots; check mode passes with no changes. Record the wall-clock time of the
`tsc` group — it decides whether this stays one job in CI. Report how many of the 162 units failed and, for each
distinct error code, whether it matches a registered defect. **Report any error code that appears in the fixtures but
nowhere in the register as a new discovery.**

- [ ] **Step 11: Commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core packages/kotlin packages/typescript test/harness
git add test/docker test/harness test/compile-tests test/compile
git commit -m "test(compile): gate angular, k6 and easy-network-stub with tsc in Docker"
```

---

### Task 5: The `kotlin` image and one Kotlin profile

**Files:**

- Create: `test/docker/kotlin/versions.gradle.kts`
- Create: `test/docker/kotlin/Dockerfile`
- Create: `test/docker/kotlin/warmup/build.gradle.kts`
- Create: `test/docker/kotlin/warmup/settings.gradle.kts`
- Create: `test/harness/compile/parse-kotlin.ts`
- Create: `test/harness/fixtures/kotlin-errors.txt`
- Create: `test/compile-tests/runners/kotlin.ts`
- Test: `test/harness/compile/parse-kotlin.test.ts`, `test/compile-tests/runners/kotlin-synthesis.test.ts`
- Modify: `test/compile-tests/compile.test.ts`, `test/harness/compile/mod.ts`

**Interfaces:**

- Consumes: Task 1's types and verify, Task 3's `buildImage` and `runContainer`.
- Produces:
  ```ts
  export function parseKotlinDiagnostics(output: string): Diagnostic[];
  export function synthesizeGradleBuild(units: readonly CompileUnit[], treeMount: string): {
    settings: string;
    build: string;
    projectIds: Map<string, string>;
  };
  export function runKotlin(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>>;
  ```

**The build shape, and why.** One Gradle build with one subproject per unit, named `u0001`…`uNNNN`. Numeric names avoid
every sanitization question — profile names contain `@` and version directories contain `.`, neither of which is safe in
a Gradle project path. The Kotlin plugin is applied once in the root script and each subproject is configured from an
inlined table, so there are no per-unit build files to write or read. Attribution back to units is by *file path* from
the diagnostics, never by project name, so the numeric names stay internal.

This task delivers `models@sb3` only — 44 units, the smallest dependency set. Task 6 scales to all ten. Splitting here
is deliberate: Gradle configuration time over hundreds of subprojects is the one number in this plan that could force a
redesign, and it is cheaper to learn it on one profile.

- [ ] **Step 1: Write the dependency coordinates**

Create `test/docker/kotlin/versions.gradle.kts`. These are the coordinates the generated Kotlin actually imports,
derived from the committed trees: `com.fasterxml.jackson.annotation` and `io.swagger.v3.oas.annotations` for `models`;
Spring Web, `jakarta.validation`, `jakarta.annotation` and Reactor for `spring-controllers`; Spring WebFlux plus
coroutine support for `spring-reactive-web-clients`; okhttp3 and `jackson-module-kotlin` for `okhttp3-clients`.

```kotlin
// Every dependency coordinate tier 3 uses, in one place. The Dockerfile consumes this to pre-warm a
// cache layer, and the synthesized build consumes it for real, so the warm cache is guaranteed to
// cover what the build resolves.
object Versions {
    const val kotlin = "2.2.0"
    const val springBoot3 = "3.5.6"
    const val springBoot4 = "4.0.0"
    const val swaggerAnnotations = "2.2.30"
    const val okhttp = "4.12.0"
    const val jacksonAnnotations = "2.18.2"
}

object Deps {
    val swagger = "io.swagger.core.v3:swagger-annotations:${Versions.swaggerAnnotations}"
    val jacksonAnnotations = "com.fasterxml.jackson.core:jackson-annotations:${Versions.jacksonAnnotations}"
    val okhttp = "com.squareup.okhttp3:okhttp:${Versions.okhttp}"
}
```

**Verify every coordinate resolves before continuing.** Run:

```bash
docker run --rm gradle:8.14-jdk21 sh -c 'echo ok'
```

then resolve the set with the warmup project in Step 3. If any version does not exist, bump it to the nearest published
release, record exactly what you changed and why in your report, and keep `versions.gradle.kts` as the single place the
number lives. Do not scatter a second copy into the Dockerfile.

- [ ] **Step 2: Write the warmup project**

Create `test/docker/kotlin/warmup/settings.gradle.kts`:

```kotlin
rootProject.name = "warmup"
```

Create `test/docker/kotlin/warmup/build.gradle.kts`. Its only job is to make Gradle download everything the real build
will need, into the image layer:

```kotlin
plugins {
    kotlin("jvm") version "2.2.0"
}

repositories { mavenCentral() }

// Both Spring Boot lines, every extra, and nothing else. `compileOnly` because nothing is compiled
// here — resolution is the entire point.
dependencies {
    compileOnly(platform("org.springframework.boot:spring-boot-dependencies:3.5.6"))
    compileOnly(platform("org.springframework.boot:spring-boot-dependencies:4.0.0"))
    compileOnly("io.swagger.core.v3:swagger-annotations:2.2.30")
    compileOnly("com.fasterxml.jackson.core:jackson-annotations:2.18.2")
    compileOnly("com.squareup.okhttp3:okhttp:4.12.0")
    compileOnly("org.springframework:spring-web")
    compileOnly("org.springframework:spring-webflux")
    compileOnly("org.springframework:spring-context")
    compileOnly("io.projectreactor:reactor-core")
    compileOnly("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
    compileOnly("com.fasterxml.jackson.module:jackson-module-kotlin")
    compileOnly("jakarta.validation:jakarta.validation-api")
    compileOnly("jakarta.annotation:jakarta.annotation-api")
}

tasks.register("warm") {
    doLast { configurations.compileOnly.get().resolve() }
}
```

Two platforms in one configuration will conflict if the two BOMs pin different versions of the same artifact. If Gradle
reports a conflict, split the warmup into two configurations — one per Spring Boot line — and record that you did. The
purpose is only to populate the cache.

- [ ] **Step 3: Write the Dockerfile**

Create `test/docker/kotlin/Dockerfile`:

```dockerfile
FROM gradle:8.14-jdk21

# The warm dependency cache is what makes this job fast, and it must be its own layer so that editing
# the synthesized build never invalidates it.
WORKDIR /opt/warmup
COPY warmup/ ./
COPY versions.gradle.kts /opt/goast/versions.gradle.kts
RUN gradle --no-daemon warm && rm -rf /opt/warmup

# GRADLE_USER_HOME holds the cache the layer above populated. The synthesized build is mounted at
# /work and the committed trees read-only at /output.
ENV GRADLE_USER_HOME=/home/gradle/.gradle
WORKDIR /work
ENTRYPOINT ["gradle", "--no-daemon", "--offline", "--parallel", "--continue", "compileKotlin"]
```

`--offline` is deliberate and load-bearing: it turns "a coordinate is missing from the warm layer" into an immediate,
obvious failure instead of a silent network fetch that makes CI slow and non-hermetic. If the build cannot resolve
offline, add the missing coordinate to the warmup project rather than dropping the flag.

- [ ] **Step 4: Spike the Gradle project shape by hand, before generating any**

This is the step that de-risks the rest. Build the image, then hand-write a two-subproject build against two real
committed trees and make it compile:

```bash
docker build -t goast-kotlin-probe test/docker/kotlin
```

Create a scratch directory **outside the repo**, and in it a `settings.gradle.kts` with `include("u0001", "u0002")` and
a root `build.gradle.kts` that applies the Kotlin plugin to both subprojects and points each at a tree under `/output`.
Run the container against it. Iterate until it compiles.

The candidate root script to start from — the `srcDir` idiom is the part to verify, and the fallback if it misbehaves is
to symlink each tree into the subproject's conventional `src/main/kotlin` inside the container:

```kotlin
subprojects {
    apply(plugin = "org.jetbrains.kotlin.jvm")

    repositories { mavenCentral() }

    val treeDir: String by extra

    extensions.configure<org.gradle.api.tasks.SourceSetContainer>("sourceSets") {
        named("main") {
            java.setSrcDirs(listOf(treeDir))
        }
    }

    dependencies {
        add("implementation", platform("org.springframework.boot:spring-boot-dependencies:3.5.6"))
        add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")
        add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")
    }
}
```

**Record the exact working `settings.gradle.kts` and `build.gradle.kts` in your report.** Step 6 generates them, and the
generator must produce what you proved works, not what this plan guessed. Then delete the scratch directory and confirm
`git status --porcelain` is empty.

- [ ] **Step 5: Capture real Kotlin diagnostics as a fixture**

`v3/extreme-names` under `models@sb3` contains `data class (` with no identifier, so it cannot compile. Point your
working spike at it and capture:

```bash
# from the scratch directory, with u0001 pointed at models@sb3/v3/extreme-names
docker run --rm --mount type=bind,source="<repo>/test/output",target=/output,readonly \
  --mount type=bind,source="$PWD",target=/work \
  goast-kotlin-probe > "<repo>/test/harness/fixtures/kotlin-errors.txt" 2>&1 || true
```

Read it. Note the exact diagnostic prefix Gradle emits — Kotlin uses `e: file:///path:line:col message` — and note how
much Gradle noise surrounds it, because that noise is what the parser must discard.

- [ ] **Step 6: Write the parser test, then the parser**

Create `test/harness/compile/parse-kotlin.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { parseKotlinDiagnostics } from './parse-kotlin.ts';

describe('parseKotlinDiagnostics', () => {
  it('extracts file, position, and message from an error line', () => {
    expect(parseKotlinDiagnostics('e: file:///output/kotlin/m/v3/a/Pet.kt:6:12 Expecting an element\n'))
      .toEqual([{ file: '/output/kotlin/m/v3/a/Pet.kt', line: 6, column: 12, message: 'Expecting an element' }]);
  });

  it('ignores warnings', () => {
    expect(parseKotlinDiagnostics('w: file:///output/a.kt:1:1 unused parameter\n')).toEqual([]);
  });

  it('ignores Gradle noise', () => {
    const output = [
      '> Task :u0001:compileKotlin FAILED',
      'FAILURE: Build completed with 1 failure.',
      'BUILD FAILED in 12s',
      '',
    ].join('\n');
    expect(parseKotlinDiagnostics(output)).toEqual([]);
  });

  it('keeps an error with no position', () => {
    expect(parseKotlinDiagnostics('e: Could not find declaration\n'))
      .toEqual([{ file: '', line: null, column: null, message: 'Could not find declaration' }]);
  });

  it('parses the captured fixture, so a Kotlin upgrade that changes the format fails here first', async () => {
    const fixture = await Deno.readTextFile(new URL('../fixtures/kotlin-errors.txt', import.meta.url));
    expect(parseKotlinDiagnostics(fixture).length).toBeGreaterThan(0);
  });
});
```

Then write `test/harness/compile/parse-kotlin.ts`:

```ts
import { fileURLToPath } from 'node:url';

import type { Diagnostic } from './types.ts';

const POSITIONED = /^e: (?<url>file:\/\/\S*?):(?<line>\d+):(?<column>\d+) (?<message>.*)$/;
const BARE = /^e: (?<message>.*)$/;

/**
 * Parses Kotlin compiler diagnostics out of a Gradle build log.
 *
 * Kotlin prefixes severity: `e:` for an error, `w:` for a warning. Only errors are kept — warnings
 * churn on a compiler upgrade and say nothing about whether the generated code is valid. Everything
 * without a severity prefix is Gradle's own output (task names, the failure summary, timings) and is
 * discarded, which is also why the parser never sees a subproject name and attribution has to happen
 * by file path.
 */
export function parseKotlinDiagnostics(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const line of output.split('\n')) {
    const positioned = POSITIONED.exec(line.trimEnd());
    if (positioned?.groups !== undefined) {
      diagnostics.push({
        file: fileURLToPath(positioned.groups.url),
        line: Number(positioned.groups.line),
        column: Number(positioned.groups.column),
        message: positioned.groups.message,
      });
      continue;
    }

    const bare = BARE.exec(line.trimEnd());
    if (bare?.groups !== undefined) {
      diagnostics.push({ file: '', line: null, column: null, message: bare.groups.message });
    }
  }

  return diagnostics;
}
```

Run: `deno test -A test/harness/compile/parse-kotlin.test.ts`
Expected: PASS, 5 steps.

- [ ] **Step 7: Write the build synthesis with tests**

Create `test/compile-tests/runners/kotlin-synthesis.test.ts` first. Synthesis is pure string generation and deserves
tests that do not need Docker:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { CompileUnit } from '@goast/test-harness';
import { synthesizeGradleBuild } from './kotlin.ts';

const unit = (profile: string, versionDir: 'v3' | 'v3.1', spec: string): CompileUnit => ({
  language: 'kotlin',
  profile,
  versionDir,
  spec,
  treeDir: `/ignored/${profile}/${versionDir}/${spec}`,
  id: `kotlin/${profile}/${versionDir}/${spec}`,
});

describe('synthesizeGradleBuild', () => {
  it('names subprojects numerically, so an @ in a profile or a dot in a version is never a project name', () => {
    const { settings, projectIds } = synthesizeGradleBuild(
      [unit('models@sb3', 'v3.1', 'webhooks')],
      '/output',
    );

    expect(settings).toContain('include("u0001")');
    expect(settings).not.toContain('@');
    expect(projectIds.get('kotlin/models@sb3/v3.1/webhooks')).toBe('u0001');
  });

  it('points each subproject at its tree under the mount, not at the host path', () => {
    const { build } = synthesizeGradleBuild([unit('models@sb3', 'v3', 'a')], '/output');
    expect(build).toContain('/output/kotlin/models@sb3/v3/a');
    expect(build).not.toContain('/ignored');
  });

  it('gives each profile only its own dependencies', () => {
    const { build } = synthesizeGradleBuild(
      [unit('models@sb3', 'v3', 'a'), unit('okhttp3-clients@sb3', 'v3', 'a')],
      '/output',
    );
    expect(build).toContain('okhttp');
  });

  it('numbers subprojects in unit order and pads so names sort lexicographically', () => {
    const units = Array.from({ length: 11 }, (_, i) => unit('models@sb3', 'v3', `s${i}`));
    const { projectIds } = synthesizeGradleBuild(units, '/output');
    expect(projectIds.get('kotlin/models@sb3/v3/s0')).toBe('u0001');
    expect(projectIds.get('kotlin/models@sb3/v3/s10')).toBe('u0011');
  });
});
```

Then write `test/compile-tests/runners/kotlin.ts`, using the shape you proved in Step 4. The dependency table is the
part this plan fixes; the surrounding script must match your spike.

```ts
import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseKotlinDiagnostics } from '../../harness/compile/parse-kotlin.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');
const TREE_MOUNT = '/output';
const WORK_MOUNT = '/work';
const GRADLE_VOLUME = 'goast-gradle-cache';

/** Dependency lines per profile family, keyed by the profile name's prefix before `@`. */
const DEPENDENCIES: Record<string, string[]> = {
  'models': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
  ],
  'spring-controllers': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
    'add("implementation", "org.springframework:spring-web")',
    'add("implementation", "org.springframework:spring-context")',
    'add("implementation", "io.projectreactor:reactor-core")',
    'add("implementation", "jakarta.validation:jakarta.validation-api")',
    'add("implementation", "jakarta.annotation:jakarta.annotation-api")',
  ],
  'spring-reactive-web-clients': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
    'add("implementation", "org.springframework:spring-webflux")',
    'add("implementation", "io.projectreactor:reactor-core")',
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor")',
  ],
  'okhttp3-clients': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.squareup.okhttp3:okhttp:4.12.0")',
    'add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")',
  ],
};

const BOM: Record<'sb3' | 'sb4', string> = {
  sb3: 'org.springframework.boot:spring-boot-dependencies:3.5.6',
  sb4: 'org.springframework.boot:spring-boot-dependencies:4.0.0',
};

/**
 * Generates the settings and root build script for a one-subproject-per-unit Gradle build.
 *
 * Subprojects are `u0001`…`uNNNN` because a Gradle project name cannot safely carry the `@` in
 * `models@sb3` or the dot in `v3.1`. Nothing reads the names back: diagnostics are attributed by file
 * path, so the numbering stays an internal detail.
 */
export function synthesizeGradleBuild(
  units: readonly CompileUnit[],
  treeMount: string,
): { settings: string; build: string; projectIds: Map<string, string> } {
  const projectIds = new Map<string, string>();
  const includes: string[] = [];
  const blocks: string[] = [];

  units.forEach((unit, index) => {
    const projectId = `u${String(index + 1).padStart(4, '0')}`;
    projectIds.set(unit.id, projectId);
    includes.push(`include("${projectId}")`);

    const family = unit.profile.split('@')[0];
    const variant = unit.profile.includes('@sb4') ? 'sb4' : 'sb3';
    const dependencies = DEPENDENCIES[family];
    if (dependencies === undefined) {
      throw new Error(
        `No dependency set for Kotlin profile family "${family}". Add one to DEPENDENCIES in ` +
          'test/compile-tests/runners/kotlin.ts, and add its coordinates to the warmup project so ' +
          'the offline build can resolve them.',
      );
    }

    const treeDir = `${treeMount}/kotlin/${unit.profile}/${unit.versionDir}/${unit.spec}`;
    blocks.push(
      [
        `project(":${projectId}") {`,
        `    apply(plugin = "org.jetbrains.kotlin.jvm")`,
        `    repositories { mavenCentral() }`,
        `    extensions.configure<org.gradle.api.tasks.SourceSetContainer>("sourceSets") {`,
        `        named("main") { java.setSrcDirs(listOf("${treeDir}")) }`,
        `    }`,
        `    dependencies {`,
        `        add("implementation", platform("${BOM[variant]}"))`,
        ...dependencies.map((line) => `        ${line}`),
        `    }`,
        `}`,
      ].join('\n'),
    );
  });

  const settings = ['rootProject.name = "goast-compile-gate"', ...includes].join('\n') + '\n';
  const build = [
    'plugins { kotlin("jvm") version "2.2.0" apply false }',
    '',
    ...blocks,
  ].join('\n\n') + '\n';

  return { settings, build, projectIds };
}

/** Compiles every Kotlin unit in one Gradle build. */
export async function runKotlin(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('kotlin', CONTEXT_DIR);
  const { settings, build } = synthesizeGradleBuild(units, TREE_MOUNT);

  const workDir = await Deno.makeTempDir({ prefix: 'goast-gradle-' });
  try {
    await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
    await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

    const { code, stdout, stderr } = await runContainer({
      image,
      mounts: [
        { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
        { source: workDir, target: WORK_MOUNT },
      ],
      volumes: [{ name: GRADLE_VOLUME, target: '/home/gradle/.gradle' }],
      workdir: WORK_MOUNT,
      timeoutMs: 30 * 60 * 1000,
    });

    const output = stdout + stderr;
    const diagnostics = parseKotlinDiagnostics(output);

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `Gradle exited ${code} but no Kotlin diagnostics were parsed. Either the output format ` +
          'changed and the gate would be vacuously green, or the build itself failed to configure.\n\n' +
          output,
      );
    }

    for (const diagnostic of diagnostics) {
      const unit = units.find((u) =>
        diagnostic.file.startsWith(`${TREE_MOUNT}/kotlin/${u.profile}/${u.versionDir}/${u.spec}/`)
      );
      if (unit === undefined) {
        throw new Error(
          `Could not attribute a Kotlin diagnostic to a unit: ${diagnostic.file} ${diagnostic.message}`,
        );
      }
      results.get(unit.id)!.push(
        relativizeDiagnostic(
          diagnostic,
          `${TREE_MOUNT}/kotlin/${unit.profile}/${unit.versionDir}/${unit.spec}`,
        ),
      );
    }

    return results;
  } finally {
    await Deno.remove(workDir, { recursive: true });
  }
}
```

- [ ] **Step 8: Run the synthesis tests**

Run: `deno test -A test/compile-tests/runners/kotlin-synthesis.test.ts`
Expected: PASS, 4 steps.

- [ ] **Step 9: Wire `models@sb3` into the driver and run it**

Add to `test/compile-tests/compile.test.ts`:

```ts
const KOTLIN_PROFILES = ['models@sb3'] as const;

const kotlinUnits = units.filter((u) => u.language === 'kotlin' && (KOTLIN_PROFILES as readonly string[]).includes(u.profile));

describe('kotlin (gradle)', () => {
  let results: Map<string, Diagnostic[]> | undefined;

  it('compiles every Kotlin unit', async () => {
    results = await runKotlin(kotlinUnits);
  });

  for (const unit of kotlinUnits) {
    it(unit.id, async () => {
      await verifyUnit(unit, results);
    });
  }
});
```

Then:

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=write deno test -A test/compile-tests
```

**Record the wall-clock time, split into image build, Gradle configuration, and compilation.** Gradle prints
configuration time; if it does not, run once with `--profile` in the entrypoint to get the breakdown. This number
decides Task 6's approach.

- [ ] **Step 10: Report BLOCKED rather than working around any of these**

- The Gradle build does not finish within 30 minutes for 44 subprojects. Report the configuration and execution split.
- Configuration alone exceeds about 5 minutes for 44 subprojects, which projects to something unusable at 512. Say so
  before scaling; the alternative shape is one subproject per profile with one source set per spec, and it is worth
  redesigning for rather than shipping a 40-minute job.
- Write mode and check mode disagree for any unit.
- A dependency cannot be resolved offline. Name the coordinate.

- [ ] **Step 11: Check mode, then commit**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests
deno fmt --check && deno lint && deno test -A packages/core packages/kotlin packages/typescript test/harness
git add test/docker test/harness test/compile-tests test/compile
git commit -m "test(compile): gate kotlin models@sb3 with a synthesized Gradle build"
```

Report how many of the 44 units failed, and for each distinct diagnostic, whether it matches a registered defect.
Defects 21 and 22 are the ones to expect for `v3/extreme-names` and `v3/non-ascii-names`. **The unescaped-keyword output
in `v3/reserved-words` — `val class:`, `val val:`, `val is:` — and the five `data class MyThing` declarations in
`v3/name-collisions` match no register entry. Report both as new discoveries; Task 8 registers them.**

---

### Task 6: All ten Kotlin profiles

**Files:**

- Modify: `test/compile-tests/compile.test.ts`
- Modify: `test/compile-tests/runners/kotlin.ts` if Task 5 found the shape needs changing at scale
- Create: snapshot files under `test/compile/kotlin/`

**Interfaces:**

- Consumes: everything Task 5 produced. No new exported signatures.

- [ ] **Step 1: Extend the profile list**

In `test/compile-tests/compile.test.ts`, replace `KOTLIN_PROFILES` with all ten:

```ts
const KOTLIN_PROFILES = [
  'models@sb3',
  'models@sb4',
  'okhttp3-clients@sb3',
  'okhttp3-clients@sb4',
  'spring-controllers@sb3',
  'spring-controllers@sb3-strict',
  'spring-controllers@sb4',
  'spring-controllers@sb4-strict',
  'spring-reactive-web-clients@sb3',
  'spring-reactive-web-clients@sb4',
] as const;
```

Note that `spring-controllers@sb3-strict` contains `@sb3-strict`, not `@sb3`, so the variant detection in
`synthesizeGradleBuild` must key on whether the name contains `sb4`, which the Task 5 code already does. Add a synthesis
test pinning it:

```ts
it('reads the Spring Boot line from the config variant, including the strict suffixes', () => {
  const { build } = synthesizeGradleBuild([
    unit('spring-controllers@sb4-strict', 'v3', 'a'),
    unit('spring-controllers@sb3-strict', 'v3', 'b'),
  ], '/output');

  expect(build).toContain('spring-boot-dependencies:4.0.0');
  expect(build).toContain('spring-boot-dependencies:3.5.6');
});
```

- [ ] **Step 2: Run the synthesis test**

Run: `deno test -A test/compile-tests/runners/kotlin-synthesis.test.ts`
Expected: PASS, 5 steps.

- [ ] **Step 3: Run the full Kotlin gate in write mode**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=write deno test -A test/compile-tests
```

Expected: passes, with snapshots for every failing unit. Record the wall-clock time and the split between configuration
and compilation. Compare against Task 5's numbers scaled by 512/44 and say whether it scaled linearly.

- [ ] **Step 4: Prove determinism**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests
```

Expected: passes with no changes. A Gradle build with `--parallel` is where non-determinism would show up, and the sort
in `formatDiagnostics` exists precisely for that. If check mode disagrees, do not weaken the snapshot — find out which
diagnostics moved and report it.

- [ ] **Step 5: Report the whole picture and commit**

Record: total units, how many failed, and a table of distinct diagnostic messages against register entries. Explicitly
separate matched from unmatched. Report the largest snapshot file and the total size of `test/compile/`.

```bash
deno fmt --check && deno lint
git add test/compile-tests test/compile
git commit -m "test(compile): extend the compile gate to all ten Kotlin profiles"
```

---

### Task 7: Task wiring, the orphan sweep, and documentation

**Files:**

- Create: `test/compile-tests/orphans.test.ts`
- Modify: `deno.json`
- Modify: `.gitattributes`
- Modify: `test/README.md`

**Interfaces:**

- Consumes: `findOrphanSnapshots` from `test/harness/snapshot/orphans.ts`, `discoverCompileUnits` and
  `compileSnapshotFile` from Task 1.

- [ ] **Step 1: Write the orphan sweep**

Without this, deleting a profile or renaming a spec leaves its diagnostics committed forever, and every test stays green
while coverage silently shrinks. `test/output-tests/orphans.test.ts` is the existing precedent — read it and match its
shape.

Create `test/compile-tests/orphans.test.ts`:

```ts
import { relative } from 'node:path';

import { expect } from '@std/expect';
import { it } from '@std/testing/bdd';

import { compileSnapshotFile, discoverCompileUnits, discoverSpecs, findOrphanSnapshots } from '@goast/test-harness';

import { profiles } from '../output-tests/profiles.ts';
import { compileRootDir } from './paths.ts';

it('has no orphaned compile snapshots', async () => {
  const specs = await discoverSpecs();
  const units = await discoverCompileUnits(profiles, specs);
  const expected = units.map((unit) =>
    relative(compileRootDir, compileSnapshotFile(compileRootDir, unit)).replace(/\\/g, '/')
  );

  expect(await findOrphanSnapshots(compileRootDir, expected)).toEqual([]);
});
```

`findOrphanSnapshots` treats a file it was not told about as an orphan unless a claim covers it, and its special-casing
of `.state.txt` and `.error.txt` does not apply here — every compile snapshot is a plain `.txt` at a path the claim list
names exactly, so the generic rule is the right one.

- [ ] **Step 2: Run it**

Run: `deno test -A test/compile-tests/orphans.test.ts`
Expected: PASS. If it fails, the listed paths are snapshots for units that no longer exist; delete them and say so.

- [ ] **Step 3: Add the tasks**

In `deno.json`, add to `tasks`:

```json
"test:compile": "GOAST_COMPILE=1 GOAST_SNAPSHOT=write deno test -A test/compile-tests",
"test:compile:check": "GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests",
"test:check": "GOAST_SNAPSHOT=check deno test -A",
"test:all": "deno task test:check && deno task test:compile:check"
```

`test:check` exists because `deno task test` runs the whole suite in **write** mode. That is intended for the everyday
loop — the spec calls it exactly that — but it means `deno task test` is the wrong command for measuring anything, and
during this plan's own execution one worker lost time to it. `test:check` is the non-mutating equivalent.

- [ ] **Step 4: Exclude the compile snapshots from fmt, lint, and PR diffs**

In `deno.json`, add `"test/compile/**"` to both `fmt.exclude` and `lint.exclude`, beside the existing
`"test/output/**"`. In `.gitattributes`, beside the existing `test/output/**` rules:

```
test/compile/** linguist-generated
test/compile/** -text
```

`-text` matters on Windows: `core.autocrlf=true` would otherwise rewrite line endings on checkout and every snapshot
would mismatch. **Order matters — a later matching rule wins, so this must not be followed by a broader rule that
re-enables text conversion.**

- [ ] **Step 5: Verify the exclusions actually took effect**

```bash
deno fmt --check
deno lint
git check-attr linguist-generated -text -- test/compile/kotlin/models@sb3/v3/extreme-names.txt
```

Expected: fmt and lint pass and their file counts are unchanged from before Step 4; `git check-attr` reports
`linguist-generated: set` and `text: unset`. Adjust the path to a snapshot that exists.

- [ ] **Step 6: Document tier 3 in `test/README.md`**

Add a `## Tier 3: compile gate` section after the tier-2 material, matching the file's existing voice. It must cover:

- What a compile unit is, and the measured unit counts per language.
- That diagnostics are snapshots: a clean unit has no file, a failing unit commits its errors, fixing a defect produces
  a deletion, and check mode refuses a stale snapshot.
- The commands: `deno task test:compile` and `deno task test:compile:check`.
- That Docker is required for the Kotlin and containerized-TypeScript groups, and that `models` and `fetch-clients` need
  only Deno.
- That warnings are deliberately discarded and only errors are recorded, and why.
- That a non-zero compiler exit with zero parsed diagnostics is a harness failure, so a green run cannot mean the
  parser stopped working.
- That `test/compile/` currently records real, unfixed generator defects, with a pointer to
  `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`, so a reader does not mistake the committed errors for
  accepted behaviour.
- Where compiler and dependency versions are pinned, and that `--offline` means a new dependency has to be added to the
  warmup project.

- [ ] **Step 7: Commit**

```bash
deno fmt --check && deno lint && deno test -A packages/core packages/kotlin packages/typescript test/harness
git add deno.json .gitattributes test/README.md test/compile-tests
git commit -m "test(compile): wire the tier-3 tasks, orphan sweep, and docs"
```

---

### Task 8: Register what the gate found

**Files:**

- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Interfaces:**

- Consumes: the per-task reports from Tasks 2, 4, 5, and 6, and the committed contents of `test/compile/`.

The gate's whole purpose is to surface uncompilable output. Every failure it found that no register entry covers is a
discovery, and a discovery nobody wrote down reads as accepted behaviour forever. This task is the write-down.

- [ ] **Step 1: Inventory what is committed against what is registered**

Read every distinct diagnostic in `test/compile/` and classify it. `git grep -h '' -- 'test/compile/**'` sorted and
deduped gives the distinct message set quickly.

For each distinct diagnostic, name the register entry that covers it, or mark it new. The entries to expect: **7**
(`TS2456` circular type aliases), **18** (the `<output>/models/.ts` import), **19** (`responseCode = null`), **21**
(unnamed type declarations), **22** (unnamed constructor parameters).

- [ ] **Step 2: Register the Kotlin reserved-word defect**

This one is known to be missing. Task 5 of the phase-2b corpus expansion found it and its reviewer confirmed it against
committed output, but no register entry was ever written — verified by `grep -n "reserved\|keyword\|backtick"` over the
register, which matches only an unrelated line about 3.1 JSON Schema keywords.

Two symptoms, and they may be one entry or two — decide and say which you chose:

- Kotlin emits unescaped hard keywords as property names: `val class:`, `val val:`, `val is:`, `val in:`, `val this:` in
  `test/output/kotlin/models@sb3/v3/reserved-words/com/openapi/generated/model/ObjectWithReservedProperties.kt`.
  Kotlin requires backticks for these. `constructor` is a *soft* keyword and is legal as an identifier, so it is
  correctly not affected — say so, because it shows the fix is about hard keywords specifically.
- A schema named `String`, `Int`, `List`, `Map`, `Any` or `Unit` is emitted as a class in
  `com.openapi.generated.model`, shadowing the `kotlin.*` type of the same name for every other class in that package.
  `String.kt` is the clearest witness: it declares `data class String(val value: String? = null)`, where the property's
  type now resolves to the class being declared.

Match the format of entries 18 through 22. Each needs the generator, the symptom, the root cause with a source location,
the corpus entry that pins it, an openable snapshot path, the compile-gate diagnostics that now catch it, and the
record-not-fix note.

- [ ] **Step 3: Register the name-collision compile failure**

`v3/name-collisions` produces five `data class MyThing` declarations in one Kotlin package
(`MyThing.kt`, `MyThing_1.kt` … `MyThing_4.kt`), which is a duplicate-declaration error. The root cause — no name
deduplication anywhere in the three generator packages — is already noted in the register's unscheduled section, but the
*compile* consequence is not, and it is now a committed diagnostic. Add it, cross-referencing the existing note rather
than duplicating it.

Say explicitly that this became visible only because the output tests switched to `existingFileBehavior: 'count'`: under
`'error'` these specs produced only an `.error.txt` and had no tree to compile. The corpus-expansion plan's deviation
note already hands that context forward; point at it.

- [ ] **Step 4: Register everything else new**

For any remaining unmatched diagnostic from Step 1, add an entry. If there are none, say so in your report — that is a
real finding too, and it would mean the register was already complete.

- [ ] **Step 5: Verify every citation you wrote**

Open each snapshot path and source location you cited and confirm it says what your entry claims. Every register entry
in this file was verified against committed output when it was written, and two entries in earlier phases carried line
numbers that had drifted. Report any citation that did not hold and what the correct one was.

- [ ] **Step 6: Commit**

```bash
deno fmt --check
git add docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: register the compile failures the tier-3 gate surfaced"
```

---

## Out of scope, recorded rather than dropped

- **CI wiring.** The spec's phase 8 owns it. This plan adds `test:compile` and `test:compile:check` so the jobs have
  something to call, but adds no workflow. The `images` matrix job the spec describes matters most for tier 4, which has
  four Dockerfiles; tier 3 has two.
- **Fixing anything.** Ten registered defects and whatever Task 8 adds stay unfixed. Two of them — name deduplication
  and `TS2456` — are open-ended design work, and the owner chose gate-first deliberately.
- **Tier 4.** Reference server, reference client, case table, and the kitchen-sink spec are phases 5 through 7.
  `docker.ts` is built here with tier 4 in mind — hence `hostGateway`, which tier 3 never uses — because building it
  twice would be worse than one unused option.
- **The `testcontainers` npm package**, evaluated during execution at the owner's request and rejected on evidence.
  `npm:testcontainers@11` imports fine under Deno, but every runtime strategy fails with `Could not find a working
  container runtime strategy`, both with `DOCKER_HOST` unset and with an explicit npipe. One layer down,
  `npm:dockerode@4` against `//./pipe/docker_engine` fails with `socket hang up`, so Deno's Node compatibility cannot
  speak the Windows named pipe Docker Desktop exposes; testcontainers is built on dockerode, so the blocker is
  structural rather than configuration. It would likely work over a unix socket on Linux CI, but a tier that runs in CI
  and not on the maintainer's machine defeats "Deno and Docker are the only prerequisites". Three reasons it would
  still be the weaker fit even on Linux: it does not expose `buildx --cache-to type=gha,mode=max`, which this plan
  needs; tier 3's workload is one-shot batch, the weakest fit for a library built around service containers you wait on
  and connect to; and it adds a Ryuk reaper container plus native optional dependencies (`ssh2`, `cpu-features`) whose
  build scripts Deno skips. The tempting case was tier 4's Spring Boot health polling — the same Windows blocker
  applies there, which is why `docker.ts` carries `hostGateway` itself.
- **`deno task test`'s write-mode default.** The spec intends the everyday loop to be write mode, so this plan does not
  change it. Task 7 adds `test:check` and documents the trap instead of silently changing behaviour the spec asked for.

## Halt conditions

Report BLOCKED rather than working around any of these:

- A Gradle build does not finish within 30 minutes, or configuration alone exceeds about 5 minutes at 44 subprojects.
- Write mode and check mode disagree for any unit — a non-deterministic gate is worse than no gate.
- A compiler exits non-zero and the parser finds no diagnostics, other than in Task 2's deliberate fault injection.
- A dependency cannot be resolved offline inside the container.
- Any diff appears under `test/specs/` or `test/output/`. This phase does not touch them.

## Self-review

**Spec coverage.** The Tier 3 section names five things: a synthesized Gradle multi-project build (Tasks 5 and 6), one
container start per language (one Gradle build, one `tsc` run per profile), `versions.gradle.kts` consumed by both the
Dockerfile and the build (Task 5 Steps 1 to 3), `deno check` for `models` and `fetch-clients` with no Docker (Task 2),
and `tsc --noEmit` in the `node` image for the other three (Task 4). Verbatim compiler output is honoured in spirit
rather than literally: diagnostics are recorded as `file:line:col message` with warnings and build noise dropped,
because a snapshot that churns on a compiler upgrade stops being read. That is a deliberate departure and it is stated
in the Design decisions section. The spec's Local Tasks list `test:compile`, `test:all`, and Docker-absent handling —
Task 7 and Task 3 respectively. `docker.ts`'s deferral from phase 1 to here is honoured in Task 3.

Two things the spec's tier-3 section implies that this plan does **not** do: it does not gate tier 3 behind tier 2 in CI
(phase 8 owns that), and it does not treat the compile gate as pass/fail (the owner chose diagnostics-as-snapshots).
Both are stated above.

**Placeholder scan.** No TBDs. Three steps deliberately produce an artifact rather than transcribe one: Task 2 Step 1,
Task 4 Step 5, and Task 5 Step 5 capture real compiler output as parser fixtures, and Task 5 Step 4 spikes the Gradle
project shape by hand before generating 512 of them. Each names its concrete output, what to do if the first attempt
comes back empty or is rejected, and that the result must be recorded in the report. That is a spike with a defined
deliverable, not a deferred decision — and writing 512 generated build scripts against a Gradle DSL idiom nobody had
executed would be the larger failure.

**Type consistency.** `CompileUnit`, `Diagnostic`, and `UnitRegistryEntry` are defined once in Task 1 and every later
task consumes those names. All three runners share the return shape `Promise<Map<string, Diagnostic[]>>`, keyed by
`CompileUnit.id`, with an entry for every unit given — asserted by `verifyUnit`, which throws when a key is missing.
`compileSnapshotFile(compileRootDir, unit)` is the single place a snapshot path is computed, used by the driver and by
the orphan sweep. `synthesizeGradleBuild`'s variant detection keys on `sb4` appearing anywhere in the profile name,
which is why `spring-controllers@sb4-strict` resolves correctly, and Task 6 Step 1 pins that with a test.

One gap this review found and fixed inline: Task 1's original interface list omitted `relativizeDiagnostic`, which all
three runners call. It is exported from `diagnostics.ts` and documented in Task 1 Step 8.
