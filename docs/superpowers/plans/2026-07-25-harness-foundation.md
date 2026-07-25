# Harness Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the snapshot engine that tier 2 output tests will run on, and rename the test support package to match
its new role.

**Architecture:** A new `test/harness/snapshot/` module compares a freshly generated directory tree against a committed
one. It resolves a write/check mode from the environment, diffs two `Map<relPath, bytes>` trees, and either applies the
diff to the committed tree (write) or throws a readable report (check). Existing helpers in `test/utils/` move to
`test/harness/` unchanged; nothing is deleted in this phase, so the repo stays green throughout.

**Tech Stack:** Deno 2.8.2, `@std/fs`, `@std/bytes`, `@std/expect`, `@std/testing/bdd`.

**Spec:** `docs/superpowers/specs/2026-07-25-testing-strategy-design.md` (phase 1)

## Global Constraints

- Deno version is pinned to **v2.8.2**. Deno 2.8.3 regressed `export =` default-import type resolution (e.g.
  `import fs from 'fs-extra'`), breaking type-checking repo-wide. Do not bump it.
- Prerequisites are **Deno and Docker only**. This phase adds no other toolchain and needs no Docker.
- Source formatting is enforced by `deno fmt`: **line width 120, single quotes**. Run `deno fmt` before every commit.
- All snapshot comparison is **byte-exact**. Never strip `\r` — a stray carriage return in a snapshot is a real bug, not
  noise.
- Generators always run with `newLine: '\n'`.
- Tests use `describe`/`it` from `@std/testing/bdd` and `expect` from `@std/expect` (never `@std/expect/expect`).
- Never use `EOL` from `node:os` in a test. Use literal `\n`, so tests do not depend on host OS.
- **Two deliberate deviations from the spec, already agreed:** `docker.ts` is deferred to phase 3 (no consumer until
  then), and the harness does not emit `snapshot.patch` (CI generates it by re-running in write mode and running
  `git diff`). Consequently `test/.snapshot-actual/` is never created.

## File Structure

**Moved unchanged (Task 1):**

| From                         | To                             | Responsibility                                                               |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `test/utils/deno.json`       | `test/harness/deno.json`       | Workspace member manifest, renamed to `@goast/test-harness`                  |
| `test/utils/mod.ts`          | `test/harness/mod.ts`          | Public barrel                                                                |
| `test/utils/paths.ts`        | `test/harness/paths.ts`        | Repo root and spec directory paths                                           |
| `test/utils/string.utils.ts` | `test/harness/string.utils.ts` | `normalizeEOL`                                                               |
| `test/utils/types.ts`        | `test/harness/types.ts`        | `OpenApiVersion`                                                             |
| `test/utils/declutter.ts`    | `test/harness/declutter.ts`    | Strips noise from parsed `ApiData`                                           |
| `test/utils/verify.ts`       | `test/harness/verify.ts`       | Legacy snapshot helper. Kept so existing tests pass; **phase 2 deletes it.** |

**Created:**

| File                                        | Responsibility                                                 |
| ------------------------------------------- | -------------------------------------------------------------- |
| `test/harness/snapshot/mode.ts`             | Resolve `write` vs `check` from the environment                |
| `test/harness/snapshot/tree.ts`             | Read a directory into `FileTree`; diff two trees; apply a diff |
| `test/harness/snapshot/text-diff.ts`        | Locate the first differing line between two byte buffers       |
| `test/harness/snapshot/normalize.ts`        | Rewrite absolute repo paths to `<root>/…`                      |
| `test/harness/snapshot/verify-file-tree.ts` | `verifyFileTree` — the file-tree snapshot entry point          |
| `test/harness/snapshot/verify-text.ts`      | `verifyText` — the text snapshot entry point                   |
| `test/harness/snapshot/mod.ts`              | Barrel for the snapshot module                                 |
| `.gitattributes`                            | Force LF and `linguist-generated` on `test/output/**`          |
| `test/README.md`                            | Contributor documentation for the harness                      |

Each file has one responsibility and its own colocated `.test.ts`. `verify.ts` is refactored once, in Task 6, to import
`normalizePaths` from `normalize.ts` instead of holding its own copy.

---

### Task 1: Rename `test/utils` to `test/harness` as `@goast/test-harness`

Pure refactor. No behaviour changes. The existing test suite passing _is_ the test for this task.

**Files:**

- Move: `test/utils/` → `test/harness/` (7 files)
- Modify: `test/harness/deno.json` (package name)
- Modify: `deno.json` (workspace list, `npm:test-utils` task)
- Modify: `packages/core/deno.json`, `packages/kotlin/deno.json`, `packages/typescript/deno.json` (`usedLocalPackages`)
- Modify: `scripts/build_npm.ts:~150` (`removeTestRelatedDependencies` list)
- Modify: 15 test files importing `@goast/test-utils`

**Interfaces:**

- Produces: the module specifier `@goast/test-harness`, exporting exactly what `@goast/test-utils` exported today —
  `verify`, `MultipartData`, `normalizeEOL`, `declutterApiData`, `repoRootDir`, `openApiV2FilesDir`,
  `openApiV3FilesDir`, `openApiV3_1FilesDir`, `OpenApiVersion`.

- [ ] **Step 1: Confirm the baseline is green**

Run: `deno task test` Expected: PASS. If it already fails, stop and report — do not proceed with a rename on a red
baseline.

- [ ] **Step 2: Move the directory**

```bash
git mv test/utils test/harness
```

- [ ] **Step 3: Rename the package in its manifest**

In `test/harness/deno.json`, change the `name` field:

```json
{
  "name": "@goast/test-harness",
  "version": "0.0.0-beta0",
  "exports": "./mod.ts",
  "goastNpmOptions": {
    "shimDeno": true,
    "noReadme": true,
    "private": true
  }
}
```

- [ ] **Step 4: Update every reference to the old name and path**

```bash
grep -rl "@goast/test-utils" --include="*.ts" --include="*.json" packages test scripts \
  | xargs sed -i "s|@goast/test-utils|@goast/test-harness|g"
grep -rl '"test/utils"' --include="*.json" . --exclude-dir=npm \
  | xargs sed -i 's|"test/utils"|"test/harness"|g'
```

Then in the root `deno.json`, rename the npm task key and its argument:

```json
"npm:test-harness": "deno run -A scripts/build_npm.ts test/harness",
```

and update the aggregate `npm` task to call `deno task npm:test-harness` instead of `deno task npm:test-utils`.

- [ ] **Step 5: Verify no stale references remain**

```bash
grep -rn "test-utils\|test/utils" --include="*.ts" --include="*.json" --include="*.yml" . --exclude-dir=npm --exclude-dir=.git
```

Expected: no output. If anything matches, fix it before continuing.

- [ ] **Step 6: Verify the suite still passes**

```bash
deno fmt
deno lint
deno task test
```

Expected: all PASS, with the same test count as Step 1.

- [ ] **Step 7: Verify the npm build still works**

Run: `deno task npm:test-harness` Expected: exits 0, and `npm/@goast/test-harness/package.json` exists.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: rename @goast/test-utils to @goast/test-harness"
```

---

### Task 2: Snapshot mode resolution

**Files:**

- Create: `test/harness/snapshot/mode.ts`
- Test: `test/harness/snapshot/mode.test.ts`
- Modify: `deno.json` (`test.include`, `test.exclude`)

**Interfaces:**

- Produces:
  - `type SnapshotMode = 'write' | 'check'`
  - `type VerifyOptions = { mode?: SnapshotMode }` — shared by both verify entry points. It lives here rather than
    beside either one, so `verify-text.ts` and `verify-file-tree.ts` stay independent of each other.
  - `function resolveSnapshotMode(get?: (key: string) => string | undefined): SnapshotMode` — `get` defaults to
    `Deno.env.get` and exists so tests can inject an environment without mutating the process.

- [ ] **Step 1: Widen test discovery so `test/` is included**

`deno.json`'s `test.include` is currently `["/packages/*"]`, which excludes everything under `test/`. Replace the whole
`test` block:

```json
"test": {
  "include": ["packages", "test"],
  "exclude": ["test/output"]
},
```

The `exclude` matters because `test/output/` will later hold generated TypeScript that must never be treated as a test
file.

- [ ] **Step 2: Write the failing test**

Create `test/harness/snapshot/mode.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { resolveSnapshotMode } from './mode.ts';

function env(vars: Record<string, string>): (key: string) => string | undefined {
  return (key) => vars[key];
}

describe('resolveSnapshotMode', () => {
  it('should default to write mode when nothing is set', () => {
    expect(resolveSnapshotMode(env({}))).toBe('write');
  });

  it('should default to check mode when CI is set', () => {
    expect(resolveSnapshotMode(env({ CI: 'true' }))).toBe('check');
  });

  it('should not treat a falsy CI value as CI', () => {
    expect(resolveSnapshotMode(env({ CI: 'false' }))).toBe('write');
    expect(resolveSnapshotMode(env({ CI: '0' }))).toBe('write');
    expect(resolveSnapshotMode(env({ CI: '' }))).toBe('write');
  });

  it('should let GOAST_SNAPSHOT override the CI default', () => {
    expect(resolveSnapshotMode(env({ CI: 'true', GOAST_SNAPSHOT: 'write' }))).toBe('write');
    expect(resolveSnapshotMode(env({ GOAST_SNAPSHOT: 'check' }))).toBe('check');
  });

  it('should throw on an invalid GOAST_SNAPSHOT value', () => {
    expect(() => resolveSnapshotMode(env({ GOAST_SNAPSHOT: 'yes' }))).toThrow(
      'Invalid GOAST_SNAPSHOT value: "yes". Expected "write" or "check".',
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/mode.test.ts` Expected: FAIL — module `./mode.ts` not found.

- [ ] **Step 4: Write the implementation**

Create `test/harness/snapshot/mode.ts`:

```ts
/** Whether a mismatching snapshot is rewritten on disk or reported as a failure. */
export type SnapshotMode = 'write' | 'check';

/** Common options for the snapshot verification entry points. */
export type VerifyOptions = {
  /** Overrides the mode resolved from the environment. */
  mode?: SnapshotMode;
};

const FALSY_ENV_VALUES = new Set(['', '0', 'false']);

/**
 * Resolves the snapshot mode from the environment.
 *
 * `GOAST_SNAPSHOT` wins when set. Otherwise the mode is `check` on CI and `write` everywhere else,
 * so that a local run updates snapshots and CI fails on drift.
 *
 * @param get Reads an environment variable. Injectable for tests.
 */
export function resolveSnapshotMode(
  get: (key: string) => string | undefined = (key) => Deno.env.get(key),
): SnapshotMode {
  const explicit = get('GOAST_SNAPSHOT');
  if (explicit === 'write' || explicit === 'check') return explicit;
  if (explicit !== undefined && explicit !== '') {
    throw new Error(`Invalid GOAST_SNAPSHOT value: "${explicit}". Expected "write" or "check".`);
  }

  const ci = get('CI');
  return ci !== undefined && !FALSY_ENV_VALUES.has(ci) ? 'check' : 'write';
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/mode.test.ts` Expected: PASS, 5 tests.

- [ ] **Step 6: Verify discovery picked up the new test**

Run: `deno task test` Expected: PASS, and the output includes `test/harness/snapshot/mode.test.ts`. If it does not
appear, the `test.include` change in Step 1 did not take effect.

- [ ] **Step 7: Commit**

```bash
deno fmt
git add deno.json test/harness/snapshot/mode.ts test/harness/snapshot/mode.test.ts
git commit -m "feat(harness): add snapshot mode resolution"
```

---

### Task 3: File tree reading and diffing

**Files:**

- Create: `test/harness/snapshot/tree.ts`
- Test: `test/harness/snapshot/tree.test.ts`
- Modify: `deno.json` (add `@std/bytes` import)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `type FileTree = Map<string, Uint8Array>` — keys are paths relative to the tree root, always `/`-separated.
  - `type TreeDiff = { added: string[]; changed: string[]; removed: string[] }` — each list sorted.
  - `function readFileTree(root: string): Promise<FileTree>` — returns an empty tree when `root` does not exist.
  - `function diffFileTrees(expected: FileTree, actual: FileTree): TreeDiff`
  - `function isEmptyDiff(diff: TreeDiff): boolean`
  - `function formatDiffCounts(diff: TreeDiff): string` — e.g. `+3 ~1 -0`
  - `function applyTreeDiff(root: string, actual: FileTree, diff: TreeDiff): Promise<void>`

- [ ] **Step 1: Add the `@std/bytes` dependency**

In `deno.json`, add to `imports` (keep the block alphabetically tidy — it goes directly before `@std/expect`):

```json
"@std/bytes": "jsr:@std/bytes@^1.0.5",
```

Then update the lockfile:

```bash
deno install
```

Expected: `deno.lock` is modified. CI runs `deno install --frozen`, so an un-updated lockfile fails the build.

- [ ] **Step 2: Write the failing test**

Create `test/harness/snapshot/tree.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { applyTreeDiff, diffFileTrees, type FileTree, formatDiffCounts, isEmptyDiff, readFileTree } from './tree.ts';

const encoder = new TextEncoder();

function tree(files: Record<string, string>): FileTree {
  return new Map(Object.entries(files).map(([path, content]) => [path, encoder.encode(content)]));
}

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-tree-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function writeTree(dir: string, files: Record<string, string>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const target = join(dir, path);
    await Deno.mkdir(join(target, '..'), { recursive: true });
    await Deno.writeTextFile(target, content);
  }
}

describe('readFileTree', () => {
  it('should return an empty tree for a missing directory', async () => {
    const result = await readFileTree(join('does', 'not', 'exist'));
    expect(result.size).toBe(0);
  });

  it('should read files recursively with forward-slash relative keys', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'a.txt': 'A', 'nested/deep/b.txt': 'B' });
      const result = await readFileTree(dir);
      expect([...result.keys()].sort()).toEqual(['a.txt', 'nested/deep/b.txt']);
      expect(new TextDecoder().decode(result.get('nested/deep/b.txt'))).toBe('B');
    });
  });

  it('should preserve carriage returns instead of normalizing them', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'a.txt': 'one\r\ntwo' });
      const result = await readFileTree(dir);
      expect(new TextDecoder().decode(result.get('a.txt'))).toBe('one\r\ntwo');
    });
  });
});

describe('diffFileTrees', () => {
  it('should report an empty diff for identical trees', () => {
    const diff = diffFileTrees(tree({ 'a.txt': 'A' }), tree({ 'a.txt': 'A' }));
    expect(diff).toEqual({ added: [], changed: [], removed: [] });
    expect(isEmptyDiff(diff)).toBe(true);
  });

  it('should classify added, changed and removed files', () => {
    const diff = diffFileTrees(
      tree({ 'keep.txt': 'K', 'change.txt': 'old', 'gone.txt': 'G' }),
      tree({ 'keep.txt': 'K', 'change.txt': 'new', 'fresh.txt': 'F' }),
    );
    expect(diff).toEqual({ added: ['fresh.txt'], changed: ['change.txt'], removed: ['gone.txt'] });
    expect(isEmptyDiff(diff)).toBe(false);
  });

  it('should sort each list', () => {
    const diff = diffFileTrees(tree({}), tree({ 'b.txt': 'B', 'a.txt': 'A' }));
    expect(diff.added).toEqual(['a.txt', 'b.txt']);
  });

  it('should treat a trailing-newline-only change as changed', () => {
    const diff = diffFileTrees(tree({ 'a.txt': 'A' }), tree({ 'a.txt': 'A\n' }));
    expect(diff.changed).toEqual(['a.txt']);
  });
});

describe('formatDiffCounts', () => {
  it('should format the three counts', () => {
    expect(formatDiffCounts({ added: ['a', 'b'], changed: ['c'], removed: [] })).toBe('+2 ~1 -0');
  });
});

describe('applyTreeDiff', () => {
  it('should write added and changed files and delete removed ones', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'change.txt': 'old', 'gone.txt': 'G' });
      const actual = tree({ 'change.txt': 'new', 'nested/fresh.txt': 'F' });
      const diff = diffFileTrees(await readFileTree(dir), actual);

      await applyTreeDiff(dir, actual, diff);

      expect(await readFileTree(dir)).toEqual(actual);
    });
  });

  it('should remove directories left empty by deletions', async () => {
    await withTempDir(async (dir) => {
      await writeTree(dir, { 'keep.txt': 'K', 'dead/branch/gone.txt': 'G' });
      const actual = tree({ 'keep.txt': 'K' });
      const diff = diffFileTrees(await readFileTree(dir), actual);

      await applyTreeDiff(dir, actual, diff);

      expect(await readFileTree(dir)).toEqual(actual);
      await expect(Deno.stat(join(dir, 'dead'))).rejects.toThrow(Deno.errors.NotFound);
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/tree.test.ts` Expected: FAIL — module `./tree.ts` not found.

- [ ] **Step 4: Write the implementation**

Create `test/harness/snapshot/tree.ts`:

```ts
import { dirname, join, relative } from 'node:path';

import { equals } from '@std/bytes';
import { ensureDir, walk } from '@std/fs';

/** A directory tree flattened to relative, forward-slash-separated paths and raw file contents. */
export type FileTree = Map<string, Uint8Array>;

/** The difference between a committed snapshot tree and a freshly generated one. */
export type TreeDiff = {
  /** Present in the generated tree, absent from the snapshot. */
  added: string[];
  /** Present in both, with differing bytes. */
  changed: string[];
  /** Present in the snapshot, absent from the generated tree. */
  removed: string[];
};

/** Reads a directory into a {@link FileTree}. A missing directory yields an empty tree. */
export async function readFileTree(root: string): Promise<FileTree> {
  const tree: FileTree = new Map();

  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(root);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return tree;
    throw error;
  }
  if (!info.isDirectory) throw new Error(`Not a directory: ${root}`);

  for await (const entry of walk(root, { includeDirs: false, includeSymlinks: false })) {
    tree.set(toRelativeKey(root, entry.path), await Deno.readFile(entry.path));
  }
  return tree;
}

/** Compares two trees byte-for-byte. */
export function diffFileTrees(expected: FileTree, actual: FileTree): TreeDiff {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];

  for (const [path, actualBytes] of actual) {
    const expectedBytes = expected.get(path);
    if (expectedBytes === undefined) {
      added.push(path);
    } else if (!equals(expectedBytes, actualBytes)) {
      changed.push(path);
    }
  }
  for (const path of expected.keys()) {
    if (!actual.has(path)) removed.push(path);
  }

  return { added: added.sort(), changed: changed.sort(), removed: removed.sort() };
}

export function isEmptyDiff(diff: TreeDiff): boolean {
  return diff.added.length === 0 && diff.changed.length === 0 && diff.removed.length === 0;
}

export function formatDiffCounts(diff: TreeDiff): string {
  return `+${diff.added.length} ~${diff.changed.length} -${diff.removed.length}`;
}

/** Makes the snapshot tree at `root` byte-identical to `actual`. */
export async function applyTreeDiff(root: string, actual: FileTree, diff: TreeDiff): Promise<void> {
  for (const path of [...diff.added, ...diff.changed]) {
    const target = join(root, path);
    await ensureDir(dirname(target));
    await Deno.writeFile(target, actual.get(path)!);
  }
  for (const path of diff.removed) {
    await Deno.remove(join(root, path));
  }
  if (diff.removed.length > 0) {
    await removeEmptyDirs(root);
  }
}

function toRelativeKey(root: string, path: string): string {
  return relative(root, path).replace(/\\/g, '/');
}

/** Removes directories that deletions left empty. Returns true when `dir` itself was removed. */
async function removeEmptyDirs(dir: string): Promise<boolean> {
  let childCount = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isDirectory && await removeEmptyDirs(join(dir, entry.name))) continue;
    childCount++;
  }
  if (childCount > 0) return false;
  await Deno.remove(dir);
  return true;
}
```

Note the guard in `applyTreeDiff`: `removeEmptyDirs` would delete the snapshot root itself if the tree ever became
empty, so it runs only when something was actually removed. Task 4 adds the stronger rail that stops an empty generation
reaching this code at all.

- [ ] **Step 5: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/tree.test.ts` Expected: PASS, 10 tests.

- [ ] **Step 6: Commit**

```bash
deno fmt
git add deno.json deno.lock test/harness/snapshot/tree.ts test/harness/snapshot/tree.test.ts
git commit -m "feat(harness): add file tree reading and diffing"
```

---

### Task 4: `verifyFileTree` write mode

**Files:**

- Create: `test/harness/snapshot/verify-file-tree.ts`
- Create: `.gitattributes`
- Test: `test/harness/snapshot/verify-file-tree.test.ts`
- Modify: `deno.json` (`fmt.exclude`, `lint.exclude`)

**Interfaces:**

- Consumes: `resolveSnapshotMode`, `VerifyOptions` from `./mode.ts`; `applyTreeDiff`, `diffFileTrees`,
  `formatDiffCounts`, `isEmptyDiff`, `readFileTree` from `./tree.ts`.
- Produces:
  - `function verifyFileTree(snapshotDir: string, generate: (outputDir: string) => Promise<void> | void, options?: VerifyOptions): Promise<void>`

- [ ] **Step 1: Protect the committed output tree in git**

Create `.gitattributes` at the repo root:

```
# Generated snapshot trees. Diffs are collapsed by default on GitHub but stay
# expandable, and line endings must be LF so a Windows checkout matches what CI
# validates on Linux.
test/output/** text eol=lf
test/output/** linguist-generated=true
```

- [ ] **Step 2: Exclude the committed output tree from fmt and lint**

Snapshots are compared byte-exactly, so a formatter rewriting them would fight the harness. In `deno.json`, add
`"test/output/**"` to both exclude lists:

```json
"fmt": {
  "lineWidth": 120,
  "singleQuote": true,
  "exclude": ["npm/**/*", "out/**/*", "coverage/**/*", ".verify/**/*", "test/output/**"]
},
"lint": {
  "exclude": [
    "npm/**/*",
    "out/**/*",
    "coverage/**/*",
    ".verify/**/*",
    "test/output/**",
    "playground.ts",
    "**/assets/**/*"
  ]
},
```

Leave the `.verify/**` entries alone — the legacy snapshots still exist until phase 2 removes them.

- [ ] **Step 3: Write the failing test**

Create `test/harness/snapshot/verify-file-tree.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { readFileTree } from './tree.ts';
import { verifyFileTree } from './verify-file-tree.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-verify-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** A generate callback that writes a fixed set of files. */
function generator(files: Record<string, string>): (outputDir: string) => Promise<void> {
  return async (outputDir) => {
    for (const [path, content] of Object.entries(files)) {
      const target = join(outputDir, path);
      await Deno.mkdir(join(target, '..'), { recursive: true });
      await Deno.writeTextFile(target, content);
    }
  };
}

async function readAsText(dir: string): Promise<Record<string, string>> {
  const decoder = new TextDecoder();
  return Object.fromEntries([...await readFileTree(dir)].map(([path, bytes]) => [path, decoder.decode(bytes)]));
}

describe('verifyFileTree', () => {
  describe('write mode', () => {
    it('should create the snapshot when it does not exist yet', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');

        await verifyFileTree(snapshotDir, generator({ 'api/pets.ts': 'export const a = 1;\n' }), { mode: 'write' });

        expect(await readAsText(snapshotDir)).toEqual({ 'api/pets.ts': 'export const a = 1;\n' });
      });
    });

    it('should overwrite changed files and delete stale ones', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'keep.ts': 'K', 'stale.ts': 'S' }), { mode: 'write' });

        await verifyFileTree(snapshotDir, generator({ 'keep.ts': 'K2', 'new.ts': 'N' }), { mode: 'write' });

        expect(await readAsText(snapshotDir)).toEqual({ 'keep.ts': 'K2', 'new.ts': 'N' });
      });
    });

    it('should pass without touching disk when nothing changed', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });
        const before = (await Deno.stat(join(snapshotDir, 'a.ts'))).mtime;

        await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

        expect((await Deno.stat(join(snapshotDir, 'a.ts'))).mtime).toEqual(before);
      });
    });

    it('should refuse to prune the snapshot when generation produced no files', async () => {
      await withTempDir(async (dir) => {
        const snapshotDir = join(dir, 'snapshot');
        await verifyFileTree(snapshotDir, generator({ 'precious.ts': 'P' }), { mode: 'write' });

        await expect(verifyFileTree(snapshotDir, generator({}), { mode: 'write' })).rejects.toThrow(
          'produced no files',
        );

        expect(await readAsText(snapshotDir)).toEqual({ 'precious.ts': 'P' });
      });
    });

    it('should clean up its temporary directory even when generation throws', async () => {
      await withTempDir(async (dir) => {
        const tempDirs: string[] = [];

        await expect(
          verifyFileTree(join(dir, 'snapshot'), (outputDir) => {
            tempDirs.push(outputDir);
            throw new Error('generator exploded');
          }, { mode: 'write' }),
        ).rejects.toThrow('generator exploded');

        expect(tempDirs).toHaveLength(1);
        await expect(Deno.stat(tempDirs[0])).rejects.toThrow(Deno.errors.NotFound);
      });
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/verify-file-tree.test.ts` Expected: FAIL — module `./verify-file-tree.ts` not
found.

- [ ] **Step 5: Write the implementation**

Create `test/harness/snapshot/verify-file-tree.ts`:

```ts
import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { applyTreeDiff, diffFileTrees, formatDiffCounts, isEmptyDiff, readFileTree } from './tree.ts';

/**
 * Compares the tree produced by `generate` against the committed snapshot at `snapshotDir`.
 *
 * In `write` mode the snapshot is updated to match and the check passes, so the change surfaces as a
 * regular git diff. In `check` mode a mismatch throws.
 *
 * @param snapshotDir Directory holding the committed snapshot.
 * @param generate Writes the generated files into the directory it is handed.
 */
export async function verifyFileTree(
  snapshotDir: string,
  generate: (outputDir: string) => Promise<void> | void,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const outputDir = await Deno.makeTempDir({ prefix: 'goast-snapshot-' });

  try {
    await generate(outputDir);
    const actual = await readFileTree(outputDir);

    // Safety rail: a generator that throws early or silently emits nothing must not be able to
    // delete a committed snapshot in write mode.
    if (actual.size === 0) {
      throw new Error(
        `Generation produced no files for snapshot "${snapshotDir}". Refusing to continue, ` +
          `because write mode would delete the entire snapshot.`,
      );
    }

    const expected = await readFileTree(snapshotDir);
    const diff = diffFileTrees(expected, actual);
    if (isEmptyDiff(diff)) return;

    if (mode === 'check') {
      throw new Error(`Snapshot mismatch: ${snapshotDir} (${formatDiffCounts(diff)})`);
    }

    await applyTreeDiff(snapshotDir, actual, diff);
    console.info(`snapshot updated ${snapshotDir}: ${formatDiffCounts(diff)}`);
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
}
```

The check-mode message is intentionally a one-liner here; Task 5 replaces it with the full report.

- [ ] **Step 6: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/verify-file-tree.test.ts` Expected: PASS, 5 tests.

- [ ] **Step 7: Verify fmt and lint still pass with the new excludes**

```bash
deno fmt --check
deno lint
```

Expected: both PASS. `test/output/` does not exist yet, so the new exclude patterns must be inert rather than erroneous.

- [ ] **Step 8: Commit**

```bash
deno fmt
git add .gitattributes deno.json test/harness/snapshot/verify-file-tree.ts test/harness/snapshot/verify-file-tree.test.ts
git commit -m "feat(harness): add verifyFileTree write mode"
```

---

### Task 5: First-difference reporting and `verifyFileTree` check mode

**Files:**

- Create: `test/harness/snapshot/text-diff.ts`
- Test: `test/harness/snapshot/text-diff.test.ts`
- Modify: `test/harness/snapshot/verify-file-tree.ts` (replace the one-line check-mode error)
- Modify: `test/harness/snapshot/verify-file-tree.test.ts` (add check-mode tests)

**Interfaces:**

- Consumes: `TreeDiff`, `FileTree` from `./tree.ts`.
- Produces:
  - `type TextDifference = { lineNumber: number; before: string[]; expected: string | undefined; actual: string | undefined; after: string[] }`
    — `lineNumber` is 1-based; `expected`/`actual` are `undefined` when that side ran out of lines.
  - `function firstTextDifference(expected: Uint8Array, actual: Uint8Array, contextLines?: number): TextDifference | 'binary' | null`
    — `'binary'` when either side contains a NUL byte, `null` when the buffers are equal. `contextLines` defaults to 3.
  - `function formatDifferenceExcerpt(difference: TextDifference): string[]` — renders the gutter-numbered `-`/`+`
    excerpt. Task 6's `verifyText` reuses this; it must not grow a second copy of the padding logic.
  - `function formatMismatchReport(snapshotDir: string, diff: TreeDiff, expected: FileTree, actual: FileTree): string`

- [ ] **Step 1: Write the failing test for `firstTextDifference`**

Create `test/harness/snapshot/text-diff.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { firstTextDifference } from './text-diff.ts';

const encode = (text: string) => new TextEncoder().encode(text);

describe('firstTextDifference', () => {
  it('should return null for identical buffers', () => {
    expect(firstTextDifference(encode('same'), encode('same'))).toBeNull();
  });

  it('should report the first differing line with surrounding context', () => {
    const expected = encode('a\nb\nc\nOLD\ne\nf\ng\n');
    const actual = encode('a\nb\nc\nNEW\ne\nf\ng\n');

    expect(firstTextDifference(expected, actual)).toEqual({
      lineNumber: 4,
      before: ['a', 'b', 'c'],
      expected: 'OLD',
      actual: 'NEW',
      after: ['e', 'f', 'g'],
    });
  });

  it('should clamp context at the start and end of the file', () => {
    expect(firstTextDifference(encode('OLD\nb'), encode('NEW\nb'))).toEqual({
      lineNumber: 1,
      before: [],
      expected: 'OLD',
      actual: 'NEW',
      after: ['b'],
    });
  });

  it('should report an undefined side when a file has extra trailing lines', () => {
    expect(firstTextDifference(encode('a\n'), encode('a\nextra\n'))).toEqual({
      lineNumber: 2,
      before: ['a'],
      expected: '',
      actual: 'extra',
      after: [''],
    });

    expect(firstTextDifference(encode('a\nb'), encode('a'))).toEqual({
      lineNumber: 2,
      before: ['a'],
      expected: 'b',
      actual: undefined,
      after: [],
    });
  });

  it('should detect a carriage-return-only difference', () => {
    const result = firstTextDifference(encode('a\r\nb'), encode('a\nb'));
    expect(result).toEqual({
      lineNumber: 1,
      before: [],
      expected: 'a\r',
      actual: 'a',
      after: ['b'],
    });
  });

  it('should report binary buffers instead of diffing them', () => {
    expect(firstTextDifference(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1, 3]))).toBe('binary');
  });
});
```

Note the third case: splitting `'a\n'` on `\n` yields `['a', '']`, so the trailing empty line is a real line and the
difference is at line 2. The assertions encode that deliberately.

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/text-diff.test.ts` Expected: FAIL — module `./text-diff.ts` not found.

- [ ] **Step 3: Write `text-diff.ts`**

```ts
import type { FileTree, TreeDiff } from './tree.ts';

/** The first place two text files diverge, with a few lines of context on either side. */
export type TextDifference = {
  /** 1-based line number of the divergence. */
  lineNumber: number;
  /** Context lines immediately before the divergence. */
  before: string[];
  /** The expected line, or `undefined` when the expected side ended. */
  expected: string | undefined;
  /** The actual line, or `undefined` when the actual side ended. */
  actual: string | undefined;
  /** Context lines immediately after the divergence, taken from the actual side. */
  after: string[];
};

/** Maximum files to detail in a mismatch report before summarising the rest. */
const MAX_DETAILED_FILES = 3;

/**
 * Locates the first differing line between two buffers.
 *
 * Returns `null` when they are byte-identical and `'binary'` when either side contains a NUL byte,
 * in which case a line diff would be meaningless.
 */
export function firstTextDifference(
  expected: Uint8Array,
  actual: Uint8Array,
  contextLines = 3,
): TextDifference | 'binary' | null {
  if (expected.includes(0) || actual.includes(0)) return 'binary';

  const decoder = new TextDecoder();
  const expectedLines = decoder.decode(expected).split('\n');
  const actualLines = decoder.decode(actual).split('\n');

  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i++) {
    if (expectedLines[i] === actualLines[i]) continue;
    return {
      lineNumber: i + 1,
      before: actualLines.slice(Math.max(0, i - contextLines), i),
      expected: expectedLines[i],
      actual: actualLines[i],
      after: actualLines.slice(i + 1, i + 1 + contextLines),
    };
  }
  return null;
}

/** Builds the human-readable failure message for a check-mode mismatch. */
export function formatMismatchReport(
  snapshotDir: string,
  diff: TreeDiff,
  expected: FileTree,
  actual: FileTree,
): string {
  const lines: string[] = [`Snapshot mismatch: ${snapshotDir}`, ''];

  for (const path of diff.added) lines.push(`  + ${path}`);
  for (const path of diff.changed) lines.push(`  ~ ${path}`);
  for (const path of diff.removed) lines.push(`  - ${path}`);

  const detailed = diff.changed.slice(0, MAX_DETAILED_FILES);
  for (const path of detailed) {
    lines.push('', ...formatFileDifference(path, expected.get(path)!, actual.get(path)!));
  }
  if (diff.changed.length > detailed.length) {
    lines.push('', `  ... and ${diff.changed.length - detailed.length} more changed file(s)`);
  }

  lines.push('', 'Run `deno task test:output` to update the snapshot, then commit the result.');
  return lines.join('\n');
}

/**
 * Renders a {@link TextDifference} as gutter-numbered context lines, with the expected line marked
 * `-` and the actual line marked `+`.
 */
export function formatDifferenceExcerpt(difference: TextDifference): string[] {
  const { lineNumber, before, after } = difference;
  const gutter = String(lineNumber + after.length).length;
  const pad = (n: number) => String(n).padStart(gutter, ' ');

  const lines: string[] = [];
  before.forEach((line, i) => lines.push(`   ${pad(lineNumber - before.length + i)} | ${line}`));
  if (difference.expected !== undefined) lines.push(`  -${pad(lineNumber)} | ${difference.expected}`);
  if (difference.actual !== undefined) lines.push(`  +${pad(lineNumber)} | ${difference.actual}`);
  after.forEach((line, i) => lines.push(`   ${pad(lineNumber + 1 + i)} | ${line}`));
  return lines;
}

function formatFileDifference(path: string, expected: Uint8Array, actual: Uint8Array): string[] {
  const difference = firstTextDifference(expected, actual);
  if (difference === null) return [];
  if (difference === 'binary') return [`First difference in ${path}: binary content differs`];

  return [
    `First difference in ${path} at line ${difference.lineNumber}:`,
    ...formatDifferenceExcerpt(difference),
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/text-diff.test.ts` Expected: PASS, 6 tests.

- [ ] **Step 5: Add the check-mode tests**

Append this `describe` block inside the existing top-level `describe('verifyFileTree', ...)` in
`test/harness/snapshot/verify-file-tree.test.ts`, directly after the `describe('write mode', ...)` block:

```ts
describe('check mode', () => {
  it('should pass when the tree matches', async () => {
    await withTempDir(async (dir) => {
      const snapshotDir = join(dir, 'snapshot');
      await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

      await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'check' });
    });
  });

  it('should throw a report listing added, changed and removed files', async () => {
    await withTempDir(async (dir) => {
      const snapshotDir = join(dir, 'snapshot');
      await verifyFileTree(snapshotDir, generator({ 'change.ts': 'old', 'gone.ts': 'G' }), { mode: 'write' });

      const error = await verifyFileTree(snapshotDir, generator({ 'change.ts': 'new', 'fresh.ts': 'F' }), {
        mode: 'check',
      }).catch((e: Error) => e);

      expect(error.message).toContain('Snapshot mismatch:');
      expect(error.message).toContain('+ fresh.ts');
      expect(error.message).toContain('~ change.ts');
      expect(error.message).toContain('- gone.ts');
      expect(error.message).toContain('First difference in change.ts at line 1');
      expect(error.message).toContain('-1 | old');
      expect(error.message).toContain('+1 | new');
      expect(error.message).toContain('Run `deno task test:output`');
    });
  });

  it('should leave the snapshot untouched on mismatch', async () => {
    await withTempDir(async (dir) => {
      const snapshotDir = join(dir, 'snapshot');
      await verifyFileTree(snapshotDir, generator({ 'a.ts': 'A' }), { mode: 'write' });

      await expect(verifyFileTree(snapshotDir, generator({ 'a.ts': 'B' }), { mode: 'check' })).rejects.toThrow();

      expect(await readAsText(snapshotDir)).toEqual({ 'a.ts': 'A' });
    });
  });
});
```

- [ ] **Step 6: Run the new tests to verify they fail**

Run: `deno test -A test/harness/snapshot/verify-file-tree.test.ts` Expected:
`should throw a report listing added, changed and removed files` FAILS — the message is still the Task 4 one-liner and
lacks `+ fresh.ts`. The other two check-mode tests pass already.

- [ ] **Step 7: Wire the report into `verifyFileTree`**

In `test/harness/snapshot/verify-file-tree.ts`, add the import:

```ts
import { formatMismatchReport } from './text-diff.ts';
```

and replace the check-mode branch:

```ts
if (mode === 'check') {
  throw new Error(formatMismatchReport(snapshotDir, diff, expected, actual));
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `deno test -A test/harness/snapshot/` Expected: PASS, all tests across the four test files.

- [ ] **Step 9: Commit**

```bash
deno fmt
git add test/harness/snapshot/
git commit -m "feat(harness): add first-difference reporting for snapshot mismatches"
```

---

### Task 6: Path normalization and `verifyText`

Snapshots are committed and validated on two machines: a Windows checkout locally, Linux in CI. Absolute paths that leak
into generated output — the `__source__` fields in generator state, and source-doc comment lines per commit `24a6f8d` —
must be rewritten to `<root>/…` before comparison, or every snapshot would be machine-specific. The logic already exists
inside `test/harness/verify.ts`; this task extracts it so both the legacy helper and the new snapshot module share one
copy.

**Files:**

- Create: `test/harness/snapshot/normalize.ts`
- Create: `test/harness/snapshot/verify-text.ts`
- Test: `test/harness/snapshot/normalize.test.ts`
- Test: `test/harness/snapshot/verify-text.test.ts`
- Modify: `test/harness/verify.ts` (delete its private copy, import the shared one)
- Modify: `test/harness/snapshot/verify-file-tree.ts` (normalize the generated tree)

**Interfaces:**

- Consumes: `repoRootDir` from `../paths.ts`; `FileTree` from `./tree.ts`; `resolveSnapshotMode` and `VerifyOptions`
  from `./mode.ts`; `firstTextDifference` from `./text-diff.ts`.
- Produces:
  - `function normalizePaths(text: string): string` — rewrites absolute repo paths to `<root>/`-prefixed forward-slash
    paths.
  - `function normalizeFileTree(tree: FileTree): FileTree` — applies `normalizePaths` to every non-binary file, leaving
    binary files untouched.
  - `function verifyText(snapshotFile: string, text: string, options?: VerifyOptions): Promise<void>`

- [ ] **Step 1: Write the failing test for normalization**

Create `test/harness/snapshot/normalize.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { normalizeFileTree, normalizePaths } from './normalize.ts';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe('normalizePaths', () => {
  it('should rewrite an absolute repo path to a <root> path', () => {
    const absolute = join(repoRootDir, 'test', 'specs', 'v3', 'pets.yml');
    expect(normalizePaths(`source: ${absolute}`)).toBe('source: <root>/test/specs/v3/pets.yml');
  });

  it('should rewrite backslash-separated paths to forward slashes', () => {
    const absolute = `${repoRootDir}\\test\\specs\\v3\\pets.yml`;
    expect(normalizePaths(`source: ${absolute}`)).toBe('source: <root>/test/specs/v3/pets.yml');
  });

  it('should rewrite every occurrence in a multi-line string', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const result = normalizePaths(`one: ${absolute}\ntwo: ${absolute}`);
    expect(result).toBe('one: <root>/a.yml\ntwo: <root>/a.yml');
  });

  it('should leave text without repo paths untouched', () => {
    expect(normalizePaths('export const a = 1;\n')).toBe('export const a = 1;\n');
  });
});

describe('normalizeFileTree', () => {
  it('should normalize text file contents', () => {
    const absolute = join(repoRootDir, 'a.yml');
    const tree = normalizeFileTree(new Map([['doc.ts', encode(`// from ${absolute}\n`)]]));
    expect(decode(tree.get('doc.ts')!)).toBe('// from <root>/a.yml\n');
  });

  it('should leave binary files byte-identical', () => {
    const binary = new Uint8Array([0, 1, 2, 0]);
    const tree = normalizeFileTree(new Map([['logo.png', binary]]));
    expect(tree.get('logo.png')).toEqual(binary);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/normalize.test.ts` Expected: FAIL — module `./normalize.ts` not found.

- [ ] **Step 3: Write `normalize.ts`**

The regex construction is lifted from `test/harness/verify.ts` unchanged — it is already correct, including the
doubled-backslash handling for paths that were themselves escaped into a string literal.

```ts
import { relative, resolve } from 'node:path';

import { repoRootDir } from '../paths.ts';
import type { FileTree } from './tree.ts';

function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const rootPathPattern = escapeRegExp(repoRootDir).replace(/\\\\/g, '(\\\\|\\\\\\\\|\\/)');
const pathPattern = new RegExp(`${rootPathPattern}[a-zA-Z0-9-_\\\\\\/.]*`, 'g');

/**
 * Rewrites absolute paths inside the repository to `<root>/`-prefixed forward-slash paths, so that
 * snapshots are identical on a Windows checkout and on Linux CI.
 */
export function normalizePaths(text: string): string {
  return text.replace(
    pathPattern,
    (path) => '<root>/' + relative(repoRootDir, resolve(path.replace(/\\\\/g, '\\'))).replace(/\\/g, '/'),
  );
}

/** Applies {@link normalizePaths} to every text file in a tree. Binary files pass through untouched. */
export function normalizeFileTree(tree: FileTree): FileTree {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const result: FileTree = new Map();

  for (const [path, bytes] of tree) {
    result.set(path, bytes.includes(0) ? bytes : encoder.encode(normalizePaths(decoder.decode(bytes))));
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/normalize.test.ts` Expected: PASS, 6 tests.

- [ ] **Step 5: Remove the duplicated copy from the legacy helper**

In `test/harness/verify.ts`, delete the local `escapeRegExp` and `normalizePaths` function definitions (lines 30-32 and
59-66) and import the shared one instead. Add to the import block at the top:

```ts
import { normalizePaths } from './snapshot/normalize.ts';
```

- [ ] **Step 6: Verify the legacy tests still pass**

Run: `deno task test` Expected: PASS, same count as before. This confirms the extracted `normalizePaths` behaves
identically to the copy it replaced — the existing `.expect.txt` files are full of `<root>/` paths and would break
loudly otherwise.

- [ ] **Step 7: Normalize the generated tree in `verifyFileTree`**

In `test/harness/snapshot/verify-file-tree.ts`, add the import:

```ts
import { normalizeFileTree } from './normalize.ts';
```

and wrap the tree read, so the committed snapshot always stores normalized content:

```ts
const actual = normalizeFileTree(await readFileTree(outputDir));
```

The committed side needs no normalization — it was written already normalized.

- [ ] **Step 8: Write the failing test for `verifyText`**

Create `test/harness/snapshot/verify-text.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { repoRootDir } from '../paths.ts';
import { verifyText } from './verify-text.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-verify-text-test-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

describe('verifyText', () => {
  it('should create the snapshot file in write mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'nested', 'state.txt');

      await verifyText(file, 'hello\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('hello\n');
    });
  });

  it('should overwrite a changed snapshot in write mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'old\n', { mode: 'write' });

      await verifyText(file, 'new\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('new\n');
    });
  });

  it('should normalize absolute repo paths before storing', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');

      await verifyText(file, `source: ${join(repoRootDir, 'a.yml')}\n`, { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('source: <root>/a.yml\n');
    });
  });

  it('should pass in check mode when the text matches', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'same\n', { mode: 'write' });

      await verifyText(file, 'same\n', { mode: 'check' });
    });
  });

  it('should throw with the first difference in check mode', async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, 'state.txt');
      await verifyText(file, 'a\nold\nc\n', { mode: 'write' });

      const error = await verifyText(file, 'a\nnew\nc\n', { mode: 'check' }).catch((e: Error) => e);

      expect(error.message).toContain('Snapshot mismatch:');
      expect(error.message).toContain('at line 2');
      expect(error.message).toContain('-2 | old');
      expect(error.message).toContain('+2 | new');
    });
  });

  it('should report a missing snapshot file distinctly in check mode', async () => {
    await withTempDir(async (dir) => {
      const error = await verifyText(join(dir, 'state.txt'), 'text\n', { mode: 'check' })
        .catch((e: Error) => e);

      expect(error.message).toContain('Snapshot file does not exist');
    });
  });
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `deno test -A test/harness/snapshot/verify-text.test.ts` Expected: FAIL — module `./verify-text.ts` not found.

- [ ] **Step 10: Write `verify-text.ts`**

```ts
import { dirname } from 'node:path';

import { ensureDir } from '@std/fs';

import { resolveSnapshotMode, type VerifyOptions } from './mode.ts';
import { normalizePaths } from './normalize.ts';
import { firstTextDifference, formatDifferenceExcerpt } from './text-diff.ts';

const encoder = new TextEncoder();

/**
 * Compares `text` against the committed snapshot at `snapshotFile`.
 *
 * Used for snapshots that are not file trees: a generator's returned `state` object and the parsed
 * `ApiData` model. Behaves like {@link verifyFileTree} with respect to write and check modes.
 */
export async function verifyText(snapshotFile: string, text: string, options: VerifyOptions = {}): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const normalized = normalizePaths(text);

  let expected: string | undefined;
  try {
    expected = await Deno.readTextFile(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  if (expected === normalized) return;

  if (mode === 'check') {
    if (expected === undefined) {
      throw new Error(
        `Snapshot file does not exist: ${snapshotFile}\n\n` +
          'Run `deno task test:output` to create it, then commit the result.',
      );
    }
    throw new Error(formatTextMismatch(snapshotFile, expected, normalized));
  }

  await ensureDir(dirname(snapshotFile));
  await Deno.writeTextFile(snapshotFile, normalized);
  console.info(`snapshot updated ${snapshotFile}`);
}

function formatTextMismatch(snapshotFile: string, expected: string, actual: string): string {
  const lines = [`Snapshot mismatch: ${snapshotFile}`, ''];
  const difference = firstTextDifference(encoder.encode(expected), encoder.encode(actual));

  if (difference !== null && difference !== 'binary') {
    lines.push(`First difference at line ${difference.lineNumber}:`, ...formatDifferenceExcerpt(difference));
  }

  lines.push('', 'Run `deno task test:output` to update the snapshot, then commit the result.');
  return lines.join('\n');
}
```

- [ ] **Step 11: Run test to verify it passes**

Run: `deno test -A test/harness/snapshot/verify-text.test.ts` Expected: PASS, 6 tests.

- [ ] **Step 12: Commit**

```bash
deno fmt
git add test/harness/
git commit -m "feat(harness): add path normalization and verifyText"
```

---

### Task 7: Public exports, tasks and documentation

**Files:**

- Create: `test/harness/snapshot/mod.ts`
- Create: `test/README.md`
- Modify: `test/harness/mod.ts` (re-export the snapshot module)
- Modify: `deno.json` (add the `test:harness` task)

**Interfaces:**

- Produces: everything from Tasks 2-6, re-exported through `@goast/test-harness`.

The `test:output` and `test:output:check` tasks are **not** added here, even though check-mode failure messages name
them. `deno test` errors on a path that does not exist, and `test/output-tests/` arrives in phase 2 — so adding them now
would ship two broken tasks. Nothing in phase 1 can emit those messages in real use, since no tier-2 test exists yet.
`test/README.md` marks tier 2 as `phase 2` in its status table, so the documentation stays honest.

- [ ] **Step 1: Create the snapshot barrel**

Create `test/harness/snapshot/mod.ts`:

```ts
export * from './mode.ts';
export * from './normalize.ts';
export * from './text-diff.ts';
export * from './tree.ts';
export * from './verify-file-tree.ts';
export * from './verify-text.ts';
```

- [ ] **Step 2: Re-export from the package barrel**

In `test/harness/mod.ts`, add the snapshot export. Keep the list alphabetical:

```ts
export * from './declutter.ts';
export * from './paths.ts';
export * from './snapshot/mod.ts';
export * from './string.utils.ts';
export * from './types.ts';
export * from './verify.ts';
```

- [ ] **Step 3: Verify the barrel has no export collisions**

Run: `deno check test/harness/mod.ts` Expected: no errors. `verify.ts` exports `verify` and `MultipartData`; the
snapshot module exports `verifyFileTree` and `verifyText`. A collision here means something was named twice.

- [ ] **Step 4: Add the deno task**

In `deno.json`, add to `tasks` after the existing `test:typescript` entry:

```json
"test:harness": "deno test -A test/harness",
```

- [ ] **Step 5: Write the contributor documentation**

Create `test/README.md`:

````markdown
# Tests

The full strategy is specified in
[`docs/superpowers/specs/2026-07-25-testing-strategy-design.md`](../docs/superpowers/specs/2026-07-25-testing-strategy-design.md).
This file documents what exists today.

## Prerequisites

Deno only. Later phases add tiers that require Docker; the everyday loop does not.

## Tiers

| # | Tier        | Question                                              | Command                  | Status     |
| - | ----------- | ----------------------------------------------------- | ------------------------ | ---------- |
| 1 | Unit        | Does this function do what it says?                   | `deno task test`         | active     |
| 2 | Output      | Did the generated text change?                        | `deno task test:output`  | phase 2    |
| 3 | Compile     | Is the generated code valid in its language?          | `deno task test:compile` | phase 3    |
| 4 | Integration | Does the generated code behave correctly on the wire? | `deno task test:it`      | phases 5-7 |

## Snapshot modes

Tier 2 compares generated output against trees committed under `test/output/`. It runs in one of two modes:

- **write** — the default locally. A changed snapshot is rewritten on disk and the test passes. The change then shows up
  in `git status` and is reviewed as an ordinary diff in the pull request.
- **check** — the default in CI. A changed snapshot fails the test.

Resolution order:

1. `GOAST_SNAPSHOT=write` or `GOAST_SNAPSHOT=check`, when set.
2. `check` when `CI` is set to anything other than `''`, `'0'` or `'false'`.
3. `write` otherwise.

So the everyday loop will be:

```bash
deno task test:output   # regenerates snapshots
git diff                # review what changed
```

> The `test:output` tasks land with tier 2 in phase 2. Today the harness is in place but nothing calls it yet;
> `deno task test:harness` runs the harness's own tests.

and to reproduce a CI failure locally:

```bash
deno task test:output:check
```

When CI fails on a snapshot mismatch, the workflow re-runs the job in write mode and uploads the resulting `git diff` as
a `snapshot.patch` artifact. Applying it is an alternative to regenerating locally:

```bash
git apply snapshot.patch
```

## Harness API

`@goast/test-harness` (source in `test/harness/`) provides the snapshot engine.

```ts
import { verifyFileTree, verifyText } from '@goast/test-harness';

// Compare a generated directory against a committed tree.
await verifyFileTree('test/output/typescript/models/v3/pets', async (outputDir) => {
  await new OpenApiGenerator({ outputDir, newLine: '\n' })
    .useType(TypeScriptModelsGenerator)
    .parseAndGenerate(specFile);
});

// Compare arbitrary text — generator state, or the parsed ApiData model.
await verifyText('test/output/typescript/models/v3/pets.state.txt', inspect(state, { sorted: true }));
```

Both accept `{ mode: 'write' | 'check' }` to override environment resolution. Tests for the harness itself always pass
an explicit mode, so they never depend on whether `CI` happens to be set.

### Guarantees worth knowing

- **Comparison is byte-exact.** Carriage returns are never stripped — a stray `\r` in a snapshot is a real bug.
  Generators must run with `newLine: '\n'`.
- **Absolute repo paths are normalized** to `<root>/…` with forward slashes before comparison, so a snapshot written on
  Windows matches one validated on Linux.
- **Write mode will not delete a snapshot wholesale.** If generation emits zero files, the test fails instead of
  pruning, so a generator that throws early cannot wipe committed output.
- **`test/output/**` is excluded** from `deno fmt` and `deno lint`, and marked `linguist-generated` in `.gitattributes`
  so GitHub collapses those diffs by default.

## Layout

```
test/
  harness/            # the test harness, published locally as @goast/test-harness
    snapshot/         # the snapshot engine (mode, tree, text-diff, normalize, verify-*)
    paths.ts          # repo root and spec directory paths
    declutter.ts      # strips noise from parsed ApiData before snapshotting
    verify.ts         # legacy snapshot helper, removed in phase 2
  openapi-files/      # OpenAPI corpus, becomes test/specs/ in phase 2
```
````

- [ ] **Step 6: Verify the documented command works**

```bash
deno task test:harness
```

Expected: PASS, with all snapshot tests from Tasks 2-6 appearing in the output.

- [ ] **Step 7: Verify the whole repo is green**

```bash
deno fmt --check
deno lint
deno task test
deno publish --dry-run --allow-dirty
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add deno.json test/README.md test/harness/mod.ts test/harness/snapshot/mod.ts
git commit -m "feat(harness): export snapshot module, add tasks and docs"
```

---

## Phase Completion Check

Before handing off to phase 2, confirm:

- [ ] `deno task test` passes, with the same package test count as before Task 1 plus the new harness tests.
- [ ] `deno fmt --check` and `deno lint` pass.
- [ ] `deno publish --dry-run --allow-dirty` passes.
- [ ] `deno task npm` builds all four packages, including `@goast/test-harness`.
- [ ] `grep -rn "test-utils" --include="*.ts" --include="*.json" --include="*.yml" . --exclude-dir=npm --exclude-dir=.git`
      returns nothing.
- [ ] `GOAST_SNAPSHOT=check deno task test:harness` passes — harness tests pass an explicit mode and must be immune to
      the environment.

## Handoff to Phase 2

Phase 2 consumes `verifyFileTree` and `verifyText` from `@goast/test-harness`, and is responsible for:

- Building the ~45-spec corpus at `test/specs/`, replacing `test/openapi-files/`.
- Creating `test/output-tests/profiles.ts` and the test file that iterates profiles against specs.
- Adding the `test:output` and `test:output:check` deno tasks, deliberately omitted in phase 1 because their target
  directory did not exist yet. Check-mode failure messages already name them.
- Deleting `packages/*/tests/openapi*.test.ts`, the `packages/*/tests/.verify/` trees, and `test/harness/verify.ts` —
  along with its `MultipartData` export and the `spawn('code', '--diff')` call.
- Updating `scripts/build_npm.ts`, which hardcodes both `test/openapi-files` and `tests/.verify` paths in its
  `postBuild` hook.
- Committing the initial `test/output/` trees.
- Extending `test/README.md` with how to add a spec and a profile, and flipping the tier-2 row in its status table to
  `active`.
