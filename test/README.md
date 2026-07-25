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
