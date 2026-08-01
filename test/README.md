# Tests

The full strategy is specified in
[`docs/superpowers/specs/2026-07-25-testing-strategy-design.md`](../docs/superpowers/specs/2026-07-25-testing-strategy-design.md).
This file documents what exists today.

## Prerequisites

Deno and Docker. The everyday loop — tiers 1 and 2 — needs only Deno; Docker is required for tier 3.

## Tiers

| # | Tier        | Question                                              | Command                  | Status     |
| - | ----------- | ----------------------------------------------------- | ------------------------ | ---------- |
| 1 | Unit        | Does this function do what it says?                   | `deno task test`         | active     |
| 2 | Output      | Did the generated text change?                        | `deno task test:output`  | active     |
| 3 | Compile     | Is the generated code valid in its language?          | `deno task test:compile` | active     |
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

**Measured cost.** `deno task test:output:check` runs the full 54-spec corpus across fifteen profiles in about 22
seconds wall-clock (18 passed, 871 steps, 0 failed) on a warm Deno cache. The 54 specs and their generated trees
together commit 8,275 files under `test/output/`, ten of them `.error.txt` (see "Error snapshots" under
[Corpus map](#corpus-map)) rather than a generated tree.

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
- **The harness's random per-run output directory is rewritten to `<output>`, in tree file content as well as in
  `state.txt`.** If you find `from '<output>/models/…'` inside a committed generated file rather than a plausible
  relative import, the `<output>` marker is the harness doing its job — the wrongness is that the generator wrote an
  absolute temp-directory path into generated source in the first place. This surfaced during the corpus-expansion phase
  when `existingFileBehavior: 'count'` (below) let generation reach a file whose name is exactly `.ts` for the first
  time; it's registered as defect 18 in `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`, not fixed here.
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

## Corpus map

`test/specs/` holds 54 entries — the count `discoverSpecs()` returns, not the file count, since a _directory_ under a
version directory (`v3/external-refs/`, `v3/multi-file/`) is one entry regardless of how many files it contains. 14 of
the 54 predate the corpus-expansion phase; the other 40 were added by
[`docs/superpowers/plans/2026-07-25-corpus-expansion.md`](../docs/superpowers/plans/2026-07-25-corpus-expansion.md) to
push edge-case coverage past the original six-file corpus's small fraction of OpenAPI. Read this table before adding a
spec — the cheapest thing to do when adding coverage is to create a new file rather than check whether one of these 54
already isolates the concern.

### Types and schemas

| Spec                             | Isolates                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v2/simple-schemas.yml`          | one schema per primitive type, no other keywords, under Swagger 2.0's top-level `definitions`                                                                                         |
| `v3/simple-schemas.yml`          | one schema per primitive type, no other keywords                                                                                                                                      |
| `v3.1/simple-schemas.yml`        | the same set, 3.1 form                                                                                                                                                                |
| `v2/detailed-schemas.yml`        | the common keywords Swagger 2.0 supports together: title, default, length, pattern, example, enum, `readOnly` (2.0 has no `writeOnly` or `nullable`)                                  |
| `v3/detailed-schemas.yml`        | title, the full set of common keywords together (format, default, length, pattern, `nullable`, `deprecated`, example), a plain string enum, `readOnly`/`writeOnly`                    |
| `v3.1/detailed-schemas.yml`      | the same, 3.1 form (a `type` array instead of `nullable`)                                                                                                                             |
| `v3/primitive-formats.yml`       | every `format` on every primitive, including a nonstandard one and a `format` on the "wrong" type                                                                                     |
| `v3/nullable-schemas.yml`        | 3.0 `nullable` in combination — with a `$ref`, an array, `allOf`, `required`                                                                                                          |
| `v3.1/nullable-schemas.yml`      | the same combinations expressed as 3.1 type arrays, plus `type: 'null'` alone and a genuine multi-type schema                                                                         |
| `v3/enum-schemas.yml`            | non-string and irregular enums — integer, mixed JSON types, empty string, special characters, reserved words as values                                                                |
| `v3.1/enum-schemas.yml`          | `const`, and `enum` with no `type` at all                                                                                                                                             |
| `v3/defaults-and-deprecated.yml` | `default` per type and `deprecated` at three positions (schema, operation, parameter) — including the deprecated-parameter-without-description shape that was a real k6 generator bug |

### Arrays and objects

| Spec                      | Isolates                                                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v2/object-schemas.yml`   | properties, `required`, `additionalProperties`, `allOf` combined with own properties (2.0 has no `anyOf`), type-array nullable properties, `$ref`s in properties and `allOf` both same-file and cross-file, object and multi-line descriptions |
| `v3/object-schemas.yml`   | properties, `required`, `additionalProperties`, `allOf` and `anyOf` combined on one schema, nullable properties, and `$ref`s in properties/`anyOf`/`allOf` both same-file and cross-file                                                       |
| `v3.1/object-schemas.yml` | the same, 3.1 form                                                                                                                                                                                                                             |
| `v3/array-schemas.yml`    | array constraints and nesting — `uniqueItems`, min/max, arrays of arrays, an untyped `items`-less array                                                                                                                                        |
| `v3.1/array-schemas.yml`  | `prefixItems` (tuples, with and without a rest `items`, closed with `items: false`), `contains`                                                                                                                                                |
| `v3/object-extras.yml`    | the `additionalProperties` boolean forms, `not`, `minProperties`/`maxProperties`, a schema that is just `{}`                                                                                                                                   |
| `v3.1/object-extras.yml`  | `patternProperties` and its 3.1-only relatives — `unevaluatedProperties`, `dependentSchemas`, `dependentRequired`, `propertyNames`                                                                                                             |

### Composition

| Spec                             | Isolates                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v3/oneof-schemas.yml`           | an empty `oneOf`, `oneOf` of plain types, a sibling `type` ignored beside `oneOf`, `oneOf` of refs                                                                                                                                                                                                                     |
| `v3.1/oneof-schemas.yml`         | the same, 3.1 form                                                                                                                                                                                                                                                                                                     |
| `v3/discriminated-schemas.yml`   | a discriminator with an explicit `mapping`, encoded as parent-declares/children-`allOf` inheritance rather than a `oneOf`                                                                                                                                                                                              |
| `v3.1/discriminated-schemas.yml` | the same, 3.1 form                                                                                                                                                                                                                                                                                                     |
| `v3/allof-schemas.yml`           | `allOf` merging — two refs, ref plus inline, sibling properties beside `allOf`, a property-type conflict between branches, a required-only branch, three-level inheritance                                                                                                                                             |
| `v3.1/allof-schemas.yml`         | the same shapes, 3.1 form                                                                                                                                                                                                                                                                                              |
| `v3/anyof-schemas.yml`           | `anyOf` as the whole of a named schema, not just a property keyword                                                                                                                                                                                                                                                    |
| `v3/discriminator-variants.yml`  | discriminator mapping that `v3/discriminated-schemas.yml` doesn't cover — implicit (no `mapping`), partial `mapping`, on `anyOf`, on a bare `allOf` inheritance chain with no `oneOf`, an unrequired discriminator property, an enum-typed discriminator property, a discriminator nested inside another discriminator |
| `v3/anyof-cycle.yml`             | an `anyOf` branch that refs back to the schema holding it                                                                                                                                                                                                                                                              |
| `v3/nested-composition.yml`      | composition nested inside composition — `allOf` of `oneOf`, `oneOf` of `allOf`, two-level `allOf`/`oneOf`, composition inside an array or map or object property                                                                                                                                                       |

### References

| Spec                       | Isolates                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v3/recursive-refs.yml`    | self-recursion, mutual recursion, and recursion through an array, a map, and a required property — one schema in this file crashes a generator, see "Error snapshots" below |
| `v3/external-refs/`        | a schema-only file with no `openapi`/`info`/`paths` (`shared/types.yml`) pulled in by `$ref` from a full document (`main.yml`), directly and through an array               |
| `v3/root-ref.yml`          | `$ref: '#'` (the whole document) and `$ref: '#/components'`                                                                                                                 |
| `v3/ref-siblings.yml`      | `$ref` beside other keywords (`description`, `title`, `nullable`, `default`, `example`) under 3.0, which ignores them — see "Reading the corpus" for the 3.1 gap            |
| `v3/json-schema-root.json` | a bare JSON Schema document as the root, no `openapi`/`info`/`paths` — the case commit `35a746b` fixed                                                                      |

### Naming

| Spec                     | Isolates                                                                                                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v3/name-collisions.yml` | schema names that a generator's normalization collapses onto each other (casing, separators, transliteration) — see "How to add a spec" below for what a collision actually does to the tree                                                                                                           |
| `v3/reserved-words.yml`  | Kotlin and TypeScript keywords used as type names and, separately, as property names                                                                                                                                                                                                                   |
| `v3/non-ascii-names.yml` | umlauts, CJK, Greek, Cyrillic, emoji, and a combining-mark name next to its precomposed equivalent                                                                                                                                                                                                     |
| `v3/extreme-names.yml`   | an 80-character name (see "Reading the corpus" for why it isn't 200), numeric-leading names, punctuation-only names, and a casing-variety set (`camelCase`, `PascalCase`, `snake_case`, `SCREAMING_SNAKE`, `kebab-case`, an acronym, a leading-lowercase-before-capitals name) that must _not_ collide |

### Parameters

| Spec                           | Isolates                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v3/parameter-locations.yml`   | path, query, header, and cookie parameters, `allowEmptyValue`, `allowReserved`, a `$ref`'d parameter schema                                                |
| `v3/parameter-styles.yml`      | the `style` × `explode` matrix — `form`, `spaceDelimited`, `pipeDelimited`, `deepObject`, `simple`, `label`, `matrix`                                      |
| `v3/parameter-inheritance.yml` | path-item-level `parameters` inherited and overridden by an operation, plus a `$ref`'d path-item parameter                                                 |
| `v2/parameter-locations.yml`   | Swagger 2.0's `body` and `formData` parameter locations (which pin an absence, see "Reading the corpus"), plus query `collectionFormat`, which does render |

### Bodies and responses

| Spec                       | Isolates                                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v3/request-bodies.yml`    | content types on a request body — JSON, XML, text, octet-stream, form-urlencoded, `*/*`, several on one operation, optional, a `$ref`'d body                   |
| `v3/multipart-bodies.yml`  | files and nested objects inside `multipart/form-data`, which render; an `encoding` block, which pins an absence, see "Reading the corpus"                      |
| `v3/response-variants.yml` | multiple `2xx` codes, `default`, `204`, `2XX`/`4XX`/`5XX` ranges mixed with exact codes, multi-content-type and array/primitive responses, a `$ref`'d response |
| `v3/response-headers.yml`  | response headers, including required, deprecated, `$ref`'d, and on a `204` — pins an absence, see "Reading the corpus"                                         |

### Document structure

| Spec                       | Isolates                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v3/service-endpoints.yml` | a small single-tag service (list/create/get/delete/search across two schemas) — the baseline endpoint spec other specs' conventions are read against                     |
| `v3/operation-naming.yml`  | the name a generator derives when `operationId` is missing — by method, path, path parameters, and (once) a `summary` instead                                            |
| `v3/tags-and-servers.yml`  | tag combinations (none, one, two, shared, declared vs. undeclared) and `servers` at document, path-item, and operation level                                             |
| `v3/security-schemes.yml`  | apiKey, http basic, http bearer, and oauth2 schemes; inherited, overridden, emptied, ANDed, and ORed `security` requirements — pins an absence, see "Reading the corpus" |
| `v3/path-edge-cases.yml`   | punctuation in path segments, a templated segment overlapping a literal one, a trailing slash, a parameter-only path, deep nesting, casing variety                       |
| `v3/multi-file/`           | three complete documents (`shared.yml`, `pets.yml`, `owners.yml`) parsed as one spec, cross-referencing each other in both directions                                    |
| `v3.1/webhooks.yml`        | 3.1 `webhooks`, with no `paths` at all — pins an absence, see "Reading the corpus"                                                                                       |
| `v3/json-input.json`       | a complete document written as JSON instead of YAML                                                                                                                      |

### Reading the corpus

A few entries need context a one-phrase table cell can't carry:

- **Several entries pin an absence, not a generated behaviour.** `v3/response-headers.yml`, `v3/security-schemes.yml`,
  `v3.1/webhooks.yml`, the `encoding` block in `v3/multipart-bodies.yml`, and the `body`/`formData` parameters in
  `v2/parameter-locations.yml` all reach the parsed core model — visible in `test/output/core/**/model.txt` — and then
  disappear before any generator emits a line of code for them (verified by grepping the generated trees: no response
  header name, no security scheme name, no webhook operation ID, no `encoding`-driven `Content-Type` or `style`, and no
  2.0 body/`formData` parameter appears in any generated client, controller, or model file;
  `v2/parameter-locations.yml`'s `bodyParam()`, `formDataParams()`, and `fileUpload()` all generate with **no parameters
  at all**). A green run against these specs proves the input parses; it does not prove anything renders. Treat a change
  to one of them as "the model shape moved" until you've checked whether a generator was supposed to start honoring it.
- `v3/multipart-bodies.yml`'s `withEncoding` operation sets `style: form` on a multipart part. By the OpenAPI 3.0 spec's
  own text, `style` is ignored unless the media type is `application/x-www-form-urlencoded` — see the doc comment on
  `OpenApiEncoding.style` at `packages/core/src/parse/openapi-types.ts:279`. The key is there because the corpus plan
  asked for it; it is inert by specification, not merely unimplemented.
- `v3.1/webhooks.yml`'s third entry, `petsRequested`, is a **`get` under `webhooks:`**, not a regular operation under
  `paths:` — there is no `paths:` in this file at all. Under `webhooks:` the keys are webhook names and the value is a
  Path Item Object, so a non-`post` method there is legal, but it is still a webhook. Do not read `petsRequested`'s
  `operationId: listPets` as evidence that this spec covers a mixed webhooks-plus-regular-operations document.
- `v3/security-schemes.yml` declares `ApiKeyQuery` (apiKey in query) and `BasicAuth` (http basic) in
  `components.securitySchemes`, but no operation's `security` requires either — they're declared-only.
- `v3/extreme-names.yml`'s long name is 80 characters, not the 200 the corpus plan originally asked for. At 200
  characters the generated TypeScript path came out to 316 repo-relative characters, past what a Windows checkout
  accepts without enabling `core.longpaths`; the name was shortened to 80 during execution (see the corpus-expansion
  plan's Task 5). If you need a longer name to stress path-length handling further, this is the constraint you will hit
  first, and it binds on Windows specifically, not on the harness or the generators.
- **Coverage gap:** `v3/ref-siblings.yml` pins only the 3.0 half of the `$ref`-with-siblings behaviour — that 3.0
  ignores sibling keywords beside a `$ref`. There is no `v3.1/ref-siblings.yml`; the 3.1 behaviour (merging the siblings
  instead of ignoring them) is not pinned anywhere in the corpus. Read the row above as "the 3.0 side is covered," not
  as evidence both versions' handling is exercised. If you need the 3.1 side covered, it isn't here yet.
- **Coverage gap:** no entry in the corpus has both a top-level `webhooks` block and a non-empty `paths` block in the
  same document. The corpus-expansion plan asked for both "no `paths` at all" and a regular operation in the same file
  for `v3.1/webhooks.yml`, which turned out to be unsatisfiable together (a webhook-only document can't have `paths` and
  still be the no-`paths` case); the no-`paths` shape was kept because nothing else in the corpus pins it, and the mixed
  shape was dropped rather than faked. If you need that combination, it isn't here yet.

### Error snapshots

Exactly one defect is committed as `.error.txt`, ten times over — once per Kotlin profile (`models@sb3`, `models@sb4`,
`okhttp3-clients@sb3`, `okhttp3-clients@sb4`, `spring-controllers@sb3`, `spring-controllers@sb3-strict`,
`spring-controllers@sb4`, `spring-controllers@sb4-strict`, `spring-reactive-web-clients@sb3`,
`spring-reactive-web-clients@sb4`) against `v3/recursive-refs`. Every one holds the identical one-line message
`RangeError: Maximum call stack size exceeded`.

**Known bug, narrowly scoped — do not read this as "Kotlin crashes on recursive schemas."** Bisecting the spec's schemas
one at a time through `KotlinModelsGenerator` shows only `RecursiveThroughMap` (whose `additionalProperties` refs
itself) triggers the crash. Every other recursive shape in the file generates correctly, including _direct_
self-reference: `SelfRecursive.kt` emits `val child: SelfRecursive? = null` and `TreeNode.kt` emits
`val parent: TreeNode?` / `val children: List<TreeNode>?`. The bug is in `KotlinModelsGenerator`'s handling of a
self-referencing `additionalProperties` map specifically, and every Kotlin profile hits it because all ten chain
`KotlinModelsGenerator` first. Not fixed here — per this phase's rules, a crash is reported and left in place, not
patched or hidden by trimming the spec.

## How to add a spec

Drop a file in `test/specs/<version>/` (`v2`, `v3`, or `v3.1`). A _directory_ there is one spec too, whose files are
parsed together — that's how multi-file and mixed-reference specs are expressed. Then, **format before you regenerate,
never after**:

```bash
deno fmt test/specs
deno task test:output
git add -A test/output && git diff --cached   # review the new snapshot tree
```

and commit the generated tree. `discoverSpecs()` picks the new spec up automatically; nothing else needs to change. The
fmt step must come first: the Kotlin and TypeScript generators stamp source-document line numbers into generated doc
comments via `getSourceDocLine`, and reformatting a spec after generating its snapshot silently invalidates every
stamped line number — check mode then fails on a machine that never reformatted the file, with no clue why.

A brand-new spec's snapshot tree is untracked, so plain `git diff` prints nothing here — there is nothing tracked yet to
diff against. Staging it first with `git add -A test/output` is what makes `git diff --cached` show the new files'
content for review; `git status --porcelain test/output` is the cheaper alternative when you only need the list of
paths, not their content.

**`git diff --stat -- test/output` must stay empty for every _other_ spec's snapshots.** Adding a spec should only add
new, untracked paths. A line of diff against an existing spec's tree means the new spec changed generation for something
already committed — that's a behaviour change riding in disguised as new coverage, and it needs its own investigation
before it gets committed alongside the new spec.

**A filename collision is silent, not a failure.** The output tests run with `existingFileBehavior: 'count'`
(`test/output-tests/output.test.ts`): if a spec has two schemas whose names normalize to the same file, generation does
not fail — it writes `X.kt`, then `X_1.kt`, `X_2.kt`, and so on, and the run reports green. After adding a spec, look
through the new tree for `_1`/`_2`-suffixed files before trusting a clean run — the new tree is untracked, so
`git status --porcelain test/output | grep -E '_[0-9]+\.'` finds them; grepping plain `git diff` here finds nothing, for
the same reason the review step above needs `git add` first. And per the option's own doc comment: a counted file is
written under a name nothing else generated references (every other file's imports still point at the first file
written), so `'count'` makes a collision inspectable, not correct.

**Before committing, run the check gate — write mode alone does not prove the tree is right.**

```bash
deno fmt --check
deno lint
GOAST_SNAPSHOT=check deno test -A test/output-tests
```

Write mode (`deno task test:output`, above) always passes by construction — it rewrites whatever it finds, so it cannot
catch a mismatch, only produce one to review. The check-mode run is what actually verifies the committed tree is
deterministic and matches what's on disk. Never substitute bare `deno task test` (equivalently, bare `deno test -A`) for
this: `test/output-tests` is not excluded from its default test scope, so it runs in write mode too and would silently
rewrite a real mismatch instead of failing on it.

**A new spec belongs in the corpus map above.** Add one row, in one phrase that says what the spec isolates rather than
restating its filename, under the category it fits.

## How to add a profile

Add one entry to the `profiles` array in `test/output-tests/profiles.ts` — a generator, or generator chain, plus the
config it runs with — then run `deno task test:output` and commit the new snapshot trees it writes. A config change is
itself a new profile: give it its own `name` rather than mutating an existing one, so the old snapshot remains a
reviewable diff instead of disappearing.

## Tier 3: compile gate

Tier 2 proves the generator wrote the same text as last time. Tier 3 asks a different question: is that text valid code?
`test/compile-tests/compile.test.ts` compiles every corpus spec against every applicable generator profile and records
the compiler's own diagnostics.

A **compile unit** is one profile-and-spec pair with a non-empty generated tree under `test/output/` — `models` against
an endpoint-only spec, or a spec whose generation failed and left only an `.error.txt`, contribute no unit.
`discoverCompileUnits` (`@goast/test-harness`) finds units by walking the tree rather than trusting the registry, for
exactly that reason. The gate covers **782 units** across three execution groups, because they are what you choose
between when running it locally:

- **108 host TypeScript** units (`models`, `fetch-clients`) — type-checked on the runner directly with `deno check`, no
  container.
- **162 containerized TypeScript** units (`angular-services`, `k6-clients`, `easy-network-stub`) — compiled with `tsc`
  inside the `node` image, because these profiles' output assumes npm packages a bare `deno check` doesn't have.
- **512 Kotlin** units (ten profiles — `models`, `okhttp3-clients`, `spring-reactive-web-clients`, and
  `spring-controllers` in both its plain and `-strict` forms, each crossed with Spring Boot 3 and 4) — compiled in one
  Gradle build inside the `kotlin` image.

**Docker is required for the containerized TypeScript and Kotlin groups.** `models` and `fetch-clients` need only Deno,
so a Docker-less checkout can still exercise part of the gate.

**Diagnostics are snapshots, the same shape as tier 2's error snapshots but inverted.** A unit that compiles cleanly has
**no committed file at all** — absence _is_ the pass, not "not yet checked." A unit that fails commits its errors to
`test/compile/<language>/<profile>/<version>/<spec>.txt`. Fixing a generator defect therefore shows up in a diff as a
**deletion**, not as changed content — the same reviewability tier 2 gets from a `.error.txt` disappearing, applied here
to individual diagnostics instead of a whole generation run. Check mode enforces this in both directions: a
newly-failing unit with no committed snapshot fails the run, and (`verifyCompileDiagnostics` in
`test/harness/compile/verify.ts`) a committed snapshot for a unit that now compiles cleanly _also_ fails the run rather
than passing silently — a fix has to land as a reviewed deletion, not disappear on the next write-mode run.

149 snapshot files are committed today (126 Kotlin, 23 TypeScript, 99,456 bytes total). **These record real, unfixed
generator defects, not accepted behaviour** — see
[`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`](../docs/superpowers/plans/2026-07-25-generator-bug-fixes.md)
for the catalog. Do not read a committed diagnostics file as a specification of correct output.

The commands:

```bash
deno task test:compile        # write mode: regenerates snapshots, changes show up in git status
deno task test:compile:check  # check mode: the CI-equivalent, fails on any drift
```

**Tier 3 is opt-in via `GOAST_COMPILE`.** `deno.json`'s `test.include` covers all of `test/`, so without a guard
`deno task test` (and every plain `deno test -A`) would discover `compile.test.ts` and start a container — breaking the
rule that tiers 1 and 2 never touch Docker. `compile.test.ts` registers zero tests when `GOAST_COMPILE` is unset, so
`deno test -A test/compile-tests` runs almost nothing by design; that is not the suite being broken. `orphans.test.ts`,
below, is deliberately outside that guard, so it does run in the everyday suite, and it needs no Docker.

**Warnings are deliberately discarded; only errors are recorded.** A warning does not make generated code invalid, which
is the question this tier asks, and warning output is far more volatile across compiler versions than error output —
recording warnings would turn a routine toolchain bump into mass snapshot churn that buries the real changes.

**A non-zero compiler exit with zero parsed diagnostics is a harness failure, not a clean unit.** Every runner
(`deno-check.ts`, `tsc.ts`, `kotlin.ts`) checks this explicitly and throws rather than recording an empty diagnostic
list, because the alternative is a gate that goes vacuously green the moment a compiler's output format changes
underneath its parser — a green run here is a real green run, not the parser having silently stopped working.

**TypeScript units are checked under sloppy-import resolution.** `runDenoCheck` passes `--unstable-sloppy-imports`
because the generated TypeScript uses extensionless relative imports by design (a normal style under
`moduleResolution: "bundler"`/`"node16"`), which Deno's native resolver otherwise rejects wholesale. That is a real
relaxation of what this gate proves relative to a plain `tsc` run, worth knowing before treating a clean `deno check`
result as equivalent to one.

**Compiler and dependency versions are pinned, hand-synchronised, with no machine-enforced source of truth:**

- `test/docker/kotlin/Dockerfile` pins the Gradle/JDK image (`gradle:8.14-jdk21`).
- `test/docker/kotlin/warmup/build.gradle.kts` pins the Kotlin Gradle plugin (2.2.0) and every dependency coordinate the
  offline build can resolve, including both Spring Boot BOM lines (3.5.6 and 4.0.0).
- `test/compile-tests/runners/kotlin.ts`'s `DEPENDENCIES` and `BOM` tables list the same coordinates per profile family,
  for the synthesized per-unit Gradle build.
- `test/docker/node/` (`Dockerfile`, `package.json`) pins the TypeScript compiler and npm packages for the containerized
  TypeScript group.

The Gradle build runs `--offline`, so **a new dependency has to be added to both the warmup project and `DEPENDENCIES`**
— nothing keeps them in sync automatically, and this drift has already caused a real offline-resolution failure on this
plan. Treat every edit to one as needing a matching look at the other.

`test/compile-tests/orphans.test.ts` is tier 3's equivalent of `test/output-tests/orphans.test.ts` above, but it uses a
different function: `findOrphanFiles`, not `findOrphanSnapshots`. `findOrphanSnapshots` collapses a path to its
shallowest unclaimed ancestor _directory_, which is correct for tier 2's tree-shaped snapshots but would silently
absolve a stale tier 3 file — every tier 3 snapshot is standalone at an exactly-claimed path, so a renamed spec's
leftover diagnostics would sit unnoticed among a still-live sibling spec's files in the same directory.
`findOrphanFiles` has no such escape hatch: it reports every file under `test/compile/` that `discoverCompileUnits`'s
current claims don't name exactly, so a dropped profile or a renamed spec surfaces immediately instead of leaving stale
diagnostics committed forever while every test stays green. Unlike the rest of tier 3 it needs no Docker and is not
behind `GOAST_COMPILE`, so it runs in the everyday suite.

## Layout

```
test/
  harness/            # the test harness, published locally as @goast/test-harness
    snapshot/         # the snapshot engine (mode, tree, text-diff, normalize, verify-*, orphans)
    compile/          # the compile-gate engine (unit discovery, diagnostic parsers, verify, orphans)
    paths.ts          # repo root and spec directory paths
    declutter.ts      # strips noise from parsed ApiData before snapshotting
  specs/              # OpenAPI corpus, one spec per file or per directory, under v2/v3/v3.1
  output-tests/       # tier 2: profiles.ts registry, output/core-model/orphans tests
  output/             # committed tier 2 snapshots (see "Snapshot forms" above)
  compile-tests/      # tier 3: driver (compile.test.ts), paths.ts, per-language runners, orphans test
  compile/            # committed tier 3 diagnostics (see "Tier 3: compile gate" below)
  docker/             # image contexts for the tier 3 compilers (kotlin/, node/)
```
