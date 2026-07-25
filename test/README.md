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
| 2 | Output      | Did the generated text change?                        | `deno task test:output`  | active     |
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

Run tier 2 from the repo root. `getSourceDocLine` (used by the Kotlin and TypeScript generators to stamp source
provenance into doc comments) renders paths relative to the process's current working directory, so running
`deno task test:output` from anywhere else silently produces snapshots that differ from the ones CI and every other
contributor produce, with no error to flag the mismatch.

Do not add `--parallel` to a tier 2 test task. `captureConsole` patches the global `console` for the duration of a
generator run so its per-file log lines don't bury the snapshot summary; overlapping runs would stomp on each other's
patched `console`. Tier 2 test files are written to run sequentially for this reason.

To reproduce a CI failure locally:

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

## Snapshot forms

`test/output-tests/output.test.ts` runs every profile in `test/output-tests/profiles.ts` against every spec
`discoverSpecs()` finds in `test/specs/`, through `verifyProfile`. Each profile-and-spec pair keeps its snapshot in one
of two forms, never both:

- **A tree plus a `.state.txt`.** The tree (e.g. `test/output/typescript/models/v3/pets/`) holds the files the generator
  wrote; `pets.state.txt` beside it holds the generator's serialized return value, kept out of the tree so the tree
  contains only generated source. Generation succeeded.
- **An `.error.txt`.** `pets.error.txt` holds the generator's error message. Generation failed, and the committed file
  is a deliberate, reviewable statement that this generator fails on this input — not an accident. A pair with a
  committed error and a leftover tree or state file is itself a failure `verifyProfile` reports, since a
  partially-written tree from a crashed run is order-dependent and says nothing useful.

`test/output-tests/orphans.test.ts` checks the other direction: that `test/output/` holds nothing _beyond_ what the
registry (`profiles.ts`) times the corpus (`discoverSpecs()`) claims. `verifyProfile` only ever prunes inside the
directories it is handed, so a spec that gets renamed or a profile variant that gets dropped would otherwise leave its
old snapshot on disk forever, quietly shrinking coverage while every test stays green. This test walks the full tree and
fails if it finds a base — a tree directory, a `.state.txt`, or an `.error.txt` — that nothing claims.

`test/output-tests/core-model.test.ts` snapshots one more thing per spec: the parsed `ApiData` model itself, at
`test/output/core/<version>/<spec>/model.txt`, independent of any generator.

## How to add a spec

Drop a file in `test/specs/<version>/` (`v2`, `v3`, or `v3.1`). A _directory_ there is one spec too, whose files are
parsed together — that's how multi-file and mixed-reference specs are expressed. Then:

```bash
deno task test:output
git diff                # review the new snapshot tree
```

and commit the generated tree. `discoverSpecs()` picks the new spec up automatically; nothing else needs to change.

## How to add a profile

Add one entry to the `profiles` array in `test/output-tests/profiles.ts` — a generator, or generator chain, plus the
config it runs with — then run `deno task test:output` and commit the new snapshot trees it writes. A config change is
itself a new profile: give it its own `name` rather than mutating an existing one, so the old snapshot remains a
reviewable diff instead of disappearing.

## Layout

```
test/
  harness/            # the test harness, published locally as @goast/test-harness
    snapshot/         # the snapshot engine (mode, tree, text-diff, normalize, verify-*, orphans)
    paths.ts          # repo root and spec directory paths
    declutter.ts      # strips noise from parsed ApiData before snapshotting
  specs/              # OpenAPI corpus, one spec per file or per directory, under v2/v3/v3.1
  output-tests/       # tier 2: profiles.ts registry, output/core-model/orphans tests
  output/             # committed tier 2 snapshots (see "Snapshot forms" above)
```
