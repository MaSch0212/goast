# Tier 2 Machinery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tier 2 work end to end — every generator profile crossed with every corpus spec produces a committed file
tree, reviewed as an ordinary git diff — over the existing 14-spec corpus.

**Architecture:** A spec-discovery module walks `test/specs/` and yields one entry per spec (a file, or a directory whose
files parse together). A profile registry names the 15 generator-plus-config combinations. One driver test file crosses
the two and calls a single harness entry point, `verifyProfile`, which generates into a temp directory and reconciles
three snapshots against `test/output/`: the file tree, the generator's returned `state`, and — when generation throws —
the error message. Write mode rewrites the snapshots; check mode throws a report.

**Tech Stack:** Deno 2.8.2, `@std/testing/bdd`, `@std/fs`, `@std/bytes`, `node:util` for state serialization. No Docker
in this phase.

## Global Constraints

- Deno and Docker are the repo's only prerequisites. This phase requires only Deno.
- Deno is pinned to **2.8.2** in CI. Do not rely on APIs newer than that.
- Generators always run with `newLine: '\n'`. Comparison is byte-exact; a stray `\r` is a real bug, never stripped.
- Snapshot mode resolution: `GOAST_SNAPSHOT=write|check` wins; otherwise `check` when `CI` is set, `write` when not.
- Every committed snapshot must be machine-independent. Absolute paths are normalized to `<root>/…`; the generation temp
  directory is normalized to `<output>/…`.
- A profile-and-spec pair has exactly one of the two snapshot forms — a tree plus state, or an error file. Possessing
  both is itself a failure.
- Test files run sequentially. Do not add `--parallel` to any test task: `captureConsole` patches the global `console`.
- `test/output/**` is excluded from `fmt` and `lint`, marked `-text` and `linguist-generated` in `.gitattributes`. Do not
  change those entries.
- Run all tasks from the repo root. `getSourceDocLine` emits cwd-relative paths, so a different cwd would silently
  produce different snapshots.
- Public API of the published packages does not change in this phase, except for outright bug fixes.

---

## File Structure

**Created:**

| File                                        | Responsibility                                                     |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `test/harness/specs.ts`                     | Corpus discovery: `test/specs/` to `DiscoveredSpec[]`              |
| `test/harness/snapshot/capture-console.ts`  | Runs a function with `console` captured, returning the output      |
| `test/harness/snapshot/serialize.ts`        | `util.inspect`-based serialization shared by state and model snaps |
| `test/harness/snapshot/verify-profile.ts`   | The tier-2 entry point: tree + state + error, one combined report  |
| `test/harness/snapshot/orphans.ts`          | Finds snapshot directories no profile-and-spec pair claims         |
| `test/output-tests/profiles.ts`             | The 15-profile registry                                            |
| `test/output-tests/output.test.ts`          | The driver: profiles x specs                                       |
| `test/output-tests/core-model.test.ts`      | Parsed `ApiData` snapshots                                         |
| `test/output-tests/orphans.test.ts`         | Asserts `test/output/` holds exactly what the registry claims      |
| `test/output/**`                            | The committed snapshots themselves                                 |

**Modified:** `test/harness/paths.ts`, `test/harness/mod.ts`, `test/harness/snapshot/mod.ts`,
`test/harness/snapshot/verify-file-tree.ts`, `test/harness/snapshot/text-diff.ts`, `deno.json`, `test/README.md`,
`.gitignore`, `packages/typescript/src/generators/services/angular-services/angular-services-generator.ts`,
`packages/core/src/transform/helpers.ts`.

**Moved:** `test/openapi-files/` to `test/specs/`.

**Deleted:** `test/harness/verify.ts`, `packages/core/tests/`, `packages/kotlin/tests/`, `packages/typescript/tests/`.

---

### Task 1: Retire the legacy output tests, move the corpus, add spec discovery

These three go together, and the ordering is forced. The legacy `.expect.txt` snapshots embed normalized spec paths such
as `<root>/test/openapi-files/v3/simple-schemas.yml` in their `__source__` fields, so moving the corpus would fail all 47
of them. Deleting them first makes the move free; doing the move first would mean regenerating 1.17 MB of snapshots that
this plan deletes anyway.

Between this task and Task 6 there is no generation-output regression net. Task 4 carries its own before-and-after
output check to cover the only code change in that window.

**Files:**

- Delete: `packages/core/tests/`, `packages/kotlin/tests/`, `packages/typescript/tests/`, `test/harness/verify.ts`
- Move: `test/openapi-files/` to `test/specs/`
- Modify: `test/harness/paths.ts`, `test/harness/mod.ts`, `.gitignore`, `deno.json`
- Create: `test/harness/specs.ts`
- Create: `test/harness/specs.test.ts`

**Interfaces:**

- Consumes: `repoRootDir` from `test/harness/paths.ts`; `OpenApiVersion` from `test/harness/types.ts`.
- Produces:
  ```ts
  export const SPEC_VERSION_DIRS: { readonly v2: '2.0'; readonly v3: '3.0'; readonly 'v3.1': '3.1' };
  export type SpecVersionDir = keyof typeof SPEC_VERSION_DIRS;
  export type DiscoveredSpec = {
    versionDir: SpecVersionDir;
    version: OpenApiVersion;
    name: string;
    files: string[];
  };
  export function discoverSpecs(root?: string): Promise<DiscoveredSpec[]>;
  ```
  Plus `specsDir` and `snapshotRootDir` from `paths.ts`.

- [ ] **Step 1: Delete the legacy output tests and the old verify helper**

```bash
git rm -r --quiet packages/core/tests packages/kotlin/tests packages/typescript/tests test/harness/verify.ts
```

That removes the three `openapi*.test.ts` files, all 47 `.expect.txt` snapshots under `packages/*/tests/.verify/`, and
`verify.ts` with its `MultipartData` and its `spawn('code', '--diff')` call.

Then remove `export * from './verify.ts';` from `test/harness/mod.ts`.

- [ ] **Step 2: Drop the config and gitignore entries those tests needed**

In `.gitignore`, delete the line matching `**/.verify/**/*.actual.txt`.

In `deno.json`, delete the `".verify/**/*"` entry from `fmt.exclude` and from `lint.exclude`. Leave every other entry in
both arrays exactly as it is — in particular do not touch `test/output/**` or `docs/superpowers/**`.

Confirm nothing references the removed pieces:

```bash
grep -rn '\.verify\|MultipartData' --include='*.ts' --include='*.json' --include='.gitignore' packages test deno.json .gitignore
```

Expected: no output.

- [ ] **Step 3: Confirm the suite is green without them**

```bash
deno test -A && deno fmt --check && deno lint
```

Expected: PASS. The count drops from 117 to roughly 96 — the ~21 deleted snapshot tests are gone, the colocated unit
tests remain.

- [ ] **Step 3a: Commit the deletion on its own**

```bash
git add -A
git commit -m "test: remove legacy concatenated-snapshot output tests"
```

- [ ] **Step 4: Move the corpus with git**

```bash
git mv test/openapi-files test/specs
```

Then confirm nothing still points at the old path:

```bash
grep -rn 'openapi-files' --include='*.ts' --include='*.json' --include='*.md' --include='*.yml' . | grep -v node_modules
```

Expected: no output outside `docs/superpowers/`. Fix any hit in code or config; leave the design documents alone, they
describe the move.

- [ ] **Step 5: Point `paths.ts` at the new location**

Replace the tail of `test/harness/paths.ts` (everything from `export const repoRootDir` onwards) with exactly this. The
three `openApi*FilesDir` exports go away with the tests that used them:

```ts
export const repoRootDir: string = _repoRootDir;

/** Root of the OpenAPI corpus. */
export const specsDir: string = join(_repoRootDir, 'test', 'specs');

/** Root of the committed tier-2 snapshots. */
export const snapshotRootDir: string = join(_repoRootDir, 'test', 'output');
```

- [ ] **Step 5a: Verify and commit the move on its own**

```bash
deno test -A && deno fmt --check && deno lint
```

Expected: PASS.

```bash
git add -A
git commit -m "test: move OpenAPI corpus to test/specs"
```

- [ ] **Step 6: Write the failing test for discovery**

Create `test/harness/specs.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { specsDir } from './paths.ts';
import { discoverSpecs } from './specs.ts';

describe('discoverSpecs', () => {
  it('finds single-file specs with their version', async () => {
    const specs = await discoverSpecs();
    const simple = specs.find((s) => s.versionDir === 'v3' && s.name === 'simple-schemas');

    expect(simple).toBeDefined();
    expect(simple!.version).toBe('3.0');
    expect(simple!.files).toEqual([join(specsDir, 'v3', 'simple-schemas.yml')]);
  });

  it('covers every version directory', async () => {
    const specs = await discoverSpecs();
    expect(new Set(specs.map((s) => s.versionDir))).toEqual(new Set(['v2', 'v3', 'v3.1']));
    expect(new Set(specs.map((s) => s.version))).toEqual(new Set(['2.0', '3.0', '3.1']));
  });

  it('returns entries in a deterministic order', async () => {
    const first = await discoverSpecs();
    const second = await discoverSpecs();
    const key = (s: { versionDir: string; name: string }) => `${s.versionDir}/${s.name}`;

    expect(first.map(key)).toEqual(second.map(key));
    expect(first.map(key)).toEqual([...first.map(key)].sort());
  });

  it('treats a directory as one spec whose files parse together', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v3', 'split-spec'), { recursive: true });
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'b.yml'), 'openapi: 3.0.0\n');
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'a.yml'), 'openapi: 3.0.0\n');
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'notes.md'), 'ignored\n');

      const specs = await discoverSpecs(root);

      expect(specs).toHaveLength(1);
      expect(specs[0].name).toBe('split-spec');
      expect(specs[0].files).toEqual([
        join(root, 'v3', 'split-spec', 'a.yml'),
        join(root, 'v3', 'split-spec', 'b.yml'),
      ]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('ignores an absent version directory', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v3'));
      await Deno.writeTextFile(join(root, 'v3', 'only.json'), '{}');
      expect((await discoverSpecs(root)).map((s) => s.name)).toEqual(['only']);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
```

- [ ] **Step 7: Run it to verify it fails**

```bash
deno test -A test/harness/specs.test.ts
```

Expected: FAIL — `Module not found` for `./specs.ts`.

- [ ] **Step 8: Implement discovery**

Create `test/harness/specs.ts`:

```ts
import { join } from 'node:path';

import { walk } from '@std/fs/walk';

import { specsDir } from './paths.ts';
import type { OpenApiVersion } from './types.ts';

/** Corpus version directories, mapped to the OpenAPI version they hold. */
export const SPEC_VERSION_DIRS = {
  'v2': '2.0',
  'v3': '3.0',
  'v3.1': '3.1',
} as const satisfies Record<string, OpenApiVersion>;

export type SpecVersionDir = keyof typeof SPEC_VERSION_DIRS;

/** One corpus entry: a single spec file, or a directory of files parsed together. */
export type DiscoveredSpec = {
  /** The version directory it lives in. Doubles as a snapshot path segment. */
  versionDir: SpecVersionDir;
  /** The OpenAPI version that directory holds. */
  version: OpenApiVersion;
  /** File base name without extension, or the directory name. Snapshot path segment. */
  name: string;
  /** Absolute paths to hand to `parseAndGenerate`, sorted. */
  files: string[];
};

const SPEC_EXTENSIONS = ['.yml', '.yaml', '.json'];

/**
 * Enumerates the corpus under `root`, one entry per spec.
 *
 * A file directly inside a version directory is one spec. A *directory* there is one spec too, whose
 * files are parsed together — that is how the multi-file and mixed-version cases are expressed.
 */
export async function discoverSpecs(root: string = specsDir): Promise<DiscoveredSpec[]> {
  const specs: DiscoveredSpec[] = [];

  for (const versionDir of Object.keys(SPEC_VERSION_DIRS) as SpecVersionDir[]) {
    const versionPath = join(root, versionDir);
    const entries: Deno.DirEntry[] = [];
    try {
      for await (const entry of Deno.readDir(versionPath)) entries.push(entry);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const path = join(versionPath, entry.name);
      if (entry.isDirectory) {
        const files = await collectSpecFiles(path);
        if (files.length > 0) {
          specs.push({ versionDir, version: SPEC_VERSION_DIRS[versionDir], name: entry.name, files });
        }
      } else if (isSpecFile(entry.name)) {
        specs.push({
          versionDir,
          version: SPEC_VERSION_DIRS[versionDir],
          name: entry.name.replace(/\.[^.]+$/, ''),
          files: [path],
        });
      }
    }
  }

  return specs;
}

function isSpecFile(name: string): boolean {
  return SPEC_EXTENSIONS.some((extension) => name.endsWith(extension));
}

async function collectSpecFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of walk(dir, { includeDirs: false, includeSymlinks: false, exts: SPEC_EXTENSIONS })) {
    files.push(entry.path);
  }
  return files.sort();
}
```

- [ ] **Step 9: Export it and run everything**

Add `export * from './specs.ts';` to `test/harness/mod.ts`, keeping the file's alphabetical ordering (after
`./snapshot/mod.ts`).

```bash
deno test -A && deno fmt --check && deno lint
```

Expected: PASS.

- [ ] **Step 10: Verify the npm build still works**

The harness is a dnt workspace member, so removing a module from it can break the npm build.

```bash
deno task npm && deno publish --dry-run --allow-dirty && deno install --frozen
```

Expected: all three succeed, with `[dnt] Complete!` for each of the four packages. If `npm:test-harness` turns out to be
unnecessary now — it exists so dnt can type-check package-internal tests, and there are no package-internal snapshot
tests left — report that rather than removing it. The spec defers that decision to implementation and it deserves a
reviewer's look.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(test): add corpus spec discovery"
```

---

### Task 2: Console capture and report volume cap

Two harness gaps phase 1's review flagged. Generators emit ~23 hardcoded `console.log` calls with no verbosity seam, and
`formatMismatchReport` prints every changed path — hundreds of lines per failing test once the corpus is wide.

**Files:**

- Create: `test/harness/snapshot/capture-console.ts`
- Create: `test/harness/snapshot/capture-console.test.ts`
- Modify: `test/harness/snapshot/text-diff.ts`
- Modify: `test/harness/snapshot/text-diff.test.ts`
- Modify: `test/harness/snapshot/mod.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  ```ts
  export type CaptureResult<T> =
    | { ok: true; value: T; output: string }
    | { ok: false; error: unknown; output: string };
  export function captureConsole<T>(fn: () => Promise<T> | T): Promise<CaptureResult<T>>;
  ```

- [ ] **Step 1: Write the failing test**

Create `test/harness/snapshot/capture-console.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { captureConsole } from './capture-console.ts';

describe('captureConsole', () => {
  it('captures output and returns the value', async () => {
    const result = await captureConsole(() => {
      console.log('generating a');
      console.warn('careful');
      return 42;
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBe(42);
    expect(result.output).toBe('generating a\ncareful\n');
  });

  it('captures output and returns the error instead of throwing', async () => {
    const result = await captureConsole(() => {
      console.log('partial work');
      throw new Error('boom');
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && (result.error as Error).message).toBe('boom');
    expect(result.output).toBe('partial work\n');
  });

  it('awaits async work', async () => {
    const result = await captureConsole(async () => {
      await Promise.resolve();
      console.info('async line');
      return 'done';
    });

    expect(result.ok && result.value).toBe('done');
    expect(result.output).toBe('async line\n');
  });

  it('restores console even when the function throws', async () => {
    const before = console.log;
    await captureConsole(() => {
      throw new Error('boom');
    });
    expect(console.log).toBe(before);
  });

  it('formats multiple arguments the way console does', async () => {
    const result = await captureConsole(() => {
      console.log('count:', 3, { a: 1 });
    });
    expect(result.output).toBe('count: 3 { a: 1 }\n');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
deno test -A test/harness/snapshot/capture-console.test.ts
```

Expected: FAIL — `Module not found` for `./capture-console.ts`.

- [ ] **Step 3: Implement capture**

Create `test/harness/snapshot/capture-console.ts`:

```ts
import * as util from 'node:util';

/** The outcome of a captured run, with whatever the function printed. */
export type CaptureResult<T> =
  | { ok: true; value: T; output: string }
  | { ok: false; error: unknown; output: string };

/**
 * Runs `fn` with `console` output collected rather than printed, and reports the outcome instead of
 * throwing.
 *
 * The generators log a line per generated file with no way to turn it off, which would bury the
 * per-profile snapshot summary across hundreds of profile-and-spec pairs. Callers print the captured
 * output only when the run failed.
 *
 * Patches a global, so runs must not overlap. Test files execute sequentially — do not pass
 * `--parallel` to `deno test`.
 */
export async function captureConsole<T>(fn: () => Promise<T> | T): Promise<CaptureResult<T>> {
  const chunks: string[] = [];
  const capture = (...args: unknown[]) => {
    chunks.push(util.format(...args) + '\n');
  };

  const originals = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
    error: console.error,
  };
  Object.assign(console, { log: capture, info: capture, warn: capture, debug: capture, error: capture });

  try {
    const value = await fn();
    return { ok: true, value, output: chunks.join('') };
  } catch (error) {
    return { ok: false, error, output: chunks.join('') };
  } finally {
    Object.assign(console, originals);
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
deno test -A test/harness/snapshot/capture-console.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write the failing test for the file-list cap**

Append this `describe` to `test/harness/snapshot/text-diff.test.ts`, reusing the file's existing imports of `expect`,
`describe`, `it` and `formatMismatchReport` rather than adding duplicates. Its opening `describe` line is at zero
indentation:

```ts
describe('formatMismatchReport file list cap', () => {
  const encoder = new TextEncoder();

  it('lists every path when there are few', () => {
    const added = ['a.txt', 'b.txt'];
    const report = formatMismatchReport('/snap', { added, changed: [], removed: [] }, new Map(), new Map());

    expect(report).toContain('  + a.txt');
    expect(report).toContain('  + b.txt');
    expect(report).not.toContain('more path(s)');
  });

  it('caps a long list and says how many were omitted', () => {
    const added = Array.from({ length: 30 }, (_, i) => `file-${String(i).padStart(2, '0')}.txt`);
    const report = formatMismatchReport('/snap', { added, changed: [], removed: [] }, new Map(), new Map());

    expect(report).toContain('  + file-00.txt');
    expect(report).toContain('  + file-19.txt');
    expect(report).not.toContain('  + file-20.txt');
    expect(report).toContain('  ... and 10 more path(s)');
  });

  it('counts added, changed and removed together against the cap', () => {
    const paths = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${i}.txt`);
    const expected = new Map(paths('c', 15).map((p) => [p, encoder.encode('one')]));
    const actual = new Map(paths('c', 15).map((p) => [p, encoder.encode('two')]));
    const diff = { added: paths('a', 10), changed: paths('c', 15), removed: paths('r', 5) };

    const report = formatMismatchReport('/snap', diff, expected, actual);

    expect(report).toContain('  ... and 10 more path(s)');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

```bash
deno test -A test/harness/snapshot/text-diff.test.ts
```

Expected: FAIL — the cap tests find no `more path(s)` text.

- [ ] **Step 7: Implement the cap**

In `test/harness/snapshot/text-diff.ts`, add the constant beside `MAX_DETAILED_FILES`:

```ts
/** Maximum paths to list in a mismatch report before summarising the rest. */
const MAX_LISTED_PATHS = 20;
```

Then replace these three lines in `formatMismatchReport`:

```ts
  for (const path of diff.added) lines.push(`  + ${path}`);
  for (const path of diff.changed) lines.push(`  ~ ${path}`);
  for (const path of diff.removed) lines.push(`  - ${path}`);
```

with:

```ts
  lines.push(...formatPathList(diff));
```

and add this function beside `formatFileDifference`:

```ts
function formatPathList(diff: TreeDiff): string[] {
  const entries = [
    ...diff.added.map((path) => `  + ${path}`),
    ...diff.changed.map((path) => `  ~ ${path}`),
    ...diff.removed.map((path) => `  - ${path}`),
  ];
  if (entries.length <= MAX_LISTED_PATHS) return entries;

  return [
    ...entries.slice(0, MAX_LISTED_PATHS),
    `  ... and ${entries.length - MAX_LISTED_PATHS} more path(s)`,
  ];
}
```

- [ ] **Step 8: Run the tests**

```bash
deno test -A test/harness && deno fmt --check && deno lint
```

Expected: PASS. The pre-existing `formatMismatchReport` tests must still pass — the cap must not change short reports.

- [ ] **Step 9: Export and commit**

Add `export * from './capture-console.ts';` to `test/harness/snapshot/mod.ts`, keeping alphabetical order (first line).

```bash
git add -A
git commit -m "feat(harness): capture generator logs and cap mismatch report volume"
```

---

### Task 3: The `verifyProfile` entry point

The tier-2 driver needs one call that gates a profile-and-spec pair on all of its snapshots and reports every mismatch
in one run. `verifyFileTree` alone cannot do it: its `generate` callback returns `Promise<void>` so `state` has to escape
through a closure, and a check-mode throw short-circuits the state comparison, hiding half the failure.

**Files:**

- Create: `test/harness/snapshot/serialize.ts`
- Create: `test/harness/snapshot/serialize.test.ts`
- Create: `test/harness/snapshot/verify-profile.ts`
- Create: `test/harness/snapshot/verify-profile.test.ts`
- Modify: `test/harness/snapshot/verify-file-tree.ts`
- Modify: `test/harness/snapshot/mod.ts`

**Interfaces:**

- Consumes: `captureConsole` and `CaptureResult` from `./capture-console.ts` (Task 2); `resolveSnapshotMode`,
  `VerifyOptions` from `./mode.ts`; `verifyText` from `./verify-text.ts`; `normalizeFileTree` from `./normalize.ts`;
  `applyTreeDiff`, `diffFileTrees`, `formatDiffCounts`, `isEmptyDiff`, `readFileTree` from `./tree.ts`;
  `formatMismatchReport` from `./text-diff.ts`.
- Produces:
  ```ts
  // serialize.ts
  export function serializeValue(value: unknown, depth?: number): string;

  // verify-file-tree.ts — new export, extracted from verifyFileTree
  export function verifyGeneratedTree(
    snapshotDir: string,
    outputDir: string,
    options?: VerifyOptions,
  ): Promise<void>;

  // verify-profile.ts
  export type ProfileSnapshot = { treeDir: string; stateFile: string; errorFile: string };
  export function profileSnapshotPaths(baseDir: string, specName: string): ProfileSnapshot;
  export function verifyProfile(
    snapshot: ProfileSnapshot,
    generate: (outputDir: string) => unknown,
    options?: VerifyOptions,
  ): Promise<void>;
  ```

- [ ] **Step 1: Write the failing test for serialization**

Create `test/harness/snapshot/serialize.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { serializeValue } from './serialize.ts';

describe('serializeValue', () => {
  it('passes strings through unchanged', () => {
    expect(serializeValue('already text')).toBe('already text');
  });

  it('sorts object keys so output is order-independent', () => {
    expect(serializeValue({ b: 1, a: 2 })).toBe(serializeValue({ a: 2, b: 1 }));
    expect(serializeValue({ b: 1, a: 2 })).toContain('a: 2');
  });

  it('descends deeply nested structures', () => {
    let nested: unknown = 'leaf';
    for (let i = 0; i < 20; i++) nested = { next: nested };
    expect(serializeValue(nested)).toContain('leaf');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
deno test -A test/harness/snapshot/serialize.test.ts
```

Expected: FAIL — `Module not found` for `./serialize.ts`.

- [ ] **Step 3: Implement serialization**

Create `test/harness/snapshot/serialize.ts`. This is the serialization the deleted `verify.ts` used for its snapshots,
kept identical so committed baselines stay comparable:

```ts
import * as util from 'node:util';

/**
 * Renders a value as snapshot text. Keys are sorted, so a snapshot does not depend on property
 * insertion order. Strings pass through so callers can mix pre-rendered text into the same snapshot.
 */
export function serializeValue(value: unknown, depth: number = 100): string {
  return typeof value === 'string' ? value : util.inspect(value, { depth, sorted: true });
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
deno test -A test/harness/snapshot/serialize.test.ts
```

Expected: PASS.

- [ ] **Step 5: Extract the tree comparison so it can run on an already-generated directory**

`verifyProfile` generates once and needs to compare the resulting directory; `verifyFileTree` currently owns both the
temp directory and the generation. Split it. In `test/harness/snapshot/verify-file-tree.ts`, keep the existing
`verifyFileTree` doc comment and signature, and replace its body so it delegates:

```ts
export async function verifyFileTree(
  snapshotDir: string,
  generate: (outputDir: string) => Promise<void> | void,
  options: VerifyOptions = {},
): Promise<void> {
  const outputDir = await Deno.makeTempDir({ prefix: 'goast-snapshot-' });
  try {
    await generate(outputDir);
    await verifyGeneratedTree(snapshotDir, outputDir, options);
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
}
```

Then add the extracted function below it, carrying over the safety rail verbatim:

```ts
/**
 * Compares an already-populated `outputDir` against the committed snapshot at `snapshotDir`.
 *
 * Split out of {@link verifyFileTree} so a caller that needs the generator's return value can run
 * the generation itself and still reuse the reconciliation.
 */
export async function verifyGeneratedTree(
  snapshotDir: string,
  outputDir: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const actual = normalizeFileTree(await readFileTree(outputDir));
  const expected = await readFileTree(snapshotDir);

  // Safety rail: a generator that throws early or silently emits nothing must not be able to
  // delete a *populated* committed snapshot in write mode. A generator that legitimately emits
  // zero files (e.g. a spec with no components/schemas) is fine as long as the committed
  // snapshot is empty or absent too.
  if (actual.size === 0 && expected.size > 0) {
    throw new Error(
      `Generation produced no files for snapshot "${snapshotDir}". Refusing to continue, ` +
        `because write mode would delete the entire snapshot.`,
    );
  }

  const diff = diffFileTrees(expected, actual);
  if (isEmptyDiff(diff)) return;

  if (mode === 'check') {
    throw new Error(formatMismatchReport(snapshotDir, diff, expected, actual));
  }

  await applyTreeDiff(snapshotDir, actual, diff);
  console.info(`snapshot updated ${snapshotDir}: ${formatDiffCounts(diff)}`);
}
```

- [ ] **Step 6: Confirm the extraction changed no behaviour**

```bash
deno test -A test/harness/snapshot/verify-file-tree.test.ts
```

Expected: PASS, unchanged. The existing tests cover `verifyFileTree`; the refactor must not need any edit to them.

- [ ] **Step 7: Write the failing test for `verifyProfile`**

Create `test/harness/snapshot/verify-profile.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { profileSnapshotPaths, verifyProfile } from './verify-profile.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-profile-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

describe('profileSnapshotPaths', () => {
  it('puts state and error files beside the tree, not inside it', () => {
    const paths = profileSnapshotPaths(join('base', 'v3'), 'simple-schemas');

    expect(paths.treeDir).toBe(join('base', 'v3', 'simple-schemas'));
    expect(paths.stateFile).toBe(join('base', 'v3', 'simple-schemas.state.txt'));
    expect(paths.errorFile).toBe(join('base', 'v3', 'simple-schemas.error.txt'));
  });
});

describe('verifyProfile write mode', () => {
  it('writes the tree and the state snapshot', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      }, { mode: 'write' });

      expect(await Deno.readTextFile(join(paths.treeDir, 'Model.kt'))).toBe('class Model\n');
      expect(await Deno.readTextFile(paths.stateFile)).toContain('generated: 1');
      expect(await exists(paths.errorFile)).toBe(false);
    });
  });

  it('records a thrown generation as an error snapshot', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, () => {
        throw new Error('File already exists: Model.kt');
      }, { mode: 'write' });

      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: File already exists: Model.kt\n');
      expect(await exists(paths.treeDir)).toBe(false);
      expect(await exists(paths.stateFile)).toBe(false);
    });
  });

  it('normalizes the generation directory out of the error message', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, (outputDir) => {
        throw new Error(`File already exists: ${join(outputDir, 'a', 'Model.kt')}`);
      }, { mode: 'write' });

      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: File already exists: <output>/a/Model.kt\n');
    });
  });

  it('replaces an error snapshot with a tree once generation succeeds', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.writeTextFile(paths.errorFile, 'Error: old failure\n');

      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return {};
      }, { mode: 'write' });

      expect(await exists(paths.errorFile)).toBe(false);
      expect(await exists(join(paths.treeDir, 'Model.kt'))).toBe(true);
    });
  });

  it('replaces a tree with an error snapshot once generation starts failing', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.mkdir(paths.treeDir, { recursive: true });
      await Deno.writeTextFile(join(paths.treeDir, 'Model.kt'), 'class Model\n');
      await Deno.writeTextFile(paths.stateFile, '{}\n');

      await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'write' });

      expect(await exists(paths.treeDir)).toBe(false);
      expect(await exists(paths.stateFile)).toBe(false);
      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: boom\n');
    });
  });

  it('accepts a generator that legitimately emits no files', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, () => ({ schemas: {} }), { mode: 'write' });

      expect(await Deno.readTextFile(paths.stateFile)).toContain('schemas');
      expect(await exists(paths.errorFile)).toBe(false);
    });
  });
});

describe('verifyProfile check mode', () => {
  it('passes when tree and state both match', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      const generate = async (outputDir: string) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      };

      await verifyProfile(paths, generate, { mode: 'write' });
      await verifyProfile(paths, generate, { mode: 'check' });
    });
  });

  it('reports the tree mismatch and the state mismatch together', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      }, { mode: 'write' });

      const error = await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Renamed\n');
        return { generated: 2 };
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('Model.kt');
      expect(error.message).toContain('.state.txt');
    });
  });

  it('passes when generation throws exactly the failure that is committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      const generate = () => {
        throw new Error('boom');
      };

      await verifyProfile(paths, generate, { mode: 'write' });
      await verifyProfile(paths, generate, { mode: 'check' });
    });
  });

  it('fails when the committed failure differs from the current one', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'write' });

      const error = await verifyProfile(paths, () => {
        throw new Error('a different boom');
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('a different boom');
    });
  });

  it('fails when generation throws but a tree is still committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.mkdir(paths.treeDir, { recursive: true });
      await Deno.writeTextFile(join(paths.treeDir, 'Model.kt'), 'class Model\n');
      await Deno.writeTextFile(paths.errorFile, 'Error: boom\n');

      const error = await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('still committed');
    });
  });

  it('fails when generation throws but no error snapshot is committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      const error = await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('boom');
    });
  });

  it('fails when a committed error snapshot is stale because generation now succeeds', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.writeTextFile(paths.errorFile, 'Error: old failure\n');

      const error = await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return {};
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('no longer fails');
    });
  });

  it('surfaces captured generator output when generation throws', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      const error = await verifyProfile(paths, () => {
        console.log('Generating Model to somewhere');
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error);

      expect(error.message).toContain('Generating Model to somewhere');
    });
  });
});
```

- [ ] **Step 8: Run it to verify it fails**

```bash
deno test -A test/harness/snapshot/verify-profile.test.ts
```

Expected: FAIL — `Module not found` for `./verify-profile.ts`.

- [ ] **Step 9: Implement `verifyProfile`**

Create `test/harness/snapshot/verify-profile.ts`:

```ts
import { join } from 'node:path';

import { captureConsole } from './capture-console.ts';
import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { serializeValue } from './serialize.ts';
import { verifyGeneratedTree } from './verify-file-tree.ts';
import { verifyText } from './verify-text.ts';

/** Where one profile-and-spec pair keeps its three possible snapshots. */
export type ProfileSnapshot = {
  /** Directory holding the generated file tree. */
  treeDir: string;
  /** Serialized generator state, beside the tree so the tree holds only generated source. */
  stateFile: string;
  /** Generation error message, present only when generation fails. */
  errorFile: string;
};

/** Derives the three snapshot paths for a spec inside a profile's version directory. */
export function profileSnapshotPaths(baseDir: string, specName: string): ProfileSnapshot {
  return {
    treeDir: join(baseDir, specName),
    stateFile: join(baseDir, `${specName}.state.txt`),
    errorFile: join(baseDir, `${specName}.error.txt`),
  };
}

/**
 * Gates one profile-and-spec pair on all of its snapshots.
 *
 * On success the file tree and the serialized `state` must both match, and every mismatch is
 * reported in one run rather than the first one hiding the rest. On failure the error message
 * becomes the snapshot and the tree is dropped — a partially written tree is order-dependent and
 * says nothing useful — so a generator crash is a reviewable committed fact instead of a red test.
 *
 * A pair has exactly one of the two forms. Holding both an error file and a tree is a failure.
 */
export async function verifyProfile(
  snapshot: ProfileSnapshot,
  generate: (outputDir: string) => unknown,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const outputDir = await Deno.makeTempDir({ prefix: 'goast-snapshot-' });

  try {
    const run = await captureConsole(() => generate(outputDir));

    if (!run.ok) {
      const message = formatGenerationError(run.error, outputDir) + '\n';

      if (mode === 'check') {
        // A committed error snapshot that still matches is a pass: the recorded failure is the
        // expected outcome. Only a *changed* failure, or a leftover tree, is a problem.
        const failures: string[] = [];
        for (const stale of [snapshot.treeDir, snapshot.stateFile]) {
          if (await pathExists(stale)) {
            failures.push(
              `Generation failed, but ${stale} is still committed. Run \`deno task test:output\` ` +
                'and commit the result.',
            );
          }
        }
        try {
          await verifyText(snapshot.errorFile, message, { mode });
        } catch (error) {
          failures.push(
            [
              `Generation failed for ${snapshot.treeDir}`,
              '',
              message.trimEnd(),
              ...(run.output ? ['', 'Generator output:', run.output.trimEnd()] : []),
              '',
              error instanceof Error ? error.message : String(error),
            ].join('\n'),
          );
        }
        if (failures.length > 0) throw new Error(failures.join('\n\n'));
        return;
      }

      await removePath(snapshot.treeDir, { recursive: true });
      await removePath(snapshot.stateFile);
      await verifyText(snapshot.errorFile, message, { mode });
      return;
    }

    if (await pathExists(snapshot.errorFile)) {
      if (mode === 'check') {
        throw new Error(
          `Generation for ${snapshot.treeDir} no longer fails, but ${snapshot.errorFile} is still ` +
            'committed. Run `deno task test:output` and commit the result.',
        );
      }
      await removePath(snapshot.errorFile);
    }

    const failures: string[] = [];
    for (const verify of [
      () => verifyGeneratedTree(snapshot.treeDir, outputDir, { mode }),
      () => verifyText(snapshot.stateFile, serializeValue(run.value) + '\n', { mode }),
    ]) {
      try {
        await verify();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (failures.length > 0) throw new Error(failures.join('\n\n'));
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
}

/**
 * Renders a generation failure as snapshot text.
 *
 * The stack is deliberately dropped: it carries line numbers that churn on unrelated edits. The
 * generation directory is rewritten to `<output>` because it is a fresh temp path on every run and
 * `normalizePaths` only knows about paths inside the repository.
 */
function formatGenerationError(error: unknown, outputDir: string): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.split(outputDir).join('<output>').replace(/<output>[\\/][^\s"']*/g, (path) =>
    path.replace(/\\/g, '/')
  );
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

async function removePath(path: string, options: Deno.RemoveOptions = {}): Promise<void> {
  try {
    await Deno.remove(path, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
```

- [ ] **Step 10: Run it to verify it passes**

```bash
deno test -A test/harness && deno fmt --check && deno lint
```

Expected: PASS.

- [ ] **Step 11: Export and commit**

Add these two lines to `test/harness/snapshot/mod.ts`, keeping alphabetical order:

```ts
export * from './serialize.ts';
export * from './verify-profile.ts';
```

```bash
git add -A
git commit -m "feat(harness): add verifyProfile with tree, state and error snapshots"
```

---

### Task 4: Fix the two generator defects tier 2 exposes

Running the generators over the corpus surfaced two product bugs. Both are in shipped packages, so they are fixed as
product changes with their own tests, not worked around in the harness.

`TypeScriptAngularServicesGenerator.getRootUrl` reads `ctx.data.services[0].$src` unguarded, so it throws
`TypeError: Cannot read properties of undefined (reading '$src')` for any spec without paths or tags — which is most of
the corpus. The trailing `?? '/'` shows the intent was already to tolerate missing data. Every other TypeScript services
generator handles a spec with no services without complaint.

`packages/core/src/transform/helpers.ts:58` contains a stray `console.log('woot?')` debug leftover that fires whenever
`schema.$src` is falsy.

**Files:**

- Modify: `packages/typescript/src/generators/services/angular-services/angular-services-generator.ts:236`
- Create: `packages/typescript/src/generators/services/angular-services/angular-services-generator.test.ts`
- Modify: `packages/core/src/transform/helpers.ts:58`
- Modify: `packages/core/src/transform/helpers.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks import. Task 5's registry depends on the angular fix behaviourally — without it the
  `angular-services` profile throws for schema-only specs.

- [ ] **Step 1: Write the failing test for the angular fix**

Create `packages/typescript/src/generators/services/angular-services/angular-services-generator.test.ts`. `getRootUrl`
is `protected`, so a subclass exposes it:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { TypeScriptAngularServicesGenerator } from './angular-services-generator.ts';

// deno-lint-ignore no-explicit-any
class TestableGenerator extends TypeScriptAngularServicesGenerator {
  public callGetRootUrl(ctx: any): string {
    // deno-lint-ignore no-explicit-any
    return (this as any).getRootUrl(ctx);
  }
}

describe('TypeScriptAngularServicesGenerator', () => {
  describe('getRootUrl', () => {
    const generator = () => new TestableGenerator();

    it('falls back to "/" for a spec with no services', () => {
      const ctx = { data: { services: [] }, config: { rootUrl: undefined } };
      expect(generator().callGetRootUrl(ctx)).toBe('/');
    });

    it('falls back to "/" for a service with neither $src nor endpoints', () => {
      const ctx = { data: { services: [{ endpoints: [] }] }, config: { rootUrl: undefined } };
      expect(generator().callGetRootUrl(ctx)).toBe('/');
    });

    it("uses the document's first server url when present", () => {
      const ctx = {
        data: { services: [{ $src: { document: { servers: [{ url: 'https://api.example.com' }] } } }] },
        config: { rootUrl: undefined },
      };
      expect(generator().callGetRootUrl(ctx)).toBe('https://api.example.com');
    });

    it("falls back to the first endpoint's document when the service has no $src", () => {
      const ctx = {
        data: {
          services: [{ endpoints: [{ $src: { document: { servers: [{ url: '/api' }] } } }] }],
        },
        config: { rootUrl: undefined },
      };
      expect(generator().callGetRootUrl(ctx)).toBe('/api');
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
deno test -A packages/typescript/src/generators/services/angular-services/angular-services-generator.test.ts
```

Expected: FAIL on the first two cases with `Cannot read properties of undefined (reading '$src')`.

- [ ] **Step 3: Guard the lookup**

In `packages/typescript/src/generators/services/angular-services/angular-services-generator.ts`, replace line 236:

```ts
      (ctx.data.services[0].$src ?? ctx.data.services[0].endpoints[0]?.$src)?.document.servers?.[0]?.url ?? '/',
```

with:

```ts
      (ctx.data.services[0]?.$src ?? ctx.data.services[0]?.endpoints[0]?.$src)?.document?.servers?.[0]?.url ?? '/',
```

- [ ] **Step 4: Run it to verify it passes**

```bash
deno test -A packages/typescript/src/generators/services/angular-services/angular-services-generator.test.ts
```

Expected: PASS, all four cases.

- [ ] **Step 5: Remove the stray debug log**

In `packages/core/src/transform/helpers.ts`, `determineSchemaName` contains this at lines 57-59:

```ts
  if (!schema.$src) {
    console.log('woot?');
  }
```

Delete **all three lines**, not just the `console.log`. Removing only the log leaves an empty block, which `deno lint`
rejects under `no-empty`. The guard does nothing else: the very next line dereferences `schema.$src` regardless, so a
falsy `$src` throws either way, and the log only made it print a word first.

- [ ] **Step 6: Add a test pinning the silence**

Append this `describe` to `packages/core/src/transform/helpers.test.ts`, reusing the file's existing imports of `expect`,
`describe` and `it` rather than adding duplicates, and adding `determineSchemaName` to the existing import from
`./helpers.ts`. Its signature is
`determineSchemaName(schema: { title?: string; $src: DerefSource<unknown> }, id: string)`. Its opening `describe` line is
at zero indentation:

```ts
describe('determineSchemaName', () => {
  it('prints nothing for a schema without $src', () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(' '));
    try {
      // Still throws — the next statement dereferences $src. Only the silence is under test.
      // deno-lint-ignore no-explicit-any
      determineSchemaName({} as any, 'some-id');
    } catch {
      // expected
    } finally {
      console.log = original;
    }
    expect(lines).toEqual([]);
  });

  it('prefers an explicit title', () => {
    // deno-lint-ignore no-explicit-any
    expect(determineSchemaName({ title: 'Pet' } as any, 'some-id')).toEqual({ name: 'Pet', isGenerated: false });
  });
});
```

- [ ] **Step 7: Prove neither fix changes output for a spec that already worked**

Task 1 removed the legacy snapshot tests and Task 6 has not yet committed a baseline, so this window has no output
regression net. Build one for this change only.

Write `neutrality-check.ts` at the repo root:

```ts
import { walk } from '@std/fs/walk';
import { OpenApiGenerator } from '@goast/core';
import { TypeScriptModelsGenerator } from './packages/typescript/src/generators/models/models-generator.ts';
import { TypeScriptAngularServicesGenerator } from './packages/typescript/src/generators/services/angular-services/angular-services-generator.ts';

const outputDir = await Deno.makeTempDir({ prefix: 'neutrality-' });
const original = console.log;
console.log = () => {};
try {
  const g = new OpenApiGenerator({ outputDir, newLine: '\n' });
  // deno-lint-ignore no-explicit-any
  await (g.useType(TypeScriptModelsGenerator, {} as any)
    .useType(TypeScriptAngularServicesGenerator, {} as any) as any)
    .parseAndGenerate('test/specs/v3/service-endpoints.yml');

  const parts: string[] = [];
  const paths: string[] = [];
  for await (const entry of walk(outputDir, { includeDirs: false })) paths.push(entry.path);
  for (const path of paths.sort()) {
    parts.push(path.slice(outputDir.length).replace(/\\/g, '/'), await Deno.readTextFile(path));
  }
  console.log = original;
  console.log(parts.join('\n'));
} finally {
  console.log = original;
  await Deno.remove(outputDir, { recursive: true });
}
```

`service-endpoints.yml` is the one corpus spec that has paths, so it is the case that already generated successfully
before the guard. Capture output with the fix in place, then stash the fix and capture it again:

```bash
deno run -A neutrality-check.ts > after.txt
git stash push packages/typescript/src/generators/services/angular-services/angular-services-generator.ts packages/core/src/transform/helpers.ts
deno run -A neutrality-check.ts > before.txt
git stash pop
diff before.txt after.txt && echo "output identical"
```

Expected: `output identical`. If the files differ, stop and report the diff — that would mean the guard altered working
behaviour rather than only covering the undefined case.

- [ ] **Step 8: Remove the scratch files and run the suites**

```bash
rm neutrality-check.ts before.txt after.txt
deno test -A && deno fmt --check && deno lint
```

Expected: PASS, and `git status` clean apart from the two source files and two test files this task touches.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix(typescript): tolerate specs with no services in angular rootUrl lookup"
```

---

### Task 5: The profile registry

One entry per generator-and-config combination, since config changes output. Fifteen entries.

**Files:**

- Create: `test/output-tests/profiles.ts`
- Create: `test/output-tests/profiles.test.ts`

**Interfaces:**

- Consumes: `SpecVersionDir` from `@goast/test-harness` (Task 1); `OpenApiGenerator` from `@goast/core`; the nine
  generator classes.
- Produces:
  ```ts
  export type Profile = {
    name: string;
    language: 'kotlin' | 'typescript';
    versions: 'all' | SpecVersionDir[];
    // deno-lint-ignore no-explicit-any
    configure: (generator: OpenApiGenerator) => any;
  };
  export const profiles: Profile[];
  ```

- [ ] **Step 1: Write the failing test**

Create `test/output-tests/profiles.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { OpenApiGenerator } from '@goast/core';
import { SPEC_VERSION_DIRS } from '@goast/test-harness';

import { profiles } from './profiles.ts';

describe('profiles', () => {
  it('covers all fifteen generator and config combinations', () => {
    expect(profiles).toHaveLength(15);
  });

  it('uses a unique language and name pair per profile', () => {
    const keys = profiles.map((p) => `${p.language}/${p.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('uses names that are safe as path segments', () => {
    for (const profile of profiles) {
      expect(profile.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*(@[a-z0-9]+(-[a-z0-9]+)*)?$/);
    }
  });

  it('names only real version directories in a filter', () => {
    for (const profile of profiles) {
      if (profile.versions === 'all') continue;
      for (const version of profile.versions) {
        expect(Object.keys(SPEC_VERSION_DIRS)).toContain(version);
      }
    }
  });

  it('returns a chainable generator from configure', () => {
    for (const profile of profiles) {
      const configured = profile.configure(new OpenApiGenerator({ outputDir: 'unused', newLine: '\n' }));
      expect(typeof configured.parseAndGenerate).toBe('function');
    }
  });

  it('covers every generator that ships in the two packages', () => {
    const names = profiles.map((p) => `${p.language}/${p.name}`);
    for (const expected of [
      'kotlin/models@sb3',
      'kotlin/spring-controllers@sb3',
      'kotlin/spring-controllers@sb3-strict',
      'kotlin/spring-reactive-web-clients@sb3',
      'kotlin/okhttp3-clients@sb3',
      'typescript/models',
      'typescript/fetch-clients',
      'typescript/angular-services',
      'typescript/k6-clients',
      'typescript/easy-network-stub',
    ]) {
      expect(names).toContain(expected);
    }
  });

  it('crosses every Kotlin generator with both Spring Boot versions', () => {
    const kotlin = profiles.filter((p) => p.language === 'kotlin').map((p) => p.name);
    for (const name of kotlin.filter((n) => n.includes('@sb3'))) {
      expect(kotlin).toContain(name.replace('@sb3', '@sb4'));
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
deno test -A test/output-tests/profiles.test.ts
```

Expected: FAIL — `Module not found` for `./profiles.ts`.

- [ ] **Step 3: Implement the registry**

Create `test/output-tests/profiles.ts`. `useType`'s generics do not narrow across a heterogeneous registry, so
`configure` is typed loosely, exactly as the legacy tests did:

```ts
// deno-lint-ignore-file no-explicit-any
import type { OpenApiGenerator } from '@goast/core';
import type { SpecVersionDir } from '@goast/test-harness';

import { KotlinModelsGenerator } from '../../packages/kotlin/src/generators/models/models-generator.ts';
import { KotlinOkHttp3ClientsGenerator } from '../../packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts';
import { KotlinSpringControllersGenerator } from '../../packages/kotlin/src/generators/services/spring-controllers/spring-controllers-generator.ts';
import { KotlinSpringReactiveWebClientsGenerator } from '../../packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-clients-generator.ts';
import { TypeScriptModelsGenerator } from '../../packages/typescript/src/generators/models/models-generator.ts';
import { TypeScriptAngularServicesGenerator } from '../../packages/typescript/src/generators/services/angular-services/angular-services-generator.ts';
import { TypeScriptEasyNetworkStubsGenerator } from '../../packages/typescript/src/generators/services/easy-network-stub/easy-network-stubs-generator.ts';
import { TypeScriptFetchClientsGenerator } from '../../packages/typescript/src/generators/services/fetch-clients/fetch-clients-generator.ts';
import { TypeScriptK6ClientsGenerator } from '../../packages/typescript/src/generators/services/k6-clients/k6-clients-generator.ts';

/**
 * One generator plus one config variant. Config changes output, so each variant is its own profile
 * and its own snapshot tree.
 */
export type Profile = {
  /** Snapshot path segment, e.g. `spring-controllers@sb3-strict`. */
  name: string;
  /** Language directory under `test/output/`. */
  language: 'kotlin' | 'typescript';
  /** Corpus versions this profile runs against. */
  versions: 'all' | SpecVersionDir[];
  /** Chains the generators and config this profile represents. */
  configure: (generator: OpenApiGenerator) => any;
};

/** `__test__` makes the generators stamp `__source__` provenance into their returned state. */
const base = { __test__: true } as any;

const kotlin = (springBootVersion: 3 | 4) => ({ ...base, springBootVersion }) as any;

export const profiles: Profile[] = [
  // Kotlin. springBootVersion sits on the shared KotlinGeneratorConfig base, so it varies all four.
  ...([3, 4] as const).flatMap((sb): Profile[] => {
    const config = kotlin(sb);
    return [
      {
        name: `models@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) => g.useType(KotlinModelsGenerator, config),
      },
      {
        name: `spring-controllers@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config).useType(KotlinSpringControllersGenerator, config),
      },
      {
        name: `spring-controllers@sb${sb}-strict`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config)
            .useType(KotlinSpringControllersGenerator, { ...config, strictResponseEntities: true }),
      },
      {
        name: `spring-reactive-web-clients@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config).useType(KotlinSpringReactiveWebClientsGenerator, config),
      },
      {
        name: `okhttp3-clients@sb${sb}`,
        language: 'kotlin',
        versions: 'all',
        configure: (g) =>
          g.useType(KotlinModelsGenerator, config).useType(KotlinOkHttp3ClientsGenerator, config),
      },
    ];
  }),

  // TypeScript.
  {
    name: 'models',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base),
  },
  {
    name: 'fetch-clients',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptFetchClientsGenerator, base),
  },
  {
    name: 'angular-services',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptAngularServicesGenerator, base),
  },
  {
    name: 'k6-clients',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptK6ClientsGenerator, base),
  },
  {
    name: 'easy-network-stub',
    language: 'typescript',
    versions: 'all',
    configure: (g) => g.useType(TypeScriptModelsGenerator, base).useType(TypeScriptEasyNetworkStubsGenerator, base),
  },
];
```

Note the count: the Kotlin `flatMap` yields 5 profiles per Spring Boot version, so 10, plus 5 TypeScript entries — 15.

- [ ] **Step 4: Run it to verify it passes**

```bash
deno test -A test/output-tests/profiles.test.ts && deno fmt --check && deno lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(test): add tier 2 profile registry"
```

---

### Task 6: The output test driver and the committed baseline

Cross the registry with the corpus, then commit the snapshots the run produces. This is the task that makes tier 2 real,
and its diff is large by design: roughly 2000 generated files.

**Files:**

- Create: `test/output-tests/output.test.ts`
- Create: `test/output-tests/core-model.test.ts`
- Modify: `deno.json`
- Create: `test/output/**` (generated)

**Interfaces:**

- Consumes: `profiles` from `./profiles.ts` (Task 5); `discoverSpecs`, `profileSnapshotPaths`, `serializeValue`,
  `snapshotRootDir`, `verifyProfile`, `verifyText`, `declutterApiData` from `@goast/test-harness`; `OpenApiGenerator`
  and `OpenApiParser` from `@goast/core`.
- Produces: the committed `test/output/` tree and the four new `deno task` entries.

- [ ] **Step 1: Write the driver**

Create `test/output-tests/output.test.ts`. There is no separate failing-test step here: the driver *is* the test, and it
fails until the baseline exists.

```ts
import { join } from 'node:path';

import { describe, it } from '@std/testing/bdd';

import { OpenApiGenerator } from '@goast/core';
import { discoverSpecs, profileSnapshotPaths, snapshotRootDir, verifyProfile } from '@goast/test-harness';

import { profiles } from './profiles.ts';

const specs = await discoverSpecs();

for (const profile of profiles) {
  describe(`${profile.language}/${profile.name}`, () => {
    for (const spec of specs) {
      if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;

      it(`${spec.versionDir}/${spec.name}`, async () => {
        const baseDir = join(snapshotRootDir, profile.language, profile.name, spec.versionDir);
        await verifyProfile(
          profileSnapshotPaths(baseDir, spec.name),
          (outputDir) =>
            profile.configure(new OpenApiGenerator({ outputDir, newLine: '\n' })).parseAndGenerate(spec.files),
        );
      });
    }
  });
}
```

- [ ] **Step 2: Write the core model snapshot test**

Create `test/output-tests/core-model.test.ts`. This replaces `packages/core/tests/openapi.test.ts`, which Task 7
deletes:

```ts
import { join } from 'node:path';

import { describe, it } from '@std/testing/bdd';

import { OpenApiParser } from '@goast/core';
import { declutterApiData, discoverSpecs, serializeValue, snapshotRootDir, verifyText } from '@goast/test-harness';

const specs = await discoverSpecs();

describe('core model', () => {
  for (const spec of specs) {
    it(`${spec.versionDir}/${spec.name}`, async () => {
      const data = await new OpenApiParser().parseApisAndTransform(spec.files);

      // The dereferenced document is a huge cyclic graph and is not what this snapshot is about.
      for (const schema of Object.values(data.schemas)) {
        delete (schema.$src as Record<string, unknown>).document;
      }
      declutterApiData(data);

      await verifyText(
        join(snapshotRootDir, 'core', spec.versionDir, spec.name, 'model.txt'),
        serializeValue(data) + '\n',
      );
    });
  }
});
```

- [ ] **Step 3: Add the tasks**

In `deno.json`, the `tasks` object already has `"test": "deno test -A"` and `"test:harness"`. Leave those, and every
other existing task, exactly as they are. Add these three new keys:

```json
    "test:unit": "deno test -A packages",
    "test:output": "GOAST_SNAPSHOT=write deno test -A test/output-tests",
    "test:output:check": "GOAST_SNAPSHOT=check deno test -A test/output-tests",
```

The `GOAST_SNAPSHOT=` prefix works on Windows as well as Linux because `deno task` runs its own cross-platform shell.

Do not add `--parallel` to any of them: `captureConsole` patches the global `console`.

- [ ] **Step 4: Confirm the working tree has LF-pinned assets before generating**

This is load-bearing. `copyAssetFile` copies asset bytes verbatim, and on a Windows checkout made before
`packages/*/assets/** text eol=lf` existed those files still hold CRLF in the working tree — `git add --renormalize`
fixes the index, not the worktree. Committing the baseline from such a tree would bake CRLF into snapshots that CI on
Linux then rejects.

```bash
git check-attr text eol -- packages/typescript/assets/client/fetch/fetch-client.utils.ts
```

Expected: `text: set` and `eol: lf`. Then confirm no CR bytes remain in the worktree:

```bash
grep -rlU $'\r' packages/kotlin/assets packages/typescript/assets
```

Expected: no output. If any file is listed, refresh those trees from the index and re-check:

```bash
rm -rf packages/kotlin/assets packages/typescript/assets
git checkout -- packages/kotlin/assets packages/typescript/assets
```

- [ ] **Step 5: Generate the baseline**

```bash
deno task test:output
```

Expected: PASS. Every test logs `snapshot updated …` lines. Report the test count.

- [ ] **Step 6: Sanity-check what was generated before committing it**

```bash
git status --porcelain test/output | wc -l
grep -rlU $'\r' test/output | head
```

Expected: a few thousand new paths, and **no** files containing CR bytes. Then confirm the shape matches the spec's
layout — profile directories per language, version directories inside, and `.state.txt` files beside the trees rather
than inside them:

```bash
ls test/output
ls test/output/kotlin/models@sb3/v3
```

Expected: the second listing shows spec directories alongside `<spec>.state.txt` files.

Confirm the `__test__` flag reached the generators, so state snapshots carry source provenance:

```bash
grep -l '__source__' test/output/kotlin/models@sb3/v3/*.state.txt
```

Expected: at least one match. No match means the registry's config is not reaching the generators, and the state
snapshots are less useful than the spec requires — stop and report it.

Also list the error snapshots, which record generator crashes:

```bash
find test/output -name '*.error.txt'
```

Report each one found with its content — these are committed statements that a generator fails on that input, and the
reviewer needs to see them. Do not attempt to fix the generators; that is out of scope for this task.

- [ ] **Step 7: Verify check mode agrees with what was just written**

```bash
deno task test:output:check
```

Expected: PASS. A failure here means generation is not deterministic across temp directories, which would be a real bug
— stop and report it rather than regenerating.

- [ ] **Step 8: Confirm fmt and lint ignore the tree**

```bash
deno fmt --check && deno lint
```

Expected: PASS. `test/output/**` is already excluded from both. If either reports files under `test/output`, the exclude
entries were disturbed — restore them rather than reformatting generated code.

- [ ] **Step 9: Commit, snapshots separately from code**

```bash
git add deno.json test/output-tests
git commit -m "feat(test): add tier 2 output driver and core model snapshots"
git add test/output
git commit -m "test: commit tier 2 snapshot baseline"
```

---

### Task 7: Orphan detection and documentation

Close the loop: prove `test/output/` holds exactly what the registry and corpus claim, and document the tier for
contributors. Task 1 already removed the legacy tests, so this task is the sweep plus the docs.

**Files:**

- Create: `test/harness/snapshot/orphans.ts`
- Create: `test/harness/snapshot/orphans.test.ts`
- Create: `test/output-tests/orphans.test.ts`
- Modify: `test/harness/snapshot/mod.ts`, `test/README.md`

**Interfaces:**

- Consumes: `snapshotRootDir` from `../paths.ts`.
- Produces:
  ```ts
  export function findOrphanSnapshots(root: string, expected: Iterable<string>): Promise<string[]>;
  ```
  where each expected entry and each returned path is relative to `root` with forward slashes, naming a snapshot base —
  a tree directory, a `.state.txt`, an `.error.txt`, or a `model.txt`.

- [ ] **Step 1: Write the failing test for orphan detection**

Create `test/harness/snapshot/orphans.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanSnapshots } from './orphans.ts';

async function withTree(
  files: string[],
  fn: (root: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'goast-orphans-' });
  try {
    for (const file of files) {
      const path = join(root, ...file.split('/'));
      await Deno.mkdir(join(path, '..'), { recursive: true });
      await Deno.writeTextFile(path, 'x');
    }
    await fn(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

describe('findOrphanSnapshots', () => {
  it('reports nothing when the tree matches expectations', async () => {
    await withTree(['kotlin/models/v3/spec/Model.kt', 'kotlin/models/v3/spec.state.txt'], async (root) => {
      const orphans = await findOrphanSnapshots(root, ['kotlin/models/v3/spec', 'kotlin/models/v3/spec.state.txt']);
      expect(orphans).toEqual([]);
    });
  });

  it('reports a tree directory no profile claims', async () => {
    await withTree(['kotlin/dropped/v3/spec/Model.kt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['kotlin/dropped/v3/spec']);
    });
  });

  it('reports a stale state file left by a renamed spec', async () => {
    await withTree(['kotlin/models/v3/old.state.txt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['kotlin/models/v3/old.state.txt']);
    });
  });

  it('reports orphans sorted', async () => {
    await withTree(['a/z.state.txt', 'a/b/spec/f.kt'], async (root) => {
      expect(await findOrphanSnapshots(root, [])).toEqual(['a/b/spec', 'a/z.state.txt']);
    });
  });

  it('returns nothing for a missing root', async () => {
    expect(await findOrphanSnapshots(join('does', 'not', 'exist'), [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
deno test -A test/harness/snapshot/orphans.test.ts
```

Expected: FAIL — `Module not found` for `./orphans.ts`.

- [ ] **Step 3: Implement orphan detection**

Create `test/harness/snapshot/orphans.ts`:

```ts
import { relative } from 'node:path';

import { walk } from '@std/fs/walk';

/**
 * Finds committed snapshots that nothing claims any more.
 *
 * `verifyProfile` prunes only within the directories it is handed, so a renamed spec or a dropped
 * config variant would otherwise leave its snapshot in place forever, quietly shrinking coverage
 * while every test stays green.
 *
 * A snapshot base is either a tree directory or a standalone snapshot file. Every file found under
 * `root` is attributed to a base — a file inside a claimed tree directory is not itself an orphan —
 * and the bases nothing claims are returned, sorted, relative to `root` with forward slashes.
 */
export async function findOrphanSnapshots(root: string, expected: Iterable<string>): Promise<string[]> {
  const claimed = new Set(expected);
  const orphans = new Set<string>();

  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
  if (!info.isDirectory) throw new Error(`Not a directory: ${root}`);

  for await (const entry of walk(root, { includeDirs: false, includeSymlinks: false })) {
    const path = relative(root, entry.path).replace(/\\/g, '/');
    if (claimed.has(path)) continue;

    const owner = findOwningBase(path, claimed);
    if (owner === undefined) orphans.add(orphanBase(path));
  }

  return [...orphans].sort();
}

/** The claimed tree directory a file belongs to, if any. */
function findOwningBase(path: string, claimed: Set<string>): string | undefined {
  const segments = path.split('/');
  for (let i = segments.length - 1; i > 0; i--) {
    const candidate = segments.slice(0, i).join('/');
    if (claimed.has(candidate)) return candidate;
  }
  return undefined;
}

/**
 * The base to report for an unclaimed file: the file itself when it is a standalone snapshot,
 * otherwise the directory that would have been its tree.
 */
function orphanBase(path: string): string {
  const segments = path.split('/');
  const name = segments[segments.length - 1];
  if (name.endsWith('.state.txt') || name.endsWith('.error.txt')) return path;
  return segments.slice(0, -1).join('/');
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
deno test -A test/harness/snapshot/orphans.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire the sweep over the real tree**

Create `test/output-tests/orphans.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { discoverSpecs, findOrphanSnapshots, snapshotRootDir } from '@goast/test-harness';

import { profiles } from './profiles.ts';

describe('snapshot tree', () => {
  it('holds exactly what the registry and corpus claim', async () => {
    const specs = await discoverSpecs();
    const claimed: string[] = [];

    for (const profile of profiles) {
      for (const spec of specs) {
        if (profile.versions !== 'all' && !profile.versions.includes(spec.versionDir)) continue;
        const base = `${profile.language}/${profile.name}/${spec.versionDir}/${spec.name}`;
        claimed.push(base, `${base}.state.txt`, `${base}.error.txt`);
      }
    }
    for (const spec of specs) {
      claimed.push(`core/${spec.versionDir}/${spec.name}`);
    }

    const orphans = await findOrphanSnapshots(snapshotRootDir, claimed);

    expect(orphans).toEqual([]);
  });
});
```

- [ ] **Step 6: Run it**

```bash
deno test -A test/output-tests/orphans.test.ts
```

Expected: PASS. If it lists orphans, they are real leftovers from Task 6 — delete them with `git rm -r` and note which,
rather than widening the claimed set to hide them.

- [ ] **Step 7: Export it and verify the whole suite**

Add `export * from './orphans.ts';` to `test/harness/snapshot/mod.ts`, keeping alphabetical order.

```bash
deno test -A && deno fmt --check && deno lint && deno task npm && deno install --frozen
```

Expected: PASS throughout, with `[dnt] Complete!` for each of the four packages.

- [ ] **Step 8: Rewrite the tier documentation**

Update `test/README.md`. It currently documents tier 2 as planned rather than built. Change:

- the tier table's status column, marking tier 2 implemented and naming `deno task test:output`
- the layout section, replacing `test/openapi-files/` with `test/specs/` and adding `test/output-tests/`
- a new section documenting the three snapshot forms — tree, `.state.txt`, `.error.txt` — stating that a
  profile-and-spec pair has exactly one of the two forms, and that an `.error.txt` is a committed statement that a
  generator fails on that input
- a "how to add a spec" section: drop a file in `test/specs/<version>/`, run `deno task test:output`, commit the
  generated tree; a *directory* there is one spec whose files parse together
- a "how to add a profile" section: one entry in `test/output-tests/profiles.ts`, then `deno task test:output`
- a note that tasks must be run from the repo root, because `getSourceDocLine` emits cwd-relative paths, so a different
  cwd would silently produce different snapshots
- a note that test files run sequentially and `--parallel` must not be added, because `captureConsole` patches the
  global `console`

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(test): add orphan sweep, remove legacy verify tests, document tier 2"
```

---

## Handoff

Phase 2b widens the corpus from 14 specs to roughly 45, in category batches, each batch regenerating trees. Nothing in
this plan needs to change for that: adding a spec is dropping a file in `test/specs/<version>/`.

Two things phase 2b should expect. Every new spec multiplies by 15 profiles, so a batch of 8 specs adds on the order of
1000 committed files — keep batches to one category per commit so review stays tractable. And a wide corpus will
produce more `.error.txt` files; each one is a decision, either "this generator has a bug, fix it" or "this input is
genuinely unsupported, and the committed error says so".
