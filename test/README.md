# Tests

The full strategy is specified in
[`docs/superpowers/specs/2026-07-25-testing-strategy-design.md`](../docs/superpowers/specs/2026-07-25-testing-strategy-design.md).
This file documents what exists today.

## Prerequisites

Deno and Docker. The everyday loop — tiers 1, 2 and the `fetch-clients` leg of tier 4 — needs only Deno; Docker is
required for tier 3 and for every other tier-4 target (the four Kotlin ones, the four `spring-controllers` ones, and
`angular-services`).

## Tiers

| # | Tier        | Question                                              | Command                                                                | Status                                                                                                                                |
| - | ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Unit        | Does this function do what it says?                   | `deno task test`                                                       | active                                                                                                                                |
| 2 | Output      | Did the generated text change?                        | `deno task test:output`                                                | active                                                                                                                                |
| 3 | Compile     | Is the generated code valid in its language?          | `deno task test:compile`                                               | active                                                                                                                                |
| 4 | Integration | Does the generated code behave correctly on the wire? | `deno task test:integration` / `:kotlin` / `:controllers` / `:angular` | client direction: fetch-clients, angular-services, okhttp3-clients, spring-reactive-web-clients; server direction: spring-controllers |

## Tier 1: unit tests

Tier 1 answers one question: does this function do what it says, in isolation? It calls exported functions directly and
asserts on their return values, thrown errors, or (for a builder) the text a builder renders. It never asserts on
generated _file_ content — a tree of `.kt`/`.ts` files written to disk, or a snapshot under `test/output/` — that is
tier 2's job, and a tier-1 test that needs a generated tree to exist is written in the wrong tier. `deno task test` runs
it; no Docker, no network (see the `parse/` note below), no generated output.

The convention every test in this tier follows:

- `it`, never `test` — `@std/testing/bdd`'s `it`, consistently, replacing an earlier mix of the two.
- `import { expect } from '@std/expect'`, never the `@std/expect/expect` subpath.
- Literal `\n`, never `EOL` from `node:os` — see the one deliberate carve-out below.
- One top-level `describe` per exported symbol, colocated as `<symbol-file>.test.ts` beside the file it covers.
- No `stub(fs, ...)`. Verified: zero occurrences anywhere under `packages/` or `test/`.
- Real IO against a temp directory (`Deno.makeTempDir`, cleaned up in `afterEach`) when a function's contract is IO
  itself and cannot be tested any other way — e.g. `packages/core/src/codegen/generator.test.ts`,
  `packages/core/src/parse/parser.test.ts`, and `packages/core/src/utils/file-system.utils.test.ts`.

**The `EOL` carve-out.** `SourceBuilder`/`StringBuilder` default `newLine` to `os.EOL` (`@default os.EOL` on
`StringBuilderOptions.newLine`, `packages/core/src/utils/string-builder/options.ts`), so on Windows an unpinned builder
emits `\r\n` and every `\n`-literal expectation in the suite would fail. Every expectation in the suite except one
therefore constructs its builder with `newLine: '\n'` pinned explicitly. The one exception is
`packages/core/src/utils/source-builder.test.ts:28` (`'should initialize with default options'`), whose entire purpose
is to check that documented default — asserting it against `defaultSourceBuilderOptions.newLine` (the same constant the
constructor reads) would be tautological, so it imports `EOL` from `node:os` independently instead, and a
`CONVENTION CARVE-OUT` comment at the top of the file tells a future `node:os` sweep not to delete that import. Tier 2's
output test pins the same `newLine: '\n'` for the same reason, at `test/output-tests/output.test.ts:22` — the generated
line ending is a _setting_, not a language constant, and the committed snapshots depend on it being pinned to `\n`
rather than whatever the CI or contributor's OS happens to default to.

**Pinning `newLine` is mandatory for any test that renders builder output**, and `KotlinFileBuilder` and
`TypeScriptFileBuilder` make that slightly more than a one-word option: neither constructor takes a
`Partial<...GeneratorConfig>`, so the idiom is:

```ts
new KotlinFileBuilder(undefined, { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig);
```

(and the `TypeScriptFileBuilder`/`defaultTypeScriptGeneratorConfig` equivalent). **The `as` cast is necessary, not
laziness.** `defaultKotlinGeneratorConfig` is typed `DefaultGenerationProviderConfig<KotlinGeneratorConfig>`
(`packages/core/src/codegen/generator.ts`), which is defined as
`Omit<T, keyof OpenApiGeneratorConfig> & Partial<Pick<T, keyof OpenApiGeneratorConfig>>` — it makes every field
`KotlinGeneratorConfig` inherits from the base `OpenApiGeneratorConfig` (including `indent`) _optional in the type_,
even though the literal object actually sets `indent: { type: 'spaces', count: 4 }` at runtime. So
`{ ...defaultKotlinGeneratorConfig, newLine: '\n' }` has a _type_ where `indent` is possibly `undefined`, which fails
`deno check` with `TS2345` when the object needs to satisfy plain `KotlinGeneratorConfig` (where `indent` is required) —
verified at runtime that the spread does preserve `indent` regardless; only the type is the problem. 44 test files (16
under `packages/kotlin`, 28 under `packages/typescript`) carry this exact cast today. The next person to see it and
assume it is cargo cult should read this paragraph first.

**`dedent(n)` from `@goast/test-harness`** (`test/harness/string.utils.ts`) strips `n` leading spaces from every line of
a template literal, so a test can indent its expected multi-line string to match the surrounding code without that
indentation becoming part of the string under test. It deliberately does **not** touch line endings — there is no
line-ending helper in the harness at all. Its predecessor, `normalizeEOL`, rewrote `\n` to the host's `EOL`, which made
every expectation depend on which OS ran the suite; two tests could pass on Windows and fail on Linux for reasons
unrelated to what they asserted. `normalizeEOL` was retired for exactly that reason once literal `\n` (pinned via
`newLine: '\n'`, above) replaced every host-dependent expectation it used to paper over.

**`derefAt`, `derefSchemaAt`, and `createTransformerContext` are _not_ exported from `@goast/test-harness`.** They live
beside the production code they exercise, as `packages/core/src/parse/deref.test-utils.ts` (`derefAt`, `derefSchemaAt`)
and `packages/core/src/transform/transform.test-utils.ts` (`createTransformerContext`), and every consumer imports them
by relative path — there is no barrel export for either file. This was not the original plan: `derefAt`/`derefSchemaAt`
were meant to live in the harness so `transform`/`collect` tests could reuse the real `createDerefProxy`
(`packages/core/src/parse/deref-proxy.ts`) instead of a hand-rolled stand-in — a plain object with a `$src` field passes
the shape check but silently skips the proxy's `$ref`-fallthrough behaviour that most transform code actually depends
on. Doing that would have required `test/harness` to import from `packages/core`, and `createDerefProxy` is deliberately
not part of core's public API (absent from `packages/core/mod.ts`), so the harness would have had to reach it by a
relative import outside its own directory. That was checked empirically, not assumed: running
`deno task npm:test-harness` with such an import in place made `dnt` abort with:

```
Error stripping prefix of .../packages/core/src/parse/deref-proxy.ts with base .../test/harness
```

because `dnt` refuses to bundle a file outside the project root it was invoked with. So both fixture files are colocated
inside `packages/core` instead, named with the `*.test-utils.ts` suffix specifically because Deno's test discovery does
not treat that suffix as a test file and `deno task npm:core` does not ship it in the published package — both were
verified, not assumed. If you find yourself wanting to "tidy up" by moving these into the harness, re-run that
`npm:test-harness` check first; it will fail the same way it did before.

`derefAt(path, value, ref?)` wraps `value` in a real `createDerefProxy` at the given `$src.path`; `derefSchemaAt` does
the same but recurses into nested schema keys (`allOf`, `anyOf`, `oneOf`, `properties`, etc.) first, so a nested schema
is itself a proxy at its own sub-path — the shape the real parser produces, and the shape collection's and
transformation's `$src`-keyed dedup needs to behave the way it does in production. `createTransformerContext` builds the
same context shape `transformOpenApi` builds internally, kept in lockstep with that literal deliberately: a test-only
context that only fills the fields one function happens to read would still pass when that function starts reading
another field, turning a real regression into a green suite.

**Hazard: `derefAt` hardcodes `$src.file` to `'test.yml'`.** Collection and transformation both key their dedup maps on
`${$src.file}#${$src.path}`, so two fixtures built at the same `path` — even meant to represent objects in two different
documents — silently collapse into one, with no error; the second is simply dropped. This already produced one test that
looked like it was asserting real deduplication but was actually just observing the fixture collide with itself. The
hazard is documented on `derefAt` itself, and it is worth repeating here because it is the single easiest way to write a
test that looks like it proves something and proves nothing: give every fixture in a multi-document or multi-object
scenario its own `path`.

`test/compile/` and `test/output/` are off limits to tier 1 — neither is read nor written by anything under
`packages/**/*.test.ts` — and a tier-1 test that needs generated output to exist to make its assertion belongs in tier 2
or tier 3 instead. One deliberate exception to "no network": `packages/core/src/parse/parser.test.ts` stubs
`globalThis.fetch` (not the filesystem) to cover `OpenApiParser`'s URL-download failure path without depending on a real
host; a real request to a refused port measured ~2s on this host, well past this file's tens-of-milliseconds budget, and
a real successful download would make tier 1 network-dependent, so that branch is left uncovered deliberately rather
than faked.

**A pointer, not a repeat:** several tier-1 tests in this repo pin behaviour that is a known, real generator or
transform defect — not the behaviour anyone would design on purpose. Every one of them is catalogued in
[`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`](../docs/superpowers/plans/2026-07-25-generator-bug-fixes.md),
each entry naming the tier-1 test that pins it. Read a surprising assertion in a tier-1 test as a possible pointer to
that register before assuming either the test or the code is wrong.

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
  container. Every `.ts` file in the unit is handed to `deno check`, not a barrel: entering through a barrel and
  following imports checks only what the barrel reaches, and 41 of these 108 units contain at least one file it does not
  — 58 files, of which 20 are generated model files the generator emits and never exports. Those are exactly the files
  defects 18, 21 and 22 are about, so an entry-point gate was blind to the defects it exists to catch.
- **162 containerized TypeScript** units (`angular-services`, `k6-clients`, `easy-network-stub`) — compiled with `tsc`
  inside the `node` image, because these profiles' output assumes npm packages a bare `deno check` doesn't have.
- **512 Kotlin** units (ten profiles — `models`, `okhttp3-clients`, `spring-reactive-web-clients`, and
  `spring-controllers` in both its plain and `-strict` forms, each crossed with Spring Boot 3 and 4) — compiled in one
  Gradle build inside the `kotlin` image.

**Docker is required for the containerized TypeScript and Kotlin groups.** On a checkout without it,
`deno task test:compile` does not degrade gracefully — it produces one real `requireDocker` failure per containerized
group plus a "The compile step did not run" failure for each of their 674 units. The host group is the part that runs
anywhere, and running only it takes naming it:

```bash
deno task test:compile:host
```

**Diagnostics are snapshots, the same shape as tier 2's error snapshots but inverted.** A unit that compiles cleanly has
**no committed file at all** — absence _is_ the pass, not "not yet checked." A unit that fails commits its errors to
`test/compile/<language>/<profile>/<version>/<spec>.txt`. Fixing a generator defect therefore shows up in a diff as a
**deletion**, not as changed content — the same reviewability tier 2 gets from a `.error.txt` disappearing, applied here
to individual diagnostics instead of a whole generation run. Check mode enforces this in both directions: a
newly-failing unit with no committed snapshot fails the run, and (`verifyCompileDiagnostics` in
`test/harness/compile/verify.ts`) a committed snapshot for a unit that now compiles cleanly _also_ fails the run rather
than passing silently — a fix has to land as a reviewed deletion, not disappear on the next write-mode run.

149 snapshot files are committed today (126 Kotlin, 23 TypeScript, 812 diagnostics, 100,136 bytes total). **These record
real, unfixed generator defects, not accepted behaviour** — see
[`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`](../docs/superpowers/plans/2026-07-25-generator-bug-fixes.md)
for the catalog. Do not read a committed diagnostics file as a specification of correct output.

The commands:

```bash
deno task test:compile        # write mode: regenerates snapshots, changes show up in git status
deno task test:compile:check  # check mode: the CI-equivalent, fails on any drift
```

A full check-mode pass measures 12m47s (14 passed, 816 steps) on a warm image cache, of which the Kotlin group is
12m10s. The other three groups together are 19s. Budget above 15 minutes for any job timeout.

**No CI job runs this tier yet.** Wiring it into `.github/workflows/` belongs to phase 8 of the testing-strategy spec.
Until then the only thing enforcing a committed diagnostics file against reality is somebody running
`deno task test:compile:check` by hand, so treat a green pull request as saying nothing about tier 3.

**Tier 3 is opt-in via `GOAST_COMPILE`.** `deno.json`'s `test.include` covers all of `test/`, so without a guard
`deno task test` (and every plain `deno test -A`) would discover `compile.test.ts` and start a container — breaking the
rule that tiers 1 and 2 never touch Docker. `compile.test.ts` registers zero tests when `GOAST_COMPILE` is unset, so
`deno test -A test/compile-tests` runs almost nothing by design; that is not the suite being broken. `orphans.test.ts`,
below, is deliberately outside that guard, so it does run in the everyday suite, and it needs no Docker.

`test/harness/docker.test.ts` is under the same guard, which is why both `test:compile` tasks name it alongside
`test/compile-tests`. It is a tier-1 unit test file by location, but its `buildImage`/`runContainer` coverage builds a
real image and starts real containers, and registering those with an `ignore: !hasDocker` flag does not keep tiers 1 and
2 Docker-free — it only keeps them _runnable_ without Docker. On a machine that has Docker they ran, and took the unit
suite from ~17s to ~60s.

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
result as equivalent to one. `deno check` also refuses to build a module graph containing any file it cannot parse — it
reports that one file and type-checks nothing else — so `runDenoCheck` records the parse failure, drops that file from
its root list, and runs again until the graph loads. That is why the host group reports one diagnostic per unparseable
file where the containerized group reports four: `tsc` recovers from a syntax error and keeps reporting, Deno's parser
does not.

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

**An orphan has to be deleted by hand; no mode clears it.** `verifyCompileDiagnostics` removes a stale snapshot only for
a unit `discoverCompileUnits` still finds, and an orphan by definition has no unit — so `deno task test:compile` will
not clear it however many times it is run. The failure says so, and names the files.

## Tier 4: integration

Tier 3 proves the generated code compiles. Tier 4 asks a different question again: does it put the right bytes on the
wire, and hand back the right value to its caller? A unit that type-checks can still build the wrong request body, drop
a parameter, or mis-encode a path segment — none of which `deno check` or `tsc` can see, because all of those are
runtime behaviour, not a type error.

**The case table is the single source of truth.** `test/cases/cases.ts` declares 19 cases, each one API call: the
request it must produce (`expectRequest`), the canned response the reference server hands back (`response`), and what
the generated client must return to its caller (`expectResult`). Both directions read the same fields, from opposite
sides: in the client direction `response` is what the reference server hands back and `expectResult` is what the
generated client must return, while in the server direction `response` is what the handwritten delegate must produce and
`expectResult` goes unused. Every consumer reads this one table, so none of them can drift out from under another:
`test/integration/oracles.test.ts` proves the table itself round-trips through a handwritten reference client and the
reference server with zero deviations — the contract proof every other tier-4 result depends on, see below;
`test/integration/fetch-clients/`, `kotlin-clients/` and `spring-controllers/` each drive _generated_ code against it;
and `test/integration-tests/orphans.test.ts` sweeps the committed artifacts against it. `casesFor(profile, direction)`
is the only path to a filtered table, so drift protection — comparing the ids a driver reported against the ids it was
asked for — computes both sides the same way.

**Drivers hardcode their arguments instead of reading the table.** `test/integration/fetch-clients/driver.ts` writes
`pets.getPet({ id: 'abc' })` literally, one call per case, rather than dispatching dynamically off `expectRequest`.
Writing the call in typed TypeScript _is_ the assertion that the generated signature is usable; reading arguments from
JSON would need a dynamic dispatch layer that erases exactly what is under test.

**Deviations are committed artifacts, the same shape as tier 3's diagnostics.** A case that conforms exactly has no
file. A case where the generated client's actual wire behaviour differs from the table gets
`test/wire/<profile>/<caseId-with-slashes-as-double-underscore>.txt`, holding one `field`/`expected`/`actual` block per
difference. `deno task test:integration` regenerates in write mode; a file disappearing on a later run means a generator
fix landed, and check mode refuses to pass with a stale file still committed — the same reviewable-deletion discipline
as `verifyCompileDiagnostics`. 90 such artifacts are committed today — 64 from the client direction (10 under
`fetch-clients`, **2** under `angular-services`, 13 each under `okhttp3-clients@sb3`/`@sb4` and
`spring-reactive-web-clients@sb3`/`@sb4`) and 26 from the server direction (6 each under
`spring-controllers@sb3`/`@sb4`, 7 each under `@sb3-strict`/`@sb4-strict`) — all traced to confirmed generator defects
in
[`docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`](../docs/superpowers/plans/2026-07-25-generator-bug-fixes.md)
(defects 20, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52 and 53) — not fixed here, per this phase's rule that a generator
fix changes generated output and belongs to its own phase.

**An absent artifact means "no declared field deviated," not "the request was wire-correct."** This is the single most
misreadable thing about this tier, for six concrete, verified reasons:

- `diffRequest` compares only headers a case's `expectRequest` **declares**. 11 of the 19 cases declare no headers at
  all, so an empty artifact for those says nothing about header correctness beyond the fields the table happened to
  name.
- `PetsClient` and `WidgetsClient` are constructed with `authorization`/`x-api-key` headers that every request the
  instance makes carries — so, e.g., `getPet/ok`'s actual request has an `authorization` header nothing in its
  `expectRequest` declares, and it is invisible to the diff for that reason, not because it is correct.
- `updatePet/json` declares no `content-type` in its `expectRequest`. The generated client never sets one on any
  body-bearing request (see defect 20's extended scope, linked above), but because that case's table entry doesn't name
  the header, the defect that is very much occurring on that request produces **no artifact at all** — it only becomes
  visible on cases that do declare a `content-type` (`addPetNote/text`) or that declare a body shape the missing header
  derails (`updatePet/json` and `updatePet/form`'s bodies still deviate, just not via a header diff).
- **The two Kotlin drivers do not report results with equal fidelity.** `OkHttp3Driver` serializes the whole returned
  model through the generated `Serializer.jacksonObjectMapper`, so every field the client decoded reaches `diffResult`.
  `ReactiveDriver` has no JSON library on purpose (see its file comment) and hand-projects a fixed subset — `Pet` to
  `{id, name, age}`, `Widget` to `{id, name, price}`, `BlobRef` to `{id}` — so eight of `Pet`'s eleven fields never
  reach the diff for that family. Nothing is hidden today: every `expectResult` the reactive driver is compared against
  names only fields inside those projections, checked case by case. But if that family ever populated a field the server
  never sent, `okhttp3-clients` would produce a `result` artifact and `spring-reactive-web-clients` would produce none —
  which would read as the reactive client being _more_ correct rather than less observed.
- **`diffResponse` has the mirror image of the same blind spot, on the server direction's response headers.** It
  compares only headers the case's `response` **declares**, for the same reason `diffRequest` does — a real response
  carries `date`, `content-length` and `transfer-encoding` that no case names. But 8 of the 19 cases declare no response
  headers at all — `deletePet/noContent`, `uploadPetPhoto/ok`, `allLocations/ok`, all three `styleMatrix` cases,
  `pathStyleSimple/ok` and `getEncoded/ok`, every one of them a bodyless response — so for those an empty artifact says
  nothing about what headers the generated server actually sent. The other eleven all declare
  `content-type: application/json`, and exactly one header in the whole table is a generator-controlled response header
  rather than a content type: `getWidget/ok`'s `x-rate-limit: 42`.
- **`uploadBlob/ok` conforms while sending no `Content-Type` header at all,** for an operation whose request body the
  spec declares as `application/octet-stream`. It conforms only because that case's `expectRequest` names no headers,
  and the first bullet's rule then applies: `diffRequest` compares a header exclusively where the case declares it.
  Every case's `Accept` header goes unchecked for the same reason. So a clean case on any client leg — the 17 clean
  cases on the `angular-services` leg included — is a claim about the path, the query, the body and the returned result,
  not about the full request. The fix is a case-table change (declare the header on the cases that should assert it),
  not a harness change, and it is deliberately not made here: editing `test/cases/cases.ts` would also change the
  committed `fetch-clients` artifacts, so it belongs in its own change with those diffs reviewed alongside it.

Relatedly, and stated the same way `test/integration/oracles.test.ts`'s class doc comment states it: a deviation
artifact means **the generated client differs from the declared table** — this tier does not by itself adjudicate
whether the table or the generator is the one that's wrong. A separate classification pass, done once per target and
recorded in that phase's task report, is what turned each of these 90 artifacts into a confirmed generator defect rather
than leaving that judgment implicit: the original ten for `fetch-clients`, the 52 across the four Kotlin client units
for phase 6a, the 26 across the four `spring-controllers` units for phase 6b, and the 2 for `angular-services` in phase
7a.

**The oracle-agreement test is load-bearing, not one test among many.** `test/integration/oracles.test.ts` proves the
case table itself is representable on the wire and round-trips through a handwritten reference client and reference
server that share no code with each other or with any generator. Nothing else in this tier means anything until that
test passes — a table that cannot even round-trip through two oracles built expressly to agree with it cannot be trusted
as the standard a generated client is measured against.

**`test/specs/integration/` is a corpus root like any other.** The kitchen-sink spec that backs the case table lives
there and is picked up by `discoverSpecs()`, so it also gets ordinary tier-2 snapshots under `test/output/` and tier-3
compile coverage under `test/compile/`, exactly like every other spec in the corpus. Tier 4 itself imports (or, for
Kotlin, compiles together with a driver) the generated client from the **committed**
`test/output/typescript/fetch-clients/integration/kitchen-sink/` tree and its four Kotlin siblings under
`test/output/kotlin/<profile>/integration/kitchen-sink/`, never a freshly-generated one, so what a driver runs against
is exactly what a reviewer already saw in a tier-2 diff.

**`fetch-clients` needs no Docker.** Unlike tier 3, nothing in this leg starts a container or takes minutes — the whole
run is a loopback HTTP server and one `deno run` subprocess — so it needs no opt-in guard and runs as part of plain
`deno task test`, which is a feature — though not the feature "catches drift": `deno task test` is plain `deno test -A`,
which resolves to **write** mode locally (see "Snapshot modes" above), so a plain everyday run rewrites and deletes wire
artifacts rather than failing on them. What the everyday loop genuinely catches is a non-zero driver exit, a mismatch
between the case ids a driver reported and the ids it was asked for, and a surplus-request count that doesn't match the
unmatched-case count — real failures, just not the same thing as "the recorded deviations are still accurate." Catching
drift in the deviation artifacts themselves needs `deno task test:integration:check`, the same way tier 2's drift needs
`deno task test:output:check`.

**Phase 6 adds four Kotlin targets, gated behind Docker.** `okhttp3-clients@sb3`/`@sb4` and
`spring-reactive-web-clients@sb3`/`@sb4` are driven the same way tier 3 compiles Kotlin — from inside the `kotlin`
Docker image — behind the same `GOAST_INTEGRATION` guard tier 3 uses `GOAST_COMPILE` for, via
`deno task test:integration:kotlin[:check]`. `test/integration/targets.ts`'s `WIRE_TARGETS` is the single source of
truth for which `test/wire/<profile>/` directories are legitimate; `test/integration-tests/orphans.test.ts` sweeps every
entry in it, not just `fetch-clients`.

A few things about the Kotlin leg are easy to get wrong reading only the wire artifacts:

- **The reference server binds `0.0.0.0`, only here.** `startRefServer(cases, { hostname: '0.0.0.0' })`
  (`test/integration/kotlin-clients/integration.test.ts`) is a deliberate, owner-authorised relaxation of this repo's
  usual "loopback only" rule, scoped to containerized runs: a driver running inside the `kotlin` image reaches the host
  through `host.docker.internal`, which resolves to the container's bridge gateway address, not `127.0.0.1` — a
  loopback-bound server would simply never receive the container's requests. The server's `baseUrl` deliberately stays
  loopback; the container's own origin is built from the new `port` field instead.
- **A synthesized single-project Gradle build, not the committed output tree's own build file.** `synthesizeDriverBuild`
  (`test/integration/kotlin-clients/build.ts`) writes a `build.gradle.kts` that compiles the committed
  `test/output/kotlin/<profile>/integration/kitchen-sink/` tree together with one handwritten driver per family
  (`drivers/okhttp3/OkHttp3Driver.kt`, `drivers/reactive/ReactiveDriver.kt`), then `gradle run` executes it. The image's
  `ENTRYPOINT` hardcodes `compileKotlin` for tier 3's purposes, so `runContainer` overrides it with `gradle … run` for
  this leg.
- **A driver hardcodes its calls, the same discipline as `fetch-clients`' driver, and prints one line per case.** Each
  case is a real, typed call into the generated client — writing it in typed Kotlin at all _is_ the assertion that the
  generated signature is usable — and the driver prints a `##GOAST-CASE##{…}` line per case, which the harness parses
  back out of Gradle's own stdout/stderr.
- **The image's warm dependency cache needed two more coordinates, at runtime, not compile time.**
  `kotlinx-coroutines-core` (for `runBlocking`) and `kotlinx-coroutines-reactor` (for WebFlux's `await*` bridging a
  Reactor `Mono`/`Flux`) are never imported by the generated code itself, only by the driver that calls it — see
  `test/docker/kotlin/warmup/build.gradle.kts`.

### The server direction

**Phase 6b adds the other direction: four `spring-controllers` units, behind the same Docker guard.** Everything above
drives a generated _client_. This leg inverts the roles. The generated code is a Spring Boot application running in the
`kotlin` image, and `test/harness/ref-client.ts` — the same handwritten reference client the oracle-agreement test uses
— issues each case's `expectRequest` against it over real HTTP from the host. What is under test moves to the other side
of the wire with it: a client target is measured on the request it _builds_ and the value it _returns to its caller_, a
server target on what Spring _bound_ out of a spec-conforming request and on the response the generated controller
_emits_. The two directions share the case table and nothing else, which is why `casesFor(profile, direction)` takes a
direction at all. All 19 cases run in both.

**Handwritten delegates are the oracle, and they do two jobs.** The generated `*ApiDelegate` interfaces are implemented
by hand under `test/integration/spring-controllers/delegates/`. Each method returns the response its case declares — so
the wire diff can compare status, headers and body against the table — and asserts the parameters Spring handed it,
through `expectParam` in `delegates/common/Expectations.kt`. The response half is what a client target has no way to
exercise; the assertion half is the only way a mis-bound parameter becomes visible at all, since the sole channel a test
on the host can observe is the HTTP response. A parameter bound wrongly has to be turned into a _distinguishable
response_ or it is not observed.

**Four units: both strictness flavours crossed with both Spring Boot lines.** `spring-controllers@sb3` and `@sb4` are
generated with `strictResponseEntities: false`, `@sb3-strict` and `@sb4-strict` with it on. `SERVER_UNITS` in
`test/integration/spring-controllers/build.ts` is the single source of truth and each entry names the delegate source
directories its unit compiles.

**The delegate sources are split into four directories, for a different reason each:**

- `common` — all four units. The Spring Boot application class, the `expectParam`/`json`/`readPart` helpers and the
  case-data tables, and `GoastExceptionHandler`. Nothing here depends on the flavour or the Boot line.
- `lenient` and `strict` — two units each. These are genuinely different implementations rather than a copy with a
  tweak: a lenient delegate returns `ResponseEntity.status(n).body(x)` and can express any status at all, while a strict
  delegate must route every response through the generated per-operation response-entity class's factories. Keeping them
  in separate directories rather than branching inside one file is what lets each read as a straight-line statement of
  what that flavour can express — which matters, because what the strict flavour _cannot_ express is one of this leg's
  findings.
- `lenient-sb3` and `lenient-sb4` — one unit each, holding **one method** apiece. The generated lenient `getWidget`
  returns `ResponseEntity<Any?>` under Spring Boot 3 and `ResponseEntity<Any>` under Spring Boot 4, and
  `ResponseEntity<T>` is invariant in `T`, so no single override satisfies both. The two files are otherwise identical
  and both take their case data from `CaseData.kt`, so what is duplicated is a type argument, not behaviour. The strict
  flavour needs no equivalent split: its delegates return the generated response-entity type, which absorbs the
  difference.

**Three status codes report the delegate's own failures.** `GoastExceptionHandler` (in `delegates/common`) is wired into
every generated controller through the `@Autowired(required = false) ApiExceptionHandler?` each one accepts, and maps a
delegate-thrown exception to a `text/plain` response:

| Status | Meaning                                                                                       | Deterministic? |
| ------ | --------------------------------------------------------------------------------------------- | -------------- |
| `599`  | `MISMATCH …` — an `expectParam` assertion failed: Spring bound a parameter to the wrong value | yes            |
| `598`  | `UNEXPRESSIBLE …` — the delegate cannot construct the response the case declares at all       | yes            |
| `597`  | `UNEXPECTED …` — something this phase did not model; interpolates the framework's own message | **no**         |

**A `59x` means the request reached the delegate; a Spring `4xx`/`5xx` means it never got that far.** This is the most
useful distinction in the whole leg. A `599` or `598` body is text this repo wrote, so the artifact names the exact
parameter or the exact inexpressible response — and it simultaneously proves that routing, media-type negotiation and
body binding all worked, because none of that code ran otherwise. A status carrying Spring's own error-attribute shape
(`timestamp`, `path`, `status`, `error`, `requestId`) means the opposite: the failure happened _before_ the delegate.
Argument resolution runs before the generated controller's `try`/`catch`, so no handler here can intercept it.
`spring-controllers@sb3/updatePet__form.txt` is that case and is the reference example worth reading first.

`597` is deliberately left non-deterministic — it interpolates a framework exception's `message`, which can carry an
identity hash, a buffer offset or a temp path. Treat a `597` in a committed artifact as a finding to investigate rather
than a snapshot to accept. None of the 26 committed artifacts is a `597` today.

**Spring's own error bodies are stabilized, narrowly.** `stabilizeFrameworkErrorBody`
(`test/integration/spring-controllers/stabilize.ts`) substitutes the _values_ of `timestamp` and `requestId` with
`<nondeterministic>`, and only when the body is a JSON object carrying all five of Spring's error attributes — no
kitchen-sink schema declares a property named `timestamp` or `requestId`, so it can never touch a body the generated
code produced. It is a value substitution rather than a key removal on purpose: the artifact has to keep showing that
Spring's error shape came back rather than the delegate's, because "the request never reached the delegate" is a
materially different finding from "the delegate answered wrongly". Same rule as `IGNORED_HEADERS` in `wire.ts` —
normalize what the runtime controls, never what the generator controls.

**The container arrangement is the reverse of the client leg's.** There the reference server ran on the host bound to
`0.0.0.0` and the driver reached it from inside the container; here the _application_ is in the container and the
reference client runs on the host, so the container publishes `SERVER_PORT` and the host connects to
`http://127.0.0.1:<hostPort>` — no `0.0.0.0` relaxation is needed in this direction. `synthesizeServerBuild`
(`test/integration/spring-controllers/build.ts`) writes a single-project `build.gradle.kts` compiling the committed
`test/output/kotlin/spring-controllers@*/integration/kitchen-sink/` tree together with the unit's delegate directories,
and the image's `ENTRYPOINT` — pinned to tier 3's `compileKotlin` — is overridden with `gradle … run`, the application
plugin's task, with `MAIN_CLASS` pointing at the harness's own `GoastApplication`. Readiness is polled on a
`/__goast-readiness` endpoint before any case is issued, so a slow Boot start cannot be mistaken for a failing case.

**What this direction structurally cannot observe.** The client direction's blind spots are listed above; this one has
its own, and they matter for the same reason — an absent artifact is a positive claim here too.

- **The `session` cookie parameter.** `spring-controllers` drops `cookie`-location parameters entirely: the generated
  `allLocations` signature is `(pathParam, queryParam, xHeaderParam)`, three parameters for the four locations the spec
  declares. There is nothing for the delegate to receive it into, nothing to assert, and an ignored cookie changes no
  response — so `allLocations/ok` conforms and writes **no artifact** in any of the four units. That clean result is not
  evidence the cookie location works. Defect 43 records it, and the client direction is where it is observable, because
  there the generated code has to emit the cookie and does not.
- **The auth headers.** `createPet/created` declares an `authorization` header and the five `getWidget` cases declare
  `x-api-key`, because a client is expected to send them. A generated controller has no parameter for either — they are
  security-scheme headers rather than declared operation parameters — so the delegate cannot assert them and their
  presence or absence changes no response. Those cases are measured on their responses only, in this direction.
- Both are the same shape of limitation, and it generalizes: this direction can only observe a request parameter that
  the generated signature gave the delegate somewhere to receive. A parameter the generator drops is invisible here
  precisely _because_ it was dropped, which is the one failure mode a server-side oracle cannot catch on its own.

### The Angular leg

**Phase 7a adds `angular-services`, the first tier-4 target that has to be _compiled_ before it can be driven.**
Structurally it is phase 6a's Kotlin client leg again — a handwritten driver with hardcoded calls runs in a container,
reaches the in-process reference server on the host through `host.docker.internal`, and prints one `##GOAST-CASE##` line
per case — but the runtime is tier 3's `node` image rather than the `kotlin` one, and what runs is JavaScript that `tsc`
emitted from the committed tree. `test/integration/angular-services/build.ts` holds the tsconfig and the container-side
shell pipeline, `driver/driver.ts` the 19 calls, and `integration.test.ts` the leg itself, behind the same
`GOAST_INTEGRATION` guard as everything else here. **2 of the 19 cases deviate** — the smallest artifact count of any
client target so far, against `fetch-clients`' 10.

**The generated services are instantiated with `Injector.create`, not `TestBed`.** `ApiBaseService` initializes its
fields with `inject(ApiConfiguration)` and `inject(HttpClient)`, so a service cannot be constructed with `new` — it
needs a real injection context. It needs nothing else a platform provides, though, and one provider per service in a
plain `Injector.create` is enough; `TestBed` would require `platform-browser-dynamic/testing` and therefore a DOM this
leg has no use for.

**`FetchBackend` stands in for `provideHttpClient(withFetch())`, which is what the spec named — so this is a deliberate
deviation, recorded rather than glossed over.** `provideHttpClient(...)` returns `EnvironmentProviders`, which
`Injector.create` does not accept, and taking it would mean reaching for an `EnvironmentInjector`, which without a
platform drags in exactly the DOM dependency the paragraph above avoids. Providing `FetchBackend` directly as the
`HttpHandler` selects **the same backend** `withFetch()` selects; the substitution drops only the interceptor chain.
That is equivalent for everything this tier measures: interceptors are consumer code, no generated `angular-services`
code emits or registers one, and nothing in the case table can observe one. It is not equivalent for everything, and the
boundary is worth knowing — defect 54's one claim about `HttpXhrBackend`, the backend `provideHttpClient()` selects
_without_ `withFetch()`, is unmeasurable on this leg for precisely this reason, and is registered as PLAUSIBLE rather
than confirmed because of it.

**`zone.js` and `@angular/compiler` are both required, and each surfaces as a crash rather than a warning when it is
missing.** `FetchBackend` injects `NgZone`, and `new NgZone({})` throws unless a Zone has been loaded, so
`import 'zone.js'` is the driver's first line. `@angular/compiler` is needed because `@angular/common` ships
partially-compiled and nothing here runs the Angular linker: without it the first injectable resolution fails with
`The injectable 'PlatformNavigation' needs to be compiled using the JIT compiler, but '@angular/compiler' is not available.`
It is one of two dependencies this leg added to `test/docker/node/package.json` — `@angular/compiler` at `19.2.0`,
matching `@angular/core`, and `@types/node`, which the driver's own tsconfig asks for and whose absence was previously
producing a `TS2688` that the build's deliberate `|| true` on `tsc` swallowed. And adding it re-runs tier 3's
containerized TypeScript group, because the image's content hash is part of that gate's tag.

**The emitted JS gets `.js` extensions added, the committed tree is never touched, and that rewrite is correct output
handling rather than a papered-over defect.** `tsc` copies a relative specifier through verbatim, so the generated
tree's `'../utils/api-base-service'` survives into the emitted JavaScript and Node's ESM loader refuses to resolve it.
`buildCommand()` therefore `sed`s `.js` onto every relative specifier under `OUT_DIR` — and only there, collapsing any
`.js.js` so a re-run is idempotent — while the tree stays bind-mounted **read-only** at `/tree`, so what is compiled is
byte-identical to what a reviewer saw in a tier-2 diff. Extensionless specifiers are the _right_ output for this target:
every real Angular consumer bundles, and `moduleResolution: "bundler"` is what the generated code is written against.
Contrast `k6-clients`, where the runtime _is_ the loader and no bundling step exists — there the same extensionless
import stops the generated code from loading at all, which is a genuine generator defect and part of why that target is
still undriven (see the closing note of
[`docs/superpowers/plans/2026-08-09-tier-4-angular-services.md`](../docs/superpowers/plans/2026-08-09-tier-4-angular-services.md)).

**The driver supplies the two auth headers itself, per call, because the generated client has no code path for them.**
`createPet/created` declares `authorization: Bearer secret-token` and all five `getWidget` cases declare
`x-api-key: secret-key`. `angular-services` emits no security-scheme code at all — the same finding phase 5 made for
`fetch-clients` — and unlike that target there is no client-constructor `headers` option either: `ApiConfiguration`
carries only `rootUrl`. What every generated method _does_ accept is an optional second `HttpContext` parameter,
threaded straight into the `HttpRequest` by `RequestBuilder.build()`. So the driver defines an `HttpContextToken`
holding a header record and installs a small `HttpHandler` (`ExtraHeadersHandler`) that wraps `FetchBackend`, reads the
token off each request and sets those headers before delegating. With no interceptor chain to hook into, that handler
_is_ the interceptor chain, registered by hand as the thing `HttpClient` calls. It is narrower than every other leg's
approach — `fetch-clients` and both Kotlin drivers add the header to every request an instance ever makes — so here only
the calls that declare a header carry one, and the auth-header blind spot listed above is correspondingly smaller on
this leg.

**Both artifacts, and what neither of them says.** `test/wire/angular-services/updatePet__form.txt` records a `form`
body expected and a `json` body sent; `allLocations__ok.txt` records the absent `session` cookie. They are defect 44 and
defect 43 in the register. Two things to know before reading them:

- `allLocations__ok.txt` is **byte-identical** to `fetch-clients`', although the underlying defect is _worse_ here.
  `AllLocationsParams` declares `session?: string` and the method body never reads it, so this generated type promises a
  parameter its implementation silently discards, where `fetch-clients` at least drops the parameter from the signature
  outright. The wire cannot carry that difference and neither can the artifact; only defect 43's entry states it.
- The 8 cases where `fetch-clients` deviates and `angular-services` conforms all trace to three features Angular's
  `RequestBuilder` has and the fetch client's `UrlBuilder`/body handling lacks — explicit request content types,
  path/query percent-encoding, and OpenAPI `style`/`explode` serialization. Each is recorded as a
  `**Tier 4 (angular):**` element on defects 20, 41 and 42, since "the same generator family gets this right in another
  target" narrows those fix sites considerably. There is **no** case in the other direction: nothing on this leg
  deviates where `fetch-clients` conforms.

One finding here has no artifact and could not have one: the generated `errorResponseTypes` re-decode branch in
`utils/angular-service.utils.ts` does nothing for any operation this generator emits, and is unguarded on the one path
that would reach it. It is registered as defect 54. And `uploadBlob/ok` conforms while sending no `Content-Type` at all,
because `RequestBuilder.body` takes the content type from a `Blob`'s own `type` and `new Blob(['hello'])` has none — the
sixth blind-spot bullet above covers why the tier cannot see that, and whether an `application/octet-stream` operation
_should_ send the header is a question this leg does not answer.

**Phase 7 still owes `k6-clients` and `easy-network-stub`,** each behind the same guard.

`k6-clients` is blocked before it can drive a single case, and both blockers are measured and registered rather than
left to be rediscovered — defects 55 and 56. k6 cannot resolve the generated client's extensionless relative imports (k6
_is_ the loader; there is no bundling step), and the request builder imports a polyfill from a third-party CDN at run
time, so the generated client cannot load air-gapped either. Neither is a per-case deviation: both stop the module
loading, which means that leg has a design question to answer first. **All 19 cases would be undriven, and 19 absent
artifacts must not be written, because in this tier an absent artifact is a positive claim that the case conforms.** A
target-level record of the load failure — with the per-case conformance claim explicitly suppressed — is the honest
shape, and tier 3's per-unit diagnostics file is the precedent. Rewriting the imports so the cases _can_ be driven is
the other option, and it needs arguing on the record rather than assuming, because it would mean the leg no longer runs
byte-identical reviewed output.

The commands:

```bash
deno task test:integration                     # write mode: fetch-clients, no Docker
deno task test:integration:check               # check mode: fetch-clients, no Docker
deno task test:integration:kotlin              # write mode: the four Kotlin client targets, needs Docker
deno task test:integration:kotlin:check        # check mode: the four Kotlin client targets, needs Docker
deno task test:integration:controllers         # write mode: the four spring-controllers units, needs Docker
deno task test:integration:controllers:check   # check mode: the four spring-controllers units, needs Docker
deno task test:integration:angular             # write mode: the angular-services target, needs Docker
deno task test:integration:angular:check       # check mode: the angular-services target, needs Docker
```

## Layout

```
test/
  harness/            # the test harness, published locally as @goast/test-harness
    snapshot/         # the snapshot engine (mode, tree, text-diff, normalize, verify-*, orphans)
    compile/          # the compile-gate engine (unit discovery, diagnostic parsers, verify)
    integration/      # the tier-4 wire engine (verify.ts: wireSnapshotFile, verifyWireDeviations)
    kotlin/           # the Kotlin dependency table shared between tier 3 (compile) and tier 4 (drive)
    paths.ts          # repo root and spec directory paths
    declutter.ts      # strips noise from parsed ApiData before snapshotting
    docker.ts         # docker CLI wrapper for tiers 3 and 4 (build, run, image tagging; entrypoint override)
    string.utils.ts   # dedent(n): strips template-literal indentation, deliberately EOL-agnostic (see Tier 1 above)
    ref-server.ts     # tier-4 reference server: an in-process HTTP server driven by the case table
    ref-client.ts     # tier-4 reference client: issues a case's expectRequest with raw fetch
    wire.ts           # tier-4 wire normalization and diffing (readBody, stable, diffRequest, diffResult)
  specs/              # OpenAPI corpus, one spec per file or per directory, under v2/v3/v3.1
    integration/      # the kitchen-sink spec backing the tier-4 case table (also a normal corpus entry)
  output-tests/       # tier 2: profiles.ts registry, output/core-model/orphans tests
  output/             # committed tier 2 snapshots (see "Snapshot forms" above)
  compile-tests/      # tier 3: driver (compile.test.ts), paths.ts, per-language runners, orphans test
  compile/            # committed tier 3 diagnostics (see "Tier 3: compile gate" above)
  docker/             # image contexts for the tier 3 compilers (kotlin/, node/)
  cases/              # the tier-4 case table (cases.ts, casesFor, types.ts) — the shared source of truth
  integration/        # tier-4 tests: the oracle-agreement proof, targets.ts (WIRE_TARGETS), and one driver
                      # per target — fetch-clients/ (no Docker) and kotlin-clients/ (build.ts synthesizes the
                      # Gradle build, drivers/okhttp3/ and drivers/reactive/ hold the handwritten drivers);
                      # angular-services/ compiles the committed tree with the driver in the node image
                      # (build.ts holds the tsconfig and build pipeline, driver/driver.ts the 19 calls,
                      # smoke.test.ts the one-call risk gate);
                      # spring-controllers/ is the server direction (build.ts synthesizes the Gradle build,
                      # stabilize.ts normalizes Spring's error bodies, delegates/ holds the handwritten
                      # oracle: common/, lenient/, strict/, lenient-sb3/, lenient-sb4/)
  integration-tests/  # tier-4 orphan sweep, over every WIRE_TARGETS entry (see "Tier 4: integration" above)
  wire/               # committed tier-4 deviation artifacts, one profile subdirectory per WIRE_TARGETS entry
```
