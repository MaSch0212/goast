# Corpus Expansion (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow `test/specs/` from 14 entries to 54 so tier 2 pins generator behaviour across the OpenAPI edge cases the
strategy enumerates.

**Architecture:** Pure content work on a finished machine. Every task authors a batch of OpenAPI documents in one
category, regenerates snapshots in write mode, and commits the specs together with the trees they produce. No harness,
driver, profile, or generator code changes in this phase.

**Tech Stack:** Deno 2.x, YAML/JSON OpenAPI documents, the existing `@goast/test-harness` snapshot engine.

## Global Constraints

- Deno and Docker remain the only prerequisites. This phase adds no tooling and no dependencies.
- **`deno fmt` before regenerating, never after.** `test/specs/**` is inside `deno fmt`'s scope, and the generators
  stamp source-document line numbers into doc comments via `getSourceDocLine`. Reformatting a spec after generating its
  snapshot silently invalidates every stamped line number, and check mode fails on a machine that never touched the file.
- Run every snapshot command from the repo root. `getSourceDocLine` renders paths relative to the process CWD.
- **Zero churn in pre-existing snapshots.** After regeneration `git diff --stat -- test/output` must be empty: every
  change a batch produces is a new, untracked path. A modification to a tracked snapshot means the batch changed
  behaviour for an existing spec, which is a defect in this phase, not a snapshot to accept.
- **Do not fix generator bugs here.** A new spec that crashes a generator produces a committed `.error.txt`, which is a
  truthful, reviewable record. Report it; leave the generator alone. Fixes are separate work with their own diffs.
- No network access from the corpus. Remote HTTP `$ref`s are deliberately excluded — see Deviations.
- Specs are UTF-8 with LF endings and no BOM.
- Every spec file must be valid for the version it declares. A file in `v3/` declares `openapi: 3.0.0`, in `v3.1/`
  `openapi: 3.1.0`, in `v2/` `swagger: '2.0'`.
- One commit per task, specs and snapshots together, so a category is reviewable and revertable as a unit.

## Deviations from the spec

Two items in the spec's Spec Corpus section are not implemented, both recorded here rather than silently dropped:

- **Remote HTTP `$ref`.** A corpus entry that fetches over the network makes tier 2 non-hermetic: check mode would fail
  offline and flake in CI, and the snapshot would pin a third party's document. External-file refs (`external-refs/`)
  cover the resolver path that matters; the transport does not need a snapshot.
- **Mixed spec versions in one set.** `discoverSpecs()` derives `version` from the parent directory, so a mixed-version
  set has no honest home in the layout. `multi-file/` covers multi-document parsing. If mixed-version parsing needs
  coverage it needs a discovery change, which belongs to a phase that is allowed to touch the harness.

The spec estimates "approximately 45" specs; this plan lands on 54, because splitting a concern per file is the spec's
stated principle and it beats hitting an approximate count. Task 9 amends the spec with the real number.

**No task edits an existing spec.** Where a concern belongs beside coverage that already exists — implicit discriminator
mapping next to `v3/discriminated-schemas.yml` — it gets its own new file instead. Editing a committed spec would
legitimately churn its snapshots, and that would blunt the zero-churn gate that catches accidental behaviour changes.

### Deviations taken during execution

Two departures from "no harness, driver, profile, or generator code changes in this phase", both recorded here rather
than folded in silently. Both arose in Task 5.

- **`existingFileBehavior: 'count'` (owner decision).** Generators write one file per model, so a spec containing two
  schemas whose names normalize to the same identifier aborted the whole document under the default `'error'` — three
  of Task 5's four specs committed nothing but a one-line error and pinned nothing about how their other schemas
  normalized. The plan's remedy would have been to split the colliding schemas into their own files. The owner chose
  instead to add a fourth, non-fatal behaviour to `@goast/core` (`X.kt` → `X_1.kt` → `X_2.kt`) and opt the output tests
  into it, keeping the file partition intact. The option's doc comment states its limitation: a counted file is written
  under a name nothing references, so it makes a collision inspectable, not correct. `test/output-tests/output.test.ts`
  now passes `existingFileBehavior: 'count'`.
- **The tree-content output-directory neutralizer (controller ruling).** Turning on `'count'` let generation reach
  `models.ts` for two specs for the first time, which exposed a non-determinism halt condition: a schema whose name
  normalizes to the empty string produces a file whose basename is exactly `.ts`, `extname('.ts')` returns `''`, and the
  TypeScript import resolver therefore wrote the harness's random per-run temp directory into a committed file.
  `replaceOutputDir` was applied to `state.txt` and to generation-error text but never to tree file content. Fixing the
  generator would have rendered the import as a plausible `./.ts` and destroyed the evidence, so the harness was fixed
  instead and the generator defect registered as defect 18 in `2026-07-25-generator-bug-fixes.md`. The committed
  snapshot now reads `from '<output>/models/.ts'` — visibly wrong output, honestly recorded.

A forward consequence of the `'count'` switch that nobody has acted on yet: under the old `'error'` behaviour,
`v3/name-collisions`, `v3/extreme-names` and `v3/non-ascii-names` produced only `.error.txt` files, so nothing about
their generated code was ever exercised; under `'count'` they now commit real trees, and those trees do not compile —
five `data class MyThing` declarations in one Kotlin package for `name-collisions`
(`test/output/kotlin/models@sb3/v3/name-collisions/com/openapi/generated/model/MyThing.kt` through `MyThing_4.kt`),
plus the empty-identifier
`data class (` / `export type  = {` output registered as defects 21 and 22 in `2026-07-25-generator-bug-fixes.md` for
`extreme-names` and `non-ascii-names`. The testing-strategy design spec names tier 3 — not yet built — as the only
tier that treats an edge-case spec producing uncompilable output as a failure; whoever builds tier 3 will have to
decide what it does with these three specs (exclude them, accept a known-failing compile, or something else), and
this note exists so that decision has the context that the `'count'` switch is what created the need for it.

## File Structure

Created, 40 corpus entries:

| Task | Path                                     | Isolates                                       |
| ---- | ---------------------------------------- | ---------------------------------------------- |
| 1    | `test/specs/v3/primitive-formats.yml`    | every `format` on every primitive              |
| 1    | `test/specs/v3/nullable-schemas.yml`     | 3.0 `nullable` in combination                  |
| 1    | `test/specs/v3.1/nullable-schemas.yml`   | 3.1 type arrays with `null`                    |
| 1    | `test/specs/v3/enum-schemas.yml`         | non-string and irregular enums                 |
| 1    | `test/specs/v3.1/enum-schemas.yml`       | `const`, typeless `enum`                       |
| 2    | `test/specs/v3/array-schemas.yml`        | array constraints and nesting                  |
| 2    | `test/specs/v3.1/array-schemas.yml`      | `prefixItems`, `contains`                      |
| 2    | `test/specs/v3/object-extras.yml`        | `additionalProperties` boolean forms, `not`    |
| 2    | `test/specs/v3.1/object-extras.yml`      | `patternProperties` and friends (3.1 only)     |
| 2    | `test/specs/v3/defaults-and-deprecated.yml` | defaults per type, `deprecated` per position |
| 3    | `test/specs/v3/allof-schemas.yml`        | `allOf` merging                                |
| 3    | `test/specs/v3.1/allof-schemas.yml`      | `allOf` merging under 3.1                      |
| 3    | `test/specs/v3/anyof-schemas.yml`        | `anyOf` as a named schema                      |
| 3    | `test/specs/v3/discriminator-variants.yml`| implicit and partial discriminator mapping    |
| 3    | `test/specs/v3/anyof-cycle.yml`          | `anyOf` branch cycling back to its own holder  |
| 3    | `test/specs/v3/nested-composition.yml`   | composition inside composition                 |
| 4    | `test/specs/v3/recursive-refs.yml`       | self and mutual recursion                      |
| 4    | `test/specs/v3/external-refs/`           | multi-file `$ref` resolution                   |
| 4    | `test/specs/v3/root-ref.yml`             | `$ref` to the document root                    |
| 4    | `test/specs/v3/ref-siblings.yml`         | `$ref` beside other keywords                   |
| 4    | `test/specs/v3/json-schema-root.json`    | bare JSON Schema as root (`35a746b`)           |
| 5    | `test/specs/v3/name-collisions.yml`      | names that collapse onto each other            |
| 5    | `test/specs/v3/reserved-words.yml`       | Kotlin and TypeScript keywords as names        |
| 5    | `test/specs/v3/non-ascii-names.yml`      | umlauts, CJK, emoji, combining marks           |
| 5    | `test/specs/v3/extreme-names.yml`        | long, numeric-leading, punctuation-only        |
| 6    | `test/specs/v3/parameter-locations.yml`  | path, query, header, cookie                    |
| 6    | `test/specs/v3/parameter-styles.yml`     | the `style` × `explode` matrix                 |
| 6    | `test/specs/v3/parameter-inheritance.yml`| path-item parameters and overrides             |
| 6    | `test/specs/v2/parameter-locations.yml`  | 2.0 `body` and `formData` parameters           |
| 7    | `test/specs/v3/request-bodies.yml`       | content types, optional body, `*/*`            |
| 7    | `test/specs/v3/multipart-bodies.yml`     | files and nested objects in multipart          |
| 7    | `test/specs/v3/response-variants.yml`    | multiple 2xx, `default`, 204, ranges           |
| 7    | `test/specs/v3/response-headers.yml`     | response headers                               |
| 8    | `test/specs/v3/operation-naming.yml`     | missing `operationId` derivation               |
| 8    | `test/specs/v3/tags-and-servers.yml`     | tag combinations, `servers` at three levels    |
| 8    | `test/specs/v3/security-schemes.yml`     | apiKey, basic, bearer, oauth2                  |
| 8    | `test/specs/v3/path-edge-cases.yml`      | special characters, overlapping paths          |
| 8    | `test/specs/v3/multi-file/`              | several documents parsed as one spec           |
| 8    | `test/specs/v3.1/webhooks.yml`           | 3.1 `webhooks`                                 |
| 8    | `test/specs/v3/json-input.json`          | JSON input rather than YAML                    |

Modified:

- `test/README.md` — the corpus map (Task 9).
- `docs/superpowers/specs/2026-07-25-testing-strategy-design.md` — actual corpus count (Task 9).
- `test/output/**` — regenerated snapshots, every task.

## Authoring conventions

Every schema-only spec follows this exact shape. The dummy `/x` path with `x-ignore: true` exists because 3.0 requires
`paths`; it keeps a schema-only spec from also being an endpoint spec.

```yaml
openapi: 3.0.0
info:
  version: 1.0.0
  title: Primitive Formats

paths:
  /x:
    x-ignore: true
    get:
      responses:
        200:
          description: ''

components:
  schemas:
    Int32:
      type: integer
      format: int32
```

For `v3.1/` the first line is `openapi: 3.1.0`. For `v2/` it is `swagger: '2.0'` and schemas live under a top-level
`definitions:` rather than `components.schemas:` — see `test/specs/v2/simple-schemas.yml`.

`info.title` is the file's base name in Title Case. `info.version` is always `1.0.0`.

An endpoint spec omits the dummy path and gives every operation an explicit `operationId` — except
`v3/operation-naming.yml`, whose subject is what happens without one.

Component names are `PascalCase` and say what they isolate (`NullableEnum`, not `Schema3`), so a snapshot diff names its
own cause. Where a task below lists component or operation names, use those names verbatim: the reviewer checks against
them, and later tasks and the README refer to them.

## Per-task step template

Every authoring task (1-8) runs the same seven steps. They are written out in Task 1 and referenced by number
afterwards; run them in this order, because the fmt-before-generate rule is load-bearing.

1. **Author** the batch's spec files.
2. **Format:** `deno fmt test/specs` — must report the files as changed or already formatted, and must not error.
3. **Verify discovery:** `deno test -A test/harness/specs.test.ts` passes, then confirm the new entries are found:
   `deno eval "import {discoverSpecs} from './test/harness/specs.ts'; console.log((await discoverSpecs()).length)"`
   Expected: 14 plus the count of entries added so far.
4. **Regenerate:** `deno task test:output` from the repo root. All steps pass (write mode rewrites rather than fails).
5. **Prove zero churn:** `git diff --stat -- test/output` must print nothing. If it prints anything, stop and report it
   as a finding — a new spec changed an existing spec's output, which this phase does not permit.
6. **Verify check mode:** `deno task test:output:check` — all steps pass. This proves the regenerated tree is stable and
   that generation is deterministic across two runs.
7. **Commit** the specs and their snapshots together, and record in the report: the number of new snapshot files
   (`git status --porcelain test/output | wc -l` before committing), every `.error.txt` the batch produced with the
   generator and the message, and any tree over 500 files.

An `.error.txt` is an expected outcome for some inputs and a discovery for others. Report each one; never delete a spec
to make one disappear without saying so.

## Halt conditions

Report BLOCKED rather than working around any of these:

- A generation run does not finish within about five minutes. Recursive schemas can send a generator into unbounded
  recursion; that is a real bug and a hang makes the suite unusable. Name the spec and the profile.
- A single spec produces more than about 2000 snapshot files. Something is expanding combinatorially and the corpus
  should not absorb it.
- `deno task test:output` and `deno task test:output:check` disagree for a spec — non-deterministic output.

---

### Task 1: Primitives, nullability, enums

**Files:**

- Create: `test/specs/v3/primitive-formats.yml`
- Create: `test/specs/v3/nullable-schemas.yml`
- Create: `test/specs/v3.1/nullable-schemas.yml`
- Create: `test/specs/v3/enum-schemas.yml`
- Create: `test/specs/v3.1/enum-schemas.yml`

**Interfaces:**

- Consumes: nothing from earlier tasks. `discoverSpecs()` finds files automatically; no registration anywhere.
- Produces: the convention every later batch copies. Later tasks reference these specs' component names only through
  the README map in Task 9.

Read `test/specs/v3/detailed-schemas.yml` and `test/specs/v3/object-schemas.yml` first. They already cover `nullable`
on plain properties, `readOnly`/`writeOnly`, a plain string `enum`, and a single `format: email`. Do not restate that
coverage — these files take the combinations those two leave open.

- [ ] **Step 1: Author `test/specs/v3/primitive-formats.yml`**

One named schema per row, exactly these names:

| Name         | `type`  | `format`    |
| ------------ | ------- | ----------- |
| `Int32`      | integer | `int32`     |
| `Int64`      | integer | `int64`     |
| `IntNoFormat`| integer | none        |
| `Float`      | number  | `float`     |
| `Double`     | number  | `double`    |
| `NumNoFormat`| number  | none        |
| `Byte`       | string  | `byte`      |
| `Binary`     | string  | `binary`    |
| `Date`       | string  | `date`      |
| `DateTime`   | string  | `date-time` |
| `Password`   | string  | `password`  |
| `Uuid`       | string  | `uuid`      |
| `Uri`        | string  | `uri`       |
| `Hostname`   | string  | `hostname`  |
| `Ipv4`       | string  | `ipv4`      |
| `Ipv6`       | string  | `ipv6`      |
| `UnknownFormat` | string | `something-nonstandard` |
| `BoolWithFormat`| boolean | `checkbox` |

The last two are the point of the file: they pin what a generator does with a `format` it does not know.

- [ ] **Step 2: Author `test/specs/v3/nullable-schemas.yml`**

Schemas, exactly these names: `NullableEnum` (string enum plus `nullable: true`), `NullableRef` (an object property
that is both `$ref` to `NullableEnum` and `nullable: true`, the sibling-keyword case), `NullableArray` (`type: array`,
`nullable: true`, non-nullable `items`), `ArrayOfNullable` (non-nullable array whose `items` are nullable),
`NullableArrayOfNullable` (both), `NullableWithAllOf` (`nullable: true` beside an `allOf` of one inline object),
`NullableObjectProperty` (an object with one nullable object-typed property), `NullableRequired` (an object with a
nullable property that is also listed in `required`).

- [ ] **Step 3: Author `test/specs/v3.1/nullable-schemas.yml`**

The same eight names as Step 2 with the same intent, expressed the 3.1 way: `type: [string, 'null']` instead of
`nullable: true`. Same names deliberately — the two files sitting side by side make the 3.0-versus-3.1 handling
difference a two-directory snapshot comparison. Add two names that only 3.1 can express: `NullOnly` (`type: 'null'`)
and `MultiType` (`type: [string, integer]`).

- [ ] **Step 4: Author `test/specs/v3/enum-schemas.yml`**

Names: `IntEnum` (integer enum), `NumEnum` (number enum with a fractional value), `SingleValueEnum` (one string value),
`MixedEnum` (no `type`, values of mixed JSON types), `EnumWithEmptyString` (values including `''`),
`EnumWithSpecialChars` (values containing a space, a hyphen, a dot, a `/` and a `+`), `EnumWithReservedWords` (values
`class`, `object`, `null`, `true`, `return`, quoted so YAML keeps them strings), `EnumWithNumericStrings` (values
`'1'`, `'2'`), `ArrayOfEnum` (array whose `items` carry an inline enum), `ObjectWithInlineEnum` (an object with one
property carrying an inline enum, the anonymous-enum-naming path).

- [ ] **Step 5: Author `test/specs/v3.1/enum-schemas.yml`**

Names: `StringConst` (`const: 'fixed'`), `IntConst`, `BoolConst`, `TypelessEnum` (`enum` with no `type` at all),
`ObjectWithConstProperty` (an object with one `const` property), `ConstWithType` (`type: string` and `const` together).
Then repeat `IntEnum`, `MixedEnum` and `ObjectWithInlineEnum` from Step 4 so the version comparison holds for the plain
enum path too.

- [ ] **Step 6: Format**

Run: `deno fmt test/specs`
Expected: exits 0. Nothing else runs until this has.

- [ ] **Step 7: Verify discovery**

Run: `deno test -A test/harness/specs.test.ts`
Expected: PASS.

Run: `deno eval "import {discoverSpecs} from './test/harness/specs.ts'; console.log((await discoverSpecs()).length)"`
Expected: `19`.

- [ ] **Step 8: Regenerate snapshots**

Run from the repo root: `deno task test:output`
Expected: all steps pass. Write mode rewrites rather than failing.

- [ ] **Step 9: Prove zero churn in existing snapshots**

Run: `git diff --stat -- test/output`
Expected: no output at all. Any line here is a finding — report it instead of committing.

- [ ] **Step 10: Verify check mode**

Run: `deno task test:output:check`
Expected: all steps pass.

- [ ] **Step 11: Count and commit**

Run: `git status --porcelain test/output | wc -l` and record the number in the report.

```bash
git add test/specs test/output
git commit -m "test: add primitive, nullability and enum specs to the corpus"
```

---

### Task 2: Arrays, object extras, defaults and deprecation

**Files:**

- Create: `test/specs/v3/array-schemas.yml`
- Create: `test/specs/v3.1/array-schemas.yml`
- Create: `test/specs/v3/object-extras.yml`
- Create: `test/specs/v3.1/object-extras.yml`
- Create: `test/specs/v3/defaults-and-deprecated.yml`

**Interfaces:**

- Consumes: the authoring conventions above. `v3/enum-schemas.yml` exists from Task 1 and may be `$ref`'d
  cross-file the way `object-schemas.yml` already refs `simple-schemas.yml`.
- Produces: nothing later tasks depend on.

`test/specs/v3/object-schemas.yml` already covers `additionalProperties` in its schema form, required combinations,
nullable properties and cross-file refs in properties. This batch takes what it leaves.

- [ ] **Step 1: Author `test/specs/v3/array-schemas.yml`**

Names: `ArrayOfString`, `ArrayOfRef` (items `$ref` to `ArrayOfString`), `ArrayOfArray` (nested two deep),
`ArrayOfArrayOfRef` (nested with a ref at the leaf), `ArrayOfInlineObject`, `UniqueArray` (`uniqueItems: true`),
`BoundedArray` (`minItems`, `maxItems`), `ArrayNoItems` (`type: array` with no `items` at all — the untyped case),
`ArrayOfAnyOf` (items are an `anyOf` of two primitives), `ObjectWithArrayProperties` (one object carrying a
string array, a ref array and a nested array as three properties).

- [ ] **Step 2: Author `test/specs/v3.1/array-schemas.yml`**

Names: `TupleArray` (`prefixItems` of string, integer, boolean, no `items`), `TupleWithRest` (`prefixItems` plus
`items` for the tail), `ClosedTuple` (`prefixItems` plus `items: false`), `ContainsArray` (`contains` with
`minContains` and `maxContains`), `UnevaluatedItemsArray` (`prefixItems` plus `unevaluatedItems: false`). Then repeat
`ArrayOfString`, `UniqueArray` and `ArrayNoItems` from Step 1 for the version comparison.

- [ ] **Step 3: Author `test/specs/v3/object-extras.yml`**

Names: `OpenObject` (`additionalProperties: true`), `ClosedObject` (`additionalProperties: false`),
`ClosedObjectWithProperties` (properties plus `additionalProperties: false`), `MapOfRef` (`additionalProperties` is a
`$ref`), `MapOfArray` (`additionalProperties` is an array schema), `BoundedObject` (`minProperties`, `maxProperties`),
`NestedInlineObject` (an object property whose value is an inline object with its own inline object property, three
deep — the anonymous-nested-type naming path), `NotSchema` (`not` with an inline schema), `ObjectWithNot` (an object
whose property carries `not`), `EmptySchema` (a named schema whose body is `{}` — no `type`, no keywords).

- [ ] **Step 4: Author `test/specs/v3.1/object-extras.yml`**

3.1 aligns with JSON Schema, which unlocks object keywords 3.0 has no equivalent for. Names: `PatternPropertiesObject`
(`patternProperties` with two patterns, one of them anchored), `PatternAndAdditional` (`patternProperties` beside
`additionalProperties: false`), `UnevaluatedPropertiesObject` (`allOf` of one inline object plus
`unevaluatedProperties: false`), `DependentSchemasObject` (`dependentSchemas` making one property require another),
`DependentRequiredObject` (`dependentRequired`), `PropertyNamesObject` (`propertyNames` with a `pattern`). Then repeat
`OpenObject`, `ClosedObject` and `MapOfRef` from Step 3 so the 3.0-versus-3.1 comparison holds for the shared forms.

- [ ] **Step 5: Author `test/specs/v3/defaults-and-deprecated.yml`**

This file is an endpoint spec, because `deprecated` on an operation and on a parameter are distinct generator paths
from `deprecated` on a schema — and the k6 generator's handling of a deprecated parameter without a description was a
real bug.

Schemas: `DefaultString` (`default: 'hello'`), `DefaultInt`, `DefaultBool`, `DefaultNumber`, `DefaultEmptyString`
(`default: ''`), `DefaultArray` (`default: []`), `DefaultObject` (`default: {}`), `DefaultEnum` (string enum with a
`default` that is one of its values), `DeprecatedSchema` (`deprecated: true`), `ObjectWithDefaults` (one object whose
properties each carry a `default`), `ObjectWithDeprecatedProperties` (two properties with `deprecated: true`, one with
a `description` and one without).

Operations, all under a `Deprecation` tag:

- `GET /deprecated-op` — `operationId: deprecatedOp`, `deprecated: true`, with a `description`.
- `GET /deprecated-op-no-desc` — `operationId: deprecatedOpNoDesc`, `deprecated: true`, no `description`.
- `GET /deprecated-params` — `operationId: deprecatedParams`, with three query parameters: `withDesc` (deprecated,
  has a `description`), `noDesc` (deprecated, no `description`), `plain` (not deprecated).

Each returns `200` with a `description` and no content.

- [ ] **Step 6: Format** — Step 6 of Task 1.
- [ ] **Step 7: Verify discovery** — Step 7 of Task 1. Expected count: `24`.
- [ ] **Step 8: Regenerate** — Step 8 of Task 1.
- [ ] **Step 9: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 10: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 11: Count and commit**

```bash
git add test/specs test/output
git commit -m "test: add array, object and default/deprecated specs to the corpus"
```

---

### Task 3: Composition

**Files:**

- Create: `test/specs/v3/allof-schemas.yml`
- Create: `test/specs/v3.1/allof-schemas.yml`
- Create: `test/specs/v3/anyof-schemas.yml`
- Create: `test/specs/v3/discriminator-variants.yml`
- Create: `test/specs/v3/nested-composition.yml`

**Interfaces:**

- Consumes: the authoring conventions. `v3/oneof-schemas.yml` and `v3/discriminated-schemas.yml` already exist — read
  both before authoring so this batch does not restate them.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Author `test/specs/v3/allof-schemas.yml`**

Names: `Base` (object with `id` required and `name`), `AllOfSingle` (`allOf` of one `$ref` to `Base`),
`AllOfTwoRefs` (`allOf` of `Base` and a second named object), `AllOfRefAndInline` (`$ref` plus an inline object),
`AllOfWithOwnProperties` (`allOf` of `Base` plus sibling `properties` and `required` on the same schema),
`AllOfConflicting` (two branches declaring the same property name with different types — pins the merge-conflict
behaviour), `AllOfRequiredOnly` (a branch contributing only `required`, no `properties`), `DeepInheritance` (a
three-level chain: `Level3` allOf `Level2`, which allOf `Level1`, each adding one property),
`AllOfWithDescription` (`allOf` beside a sibling `description` and `title`).

- [ ] **Step 2: Author `test/specs/v3.1/allof-schemas.yml`**

The same nine names with the same structure. The only differences are `openapi: 3.1.0` and, where a branch needs
nullability, a type array instead of `nullable`.

- [ ] **Step 3: Author `test/specs/v3/anyof-schemas.yml`**

`v3/object-schemas.yml` covers `anyOf` as a keyword on an object with properties. This file covers `anyOf` as the whole
schema. Names: `AnyOfPrimitives` (string or integer), `AnyOfRefs` (two `$ref` branches), `AnyOfRefAndPrimitive`,
`AnyOfWithNullable` (a branch plus a nullable branch), `AnyOfSingle` (one branch only), `AnyOfArrays` (two array
branches with different item types), `ObjectWithAnyOfProperty` (an object whose property is an inline `anyOf`).

- [ ] **Step 4: Author `test/specs/v3/discriminator-variants.yml`**

`v3/discriminated-schemas.yml` covers a `oneOf` with an explicit `mapping`. That leaves the implicit form, which is the
one most real documents use. Do not edit that file — this is a new one.

Names: `ImplicitBase` plus `ImplicitDog` and `ImplicitCat` (a `oneOf` with `discriminator.propertyName` and **no**
`mapping`, so names are derived from the schema names), `PartialMapping` (three branches, `mapping` naming only two),
`AnyOfDiscriminator` (a discriminator on an `anyOf` rather than a `oneOf`), `AllOfInheritanceDiscriminator` (the
parent-declares-discriminator, children-`allOf`-the-parent shape, with no `oneOf` at all — the classic inheritance
encoding), `DiscriminatorPropertyNotRequired` (`propertyName` naming a property that is not in `required`),
`DiscriminatorWithEnum` (the discriminator property typed as an enum of the mapping keys),
`NestedDiscriminator` (a branch that is itself a discriminated `oneOf`).

- [ ] **Step 5: Author `test/specs/v3/nested-composition.yml`**

Names: `AllOfContainingOneOf` (an `allOf` branch that is itself a `oneOf`), `OneOfContainingAllOf`,
`AnyOfContainingAllOf`, `AllOfOfAllOf` (two levels of `allOf`), `OneOfOfOneOf`, `ArrayOfOneOf` (array whose `items`
are a `oneOf`), `MapOfOneOf` (`additionalProperties` is a `oneOf`), `PropertyOfNestedComposition` (an object whose
property is an `allOf` containing a `oneOf`).

- [ ] **Step 6: Format** — Step 6 of Task 1.
- [ ] **Step 7: Verify discovery** — Step 7 of Task 1. Expected count: `30`.
- [ ] **Step 8: Regenerate** — Step 8 of Task 1.
- [ ] **Step 9: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 10: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 11: Count and commit**

```bash
git add test/specs test/output
git commit -m "test: add composition specs to the corpus"
```

---

### Task 4: References

**Files:**

- Create: `test/specs/v3/recursive-refs.yml`
- Create: `test/specs/v3/external-refs/main.yml`
- Create: `test/specs/v3/external-refs/shared/types.yml`
- Create: `test/specs/v3/root-ref.yml`
- Create: `test/specs/v3/ref-siblings.yml`
- Create: `test/specs/v3/json-schema-root.json`

**Interfaces:**

- Consumes: the authoring conventions. Note that a *directory* under a version directory is one corpus entry whose
  files are parsed together — `external-refs/` is that case, and its snapshot base is `v3/external-refs`.
- Produces: nothing later tasks depend on.

This is the batch most likely to hit the halt conditions. `recursive-refs.yml` can send a generator into unbounded
recursion. Regenerate this batch one spec at a time if a run stops making progress, and report a hang rather than
trimming the spec silently.

- [ ] **Step 1: Author `test/specs/v3/recursive-refs.yml`**

Names: `SelfRecursive` (an object with a `child` property `$ref`ing itself and a `name` string), `SelfRecursiveArray`
(an object with a `children` array of itself), `MutualA` (property `b` refs `MutualB`), `MutualB` (property `a` refs
`MutualA`), `RecursiveThroughArray` (object whose array items ref itself through one level of inline object),
`RecursiveRequired` (self-ref property that is also `required` — the non-optional cycle),
`RecursiveThroughMap` (`additionalProperties` refs itself), `TreeNode` (both a self-ref array and a self-ref optional
parent, the shape a real tree takes).

- [ ] **Step 2: Author the `external-refs/` set**

`shared/types.yml` is a bare component container: no `openapi`, no `info`, no `paths` — just
`components: { schemas: { SharedThing: ..., SharedEnum: ... } }`. It is a `$ref` target, and `discoverSpecs()` hands
both files to `parseAndGenerate` together.

`main.yml` is a full 3.0 document that refs into it: a schema `UsesShared` whose properties ref
`shared/types.yml#/components/schemas/SharedThing` and `...#/components/schemas/SharedEnum`, plus a schema
`RefsSharedInArray` whose array items ref `SharedThing`. Include the dummy `/x` path.

- [ ] **Step 3: Author `test/specs/v3/root-ref.yml`**

An object schema `RefsRoot` with a property whose `$ref` is `'#'` — the whole document — and a second schema
`RefsComponents` whose `$ref` is `'#/components'`. If the parser rejects either, that is a legitimate `.error.txt`; do
not soften the spec to avoid it. Report which one produced it.

- [ ] **Step 4: Author `test/specs/v3/ref-siblings.yml`**

The `$ref`-with-siblings case, which 3.0 says to ignore and 3.1 says to merge. Names: `Target` (a plain string schema
with a `description`), `RefWithDescription` (`$ref: '#/components/schemas/Target'` plus its own `description`),
`RefWithTitle`, `RefWithNullable` (`$ref` plus `nullable: true`), `RefWithDefault`, `RefWithExample`,
`ObjectWithRefSiblingProperties` (an object whose two properties each ref `Target` with their own `description`, the
common real-world case).

- [ ] **Step 5: Author `test/specs/v3/json-schema-root.json`**

A bare JSON Schema document as the root — the case commit `35a746b` fixed. No `openapi` key, no `info`, no `paths`:
a top-level `{"$schema": "...", "type": "object", "title": "RootSchema", "properties": {...}, "required": [...]}` with
three properties, one of which is a nested inline object and one an array. JSON, not YAML, which also exercises the
JSON input path.

- [ ] **Step 6: Format**

Run: `deno fmt test/specs`
Expected: exits 0. This also formats the `.json` spec.

- [ ] **Step 7: Verify discovery** — Step 7 of Task 1. Expected count: `35` (the `external-refs/` directory is one
      entry, not two).
- [ ] **Step 8: Regenerate** — Step 8 of Task 1. Watch for a run that stops progressing; see the halt conditions.
- [ ] **Step 9: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 10: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 11: Count and commit**

Report every `.error.txt` this batch produced with its generator and message — this batch is expected to produce some,
and each one is either intended behaviour or a discovered bug. Say which you believe it is.

```bash
git add test/specs test/output
git commit -m "test: add reference-resolution specs to the corpus"
```

---

### Task 5: Naming

**Files:**

- Create: `test/specs/v3/name-collisions.yml`
- Create: `test/specs/v3/reserved-words.yml`
- Create: `test/specs/v3/non-ascii-names.yml`
- Create: `test/specs/v3/extreme-names.yml`

**Interfaces:**

- Consumes: the authoring conventions, with one documented exception — component names in this batch are deliberately
  not PascalCase, because the names *are* the subject.
- Produces: nothing later tasks depend on.

Generators write one file per model, so a batch whose whole point is names that collapse onto each other targets one path
from two schemas. Under the `existingFileBehavior: 'error'` this task was written against, that aborted the whole
document and produced an `.error.txt` — which recorded the collision but nothing about how the document's other schemas
normalized. The output tests now run with `existingFileBehavior: 'count'` instead, so a collision emits `X_1`, `X_2`, …
and the rest of the tree survives. See "Deviations taken during execution". Report every collision: which schema landed
in which file, and whether anything still references the wrong declaration.

The 200-character name in Step 4 was shortened to 80 during execution. At 200 its generated TypeScript path was 316
repo-relative characters, past what a Windows checkout accepts without `core.longpaths`.

- [ ] **Step 1: Author `test/specs/v3/name-collisions.yml`**

Schemas whose names differ only in ways a generator may normalize away: `myThing` and `MyThing`; `my_thing` and
`my-thing` and `my thing` (quoted); `Thing2` and `Thing_2`; `ÜberThing` and `UberThing`. Each is a distinct object with
one distinguishing property so a collision is visible rather than silent.

- [ ] **Step 2: Author `test/specs/v3/reserved-words.yml`**

Names that are keywords in a target language: `class`, `object`, `fun`, `val`, `var`, `when`, `is`, `as`, `in`,
`typeof`, `interface`, `enum`, `null`, `String`, `Int`, `List`, `Map`, `Any`, `Unit` — quoted where YAML needs it. Plus
an object `ObjectWithReservedProperties` whose *property* names are `class`, `val`, `is`, `in`, `function`, `default`,
`constructor`, `prototype`, `this`, since property names take a different code path from type names.

- [ ] **Step 3: Author `test/specs/v3/non-ascii-names.yml`**

Names: `Größe`, `Überprüfung`, `Ångström`, `日本語`, `Ελληνικά`, `Кириллица`, `café` (combining acute, U+0301, not the
precomposed U+00E9 — the normalization case), `emoji🎉Name`. Plus `ObjectWithNonAsciiProperties` whose property names
are `größe`, `日本語`, `naïve`.

Write the file as UTF-8 without a BOM. If `deno fmt` rewrites any of these, let it, and regenerate after.

- [ ] **Step 4: Author `test/specs/v3/extreme-names.yml`**

Names: a 200-character name (`Very` followed by `Long` repeated to length, one word, no separators), `2FactorAuth`
(numeric-leading), `_Underscore`, `__DoubleUnderscore`, `$Dollar`, `A` (single character), `a` (single lowercase —
paired with `A` this is also a collision), `___` (punctuation only), `With.Dot`, `With/Slash`, `With Space`,
`With-Dash`, `With+Plus` — all quoted. Plus `ObjectWithExtremeProperties` carrying a 200-character property name, a
numeric-leading one and an empty-string property name (`'': { type: string }`).

Then the casing-variety set, which is about consistent normalization rather than collision: `camelCaseName`,
`PascalCaseName`, `snake_case_name`, `SCREAMING_SNAKE_NAME`, `kebab-case-name`, `HTTPResponseXML` (consecutive capitals,
the acronym case), `iOSDevice` (leading lowercase before capitals). Each is a distinct object with one property. These
must not collide — if two of them produce the same output name, that is the finding.

- [ ] **Step 5: Format** — Step 6 of Task 1.
- [ ] **Step 6: Verify discovery** — Step 7 of Task 1. Expected count: `39`.
- [ ] **Step 7: Regenerate** — Step 8 of Task 1.
- [ ] **Step 8: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 9: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 10: Count and commit**

Report every `.error.txt`, and separately report any snapshot where two differently-named schemas produced identically
named output that a generator accepted — a silent collision is worse than a crash and check mode cannot tell them
apart.

```bash
git add test/specs test/output
git commit -m "test: add naming edge-case specs to the corpus"
```

---

### Task 6: Parameters

**Files:**

- Create: `test/specs/v3/parameter-locations.yml`
- Create: `test/specs/v3/parameter-styles.yml`
- Create: `test/specs/v3/parameter-inheritance.yml`
- Create: `test/specs/v2/parameter-locations.yml`

**Interfaces:**

- Consumes: the endpoint-spec convention from `test/specs/v3/service-endpoints.yml` — read it first. Every operation
  gets an explicit `operationId` and a `tags` entry.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Author `test/specs/v3/parameter-locations.yml`**

Tag `Parameters`. Operations:

- `GET /path/{id}/{sub}` — `operationId: twoPathParams`, two required path parameters, one string one integer.
- `GET /query` — `operationId: queryParams`, four query parameters: required string, optional string, integer with a
  `default`, boolean.
- `GET /header` — `operationId: headerParams`, a required header parameter `X-Request-Id` and an optional
  `X-Optional-Header`.
- `GET /cookie` — `operationId: cookieParams`, one cookie parameter `session`.
- `GET /mixed/{id}` — `operationId: mixedParams`, one of each of the four locations in a single operation.
- `GET /described` — `operationId: describedParams`, one parameter with a `description` and one without, one with an
  `example`, one with a `$ref`'d schema.
- `GET /empty-value` — `operationId: allowEmptyValueParam`, a query parameter with `allowEmptyValue: true`.
- `GET /reserved` — `operationId: reservedCharParam`, a query parameter with `allowReserved: true`.

Each returns `200` with a `description` and no content. Add one schema `ParamSchema` (string enum) for the `$ref`'d
parameter schema.

- [ ] **Step 2: Author `test/specs/v3/parameter-styles.yml`**

Tag `Styles`. One operation per row, all `GET`, all returning `200` with a `description` and no content. The path is
`/{style}` shaped per row; query rows use `/query-{style}`.

| `operationId`       | `in`  | `style`          | `explode` | schema         |
| ------------------- | ----- | ---------------- | --------- | -------------- |
| `formArray`         | query | `form`           | `true`    | array of string |
| `formArrayNoExplode`| query | `form`           | `false`   | array of string |
| `formObject`        | query | `form`           | `true`    | inline object   |
| `spaceDelimited`    | query | `spaceDelimited` | `false`   | array of string |
| `pipeDelimited`     | query | `pipeDelimited`  | `false`   | array of string |
| `deepObject`        | query | `deepObject`     | `true`    | inline object   |
| `simplePath`        | path  | `simple`         | `false`   | array of string |
| `labelPath`         | path  | `label`          | `false`   | array of string |
| `matrixPath`        | path  | `matrix`         | `false`   | array of string |
| `simpleHeader`      | header| `simple`         | `false`   | array of string |

The inline object schema is two properties, one string one integer. Path parameters are `required: true`.

- [ ] **Step 3: Author `test/specs/v3/parameter-inheritance.yml`**

Tag `Inheritance`.

- `/inherited/{id}` — a path-item-level `parameters` list holding the `id` path parameter and a `common` query
  parameter, then `get` (`operationId: inheritsParams`, no own parameters) and `post`
  (`operationId: inheritsAndAdds`, adding one query parameter of its own).
- `/overridden/{id}` — the same path-item-level list, and a `get` (`operationId: overridesParam`) that redeclares
  `common` with a different type and description.
- `/ref-param/{id}` — a path-item parameter that is a `$ref` to `components.parameters`, plus an operation
  (`operationId: refParam`) with a second `$ref`'d parameter.

Define two entries under `components.parameters`: `IdParam` (path, required, string) and `PageParam` (query, integer
with a `default`).

- [ ] **Step 4: Author `test/specs/v2/parameter-locations.yml`**

`swagger: '2.0'`. 2.0's parameter model is the reason this file exists: `body` and `formData` are parameter locations
rather than a request body. Tag `Parameters`. Operations:

- `POST /body` — `operationId: bodyParam`, one `in: body` parameter named `payload` whose `schema` refs a definition.
- `POST /form` — `operationId: formDataParams`, `consumes: [application/x-www-form-urlencoded]`, three `formData`
  parameters: string, integer, boolean.
- `POST /upload` — `operationId: fileUpload`, `consumes: [multipart/form-data]`, a `formData` parameter of
  `type: file` and one string `formData` parameter beside it.
- `GET /query` — `operationId: queryParams`, a query parameter with `type: array`, `items`, and
  `collectionFormat: multi`, plus one with `collectionFormat: csv`.

Define `Payload` under `definitions` as an object with two properties. Responses are `200` with a `description`.

- [ ] **Step 5: Format** — Step 6 of Task 1.
- [ ] **Step 6: Verify discovery** — Step 7 of Task 1. Expected count: `43`.
- [ ] **Step 7: Regenerate** — Step 8 of Task 1.
- [ ] **Step 8: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 9: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 10: Count and commit**

```bash
git add test/specs test/output
git commit -m "test: add parameter specs to the corpus"
```

---

### Task 7: Request bodies and responses

**Files:**

- Create: `test/specs/v3/request-bodies.yml`
- Create: `test/specs/v3/multipart-bodies.yml`
- Create: `test/specs/v3/response-variants.yml`
- Create: `test/specs/v3/response-headers.yml`

**Interfaces:**

- Consumes: the endpoint-spec convention. Nothing from Tasks 1-6.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Author `test/specs/v3/request-bodies.yml`**

Tag `Bodies`. Operations, each returning `200` with a `description` and no content:

- `POST /json` — `operationId: jsonBody`, required `application/json` body `$ref`ing `Payload`.
- `POST /json-optional` — `operationId: optionalJsonBody`, the same body with `required: false`.
- `POST /json-inline` — `operationId: inlineJsonBody`, an inline object schema rather than a `$ref`.
- `POST /json-array` — `operationId: arrayJsonBody`, an array of `Payload`.
- `POST /json-primitive` — `operationId: primitiveJsonBody`, `type: string`.
- `POST /text` — `operationId: textBody`, `text/plain` with `type: string`.
- `POST /binary` — `operationId: binaryBody`, `application/octet-stream` with `type: string, format: binary`.
- `POST /any` — `operationId: anyBody`, content type `*/*` with an empty schema.
- `POST /multi-content` — `operationId: multiContentBody`, three content types on one operation
  (`application/json`, `application/xml`, `text/plain`) with different schemas.
- `POST /form` — `operationId: formBody`, `application/x-www-form-urlencoded` with an inline object of three
  properties.
- `POST /described-body` — `operationId: describedBody`, a body with a `description`.
- `POST /ref-body` — `operationId: refBody`, `requestBody` that is a `$ref` to `components.requestBodies`.

Define `Payload` (object, three properties, two required) and one `components.requestBodies` entry `SharedBody`.

- [ ] **Step 2: Author `test/specs/v3/multipart-bodies.yml`**

Tag `Multipart`. All `POST`, `multipart/form-data`, each returning `200` with a `description`:

- `singleFile` at `/file` — one property `file` with `type: string, format: binary`, required.
- `multipleFiles` at `/files` — an array of binary strings.
- `fileAndFields` at `/mixed` — a binary file plus a string, an integer and a boolean field.
- `nestedObjectPart` at `/nested` — a property whose value is an inline object with its own properties.
- `refPart` at `/ref-part` — a property `$ref`ing `Payload`.
- `withEncoding` at `/encoded` — the same as `fileAndFields` plus an `encoding` block setting `contentType` on the
  file part and `style` on a field.
- `optionalFile` at `/optional-file` — a binary property not listed in `required`.

Define `Payload` as an object with two properties.

- [ ] **Step 3: Author `test/specs/v3/response-variants.yml`**

Tag `Responses`. All `GET`:

- `twoSuccessCodes` at `/two-success` — `200` and `201`, different schemas.
- `successAndDefault` at `/default` — `200` plus `default` with an error schema.
- `onlyDefault` at `/only-default` — `default` alone.
- `noContent` at `/no-content` — `204` with a `description` and no content.
- `emptyBody200` at `/empty-200` — `200` with a `description` and no `content`.
- `rangeCodes` at `/ranges` — `2XX`, `4XX` and `5XX`.
- `mixedExactAndRange` at `/mixed-codes` — `200`, `2XX` and `default` together.
- `errorCodes` at `/errors` — `200` plus `400`, `401`, `404` and `500`, the `4xx` family sharing one `Error` schema.
- `multiContentResponse` at `/multi-content` — `200` with `application/json` and `text/plain` schemas.
- `primitiveResponse` at `/primitive` — `200` returning `type: string`.
- `arrayResponse` at `/array` — `200` returning an array of `Thing`.
- `refResponse` at `/ref-response` — a response that is a `$ref` to `components.responses`.

Define `Thing`, `OtherThing` and `Error` schemas, and one `components.responses` entry `SharedResponse`.

- [ ] **Step 4: Author `test/specs/v3/response-headers.yml`**

Tag `Headers`. All `GET`, each `200`:

- `singleHeader` at `/one` — one response header `X-Rate-Limit` (integer) with a `description`.
- `multipleHeaders` at `/many` — four headers: string, integer, boolean, and an array of string.
- `requiredHeader` at `/required` — a header with `required: true`.
- `deprecatedHeader` at `/deprecated` — a header with `deprecated: true`.
- `refHeader` at `/ref` — a header that is a `$ref` to `components.headers`.
- `headersOnNoContent` at `/no-content-headers` — a `204` carrying headers and no body.
- `headersAndBody` at `/both` — headers plus a `$ref`'d body schema.

Define one `components.headers` entry `SharedHeader` and one schema `Thing`.

- [ ] **Step 5: Format** — Step 6 of Task 1.
- [ ] **Step 6: Verify discovery** — Step 7 of Task 1. Expected count: `47`.
- [ ] **Step 7: Regenerate** — Step 8 of Task 1.
- [ ] **Step 8: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 9: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 10: Count and commit**

```bash
git add test/specs test/output
git commit -m "test: add request body and response specs to the corpus"
```

---

### Task 8: Document and operation structure

**Files:**

- Create: `test/specs/v3/operation-naming.yml`
- Create: `test/specs/v3/tags-and-servers.yml`
- Create: `test/specs/v3/security-schemes.yml`
- Create: `test/specs/v3/path-edge-cases.yml`
- Create: `test/specs/v3/multi-file/pets.yml`
- Create: `test/specs/v3/multi-file/owners.yml`
- Create: `test/specs/v3/multi-file/shared.yml`
- Create: `test/specs/v3.1/webhooks.yml`
- Create: `test/specs/v3/json-input.json`

**Interfaces:**

- Consumes: the endpoint-spec convention, plus the directory-is-one-entry rule for `multi-file/`.
- Produces: nothing. This is the last authoring batch.

- [ ] **Step 1: Author `test/specs/v3/operation-naming.yml`**

The only spec that deliberately omits `operationId`, because name derivation from method and path is the subject. Tag
`Naming`. Operations, none with an `operationId`:

- `GET /items` and `POST /items` — the same path, two methods.
- `GET /items/{id}`, `PUT /items/{id}`, `DELETE /items/{id}` — a path parameter in the derived name.
- `GET /items/{id}/sub-items/{subId}` — two parameters, and a hyphenated segment.
- `GET /` — the root path.
- `PATCH /items/{id}` and `HEAD /items` and `OPTIONS /items` — the less common methods.
- `GET /a/b/c/d/e` — a deep path.
- `GET /with-summary` — no `operationId` but a `summary`, since a generator may prefer the summary.

Each returns `200` with a `description`.

- [ ] **Step 2: Author `test/specs/v3/tags-and-servers.yml`**

A document-level `servers` list of two entries, one with a `description` and one with a templated variable plus its
`variables` block. Then:

- `GET /untagged` — `operationId: untagged`, no `tags` at all.
- `GET /one-tag` — `operationId: oneTag`, `tags: [Alpha]`.
- `GET /two-tags` — `operationId: twoTags`, `tags: [Alpha, Beta]`.
- `GET /shared-tag` — `operationId: sharedTag`, `tags: [Alpha]`, so two operations share a tag.
- `GET /path-server` — a path-item-level `servers` override, `operationId: pathServer`.
- `GET /op-server` — an operation-level `servers` override, `operationId: opServer`.
- `GET /tag-with-space` — `tags: ['Tag With Space']`, `operationId: tagWithSpace`.

Add a top-level `tags` array declaring `Alpha` with a `description` and leaving `Beta` undeclared, so both the declared
and undeclared paths are covered.

- [ ] **Step 3: Author `test/specs/v3/security-schemes.yml`**

`components.securitySchemes` with five entries: `ApiKeyHeader` (apiKey in header), `ApiKeyQuery` (apiKey in query),
`BasicAuth` (http basic), `BearerAuth` (http bearer with `bearerFormat: JWT`), `OAuth2` (authorizationCode flow with
two scopes). A document-level `security` requiring `ApiKeyHeader`. Then:

- `GET /inherits-security` — `operationId: inheritsSecurity`, no own `security`.
- `GET /overrides-security` — `operationId: overridesSecurity`, `security: [{ BearerAuth: [] }]`.
- `GET /no-security` — `operationId: noSecurity`, `security: []` (explicitly public).
- `GET /multi-security` — `operationId: multiSecurity`, two alternatives in the list.
- `GET /and-security` — `operationId: andSecurity`, one entry requiring two schemes together.
- `GET /scoped` — `operationId: scopedSecurity`, `OAuth2` with both scopes.

Each returns `200` with a `description`.

- [ ] **Step 4: Author `test/specs/v3/path-edge-cases.yml`**

Tag `Paths`. Operations, each `GET` returning `200` with a `description`:

- `/overlap/{id}` and `/overlap/fixed` — a templated segment overlapping a literal one, `operationId`s
  `overlapTemplated` and `overlapLiteral`.
- `/with.dot`, `/with-dash`, `/with_underscore`, `/with~tilde`, `/with:colon`, `/with@at` — punctuation in path
  segments.
- `/trailing/` — a trailing slash, `operationId: trailingSlash`.
- `/{id}` — a parameter as the entire path, `operationId: paramOnlyPath`.
- `/a/{p1}/b/{p2}/c/{p3}` — three parameters interleaved with literals.
- `/UPPER/Mixed/lower` — casing variety in segments.
- `/very/deep/nested/path/with/many/segments/here` — depth.

Every path parameter is declared, `required: true`, with a schema.

- [ ] **Step 5: Author the `multi-file/` set**

Three documents parsed together as one corpus entry, which is the multi-document case. Each is a complete 3.0
document with its own `info`:

- `shared.yml` — schemas only (`Address`, `Contact`) plus the dummy `/x` path.
- `pets.yml` — `GET /pets` and `POST /pets` (`operationId`s `listPets`, `createPet`), a `Pet` schema whose property
  refs `shared.yml#/components/schemas/Address`.
- `owners.yml` — `GET /owners/{id}` (`operationId: getOwner`), an `Owner` schema refing both
  `shared.yml#/components/schemas/Contact` and `pets.yml#/components/schemas/Pet`, so the set has a cross-document
  reference in both directions.

- [ ] **Step 6: Author `test/specs/v3.1/webhooks.yml`**

`openapi: 3.1.0` with a top-level `webhooks` block, which only 3.1 has, and no `paths` at all — also the
3.1-paths-are-optional case. Two webhooks: `petCreated` (a `post` with an `application/json` body refing `Pet` and a
`200` response) and `petDeleted` (a `post` with an inline body schema). Plus one regular `GET /pets` operation
(`operationId: listPets`) so the file has both, and a `Pet` schema.

- [ ] **Step 7: Author `test/specs/v3/json-input.json`**

A complete 3.0 document written as JSON rather than YAML, with one endpoint (`GET /things`, `operationId: listThings`,
`200` returning an array of `Thing`), one `Thing` object schema with three properties, and a `$ref` from a property to
a second schema. Not a translation of an existing spec — a small independent document, so the diff is about the JSON
input path and not about duplicated content.

- [ ] **Step 8: Format** — Step 6 of Task 1.
- [ ] **Step 9: Verify discovery** — Step 7 of Task 1. Expected count: `54` (`multi-file/` is one entry).
- [ ] **Step 10: Regenerate** — Step 8 of Task 1.
- [ ] **Step 11: Prove zero churn** — Step 9 of Task 1.
- [ ] **Step 12: Verify check mode** — Step 10 of Task 1.
- [ ] **Step 13: Count and commit**

```bash
git add test/specs test/output
git commit -m "test: add document and operation structure specs to the corpus"
```

---

### Task 9: Corpus map and phase close-out

**Files:**

- Modify: `test/README.md`
- Modify: `docs/superpowers/specs/2026-07-25-testing-strategy-design.md`

**Interfaces:**

- Consumes: the finished 54-entry corpus, and the per-batch reports from Tasks 1-8 (error snapshots, file counts).
- Produces: the documentation a contributor needs to find where a concern already lives.

A 54-entry corpus without an index invites duplicate specs, because the cheapest thing to do when adding coverage is to
create a new file rather than read 54 existing ones.

- [ ] **Step 1: Measure the corpus**

Run and record each number:

```bash
deno eval "import {discoverSpecs} from './test/harness/specs.ts'; console.log((await discoverSpecs()).length)"
git ls-files test/output | wc -l
git ls-files 'test/output/**/*.error.txt' | wc -l
```

- [ ] **Step 2: Measure tier 2 runtime**

Run: `deno task test:output:check`
Record wall-clock time and the passed-step count from the summary line. Both go in the README.

- [ ] **Step 3: Add the corpus map to `test/README.md`**

Insert a `## Corpus map` section immediately before the existing `## How to add a spec` section. One table row per
corpus entry: the path relative to `test/specs/`, and one short phrase for what it isolates. Group rows under the
category headings this plan used (types, arrays and objects, composition, references, naming, parameters, bodies and
responses, document structure). Take the phrases from the File Structure table above, and cover the 14 pre-existing
entries too — they are part of the corpus and a map that omits them is worse than none.

- [ ] **Step 4: Extend `## How to add a spec` in `test/README.md`**

Add, after the existing text: the fmt-before-generate rule and why (source line numbers are stamped into generated doc
comments), that `git diff --stat -- test/output` must stay empty when adding a spec, and that a new spec belongs in the
corpus map.

- [ ] **Step 5: Note the error snapshots in `test/README.md`**

If Tasks 1-8 produced any `.error.txt`, add a short subsection under the corpus map listing each one — spec, profile,
and one line on whether it records intended behaviour or a known bug. A committed error snapshot that nobody wrote down
reads as accepted behaviour forever. If there are none, skip this step and say so.

- [ ] **Step 6: Amend the spec's corpus count**

In `docs/superpowers/specs/2026-07-25-testing-strategy-design.md`, the Spec Corpus section opens with "Approximately 45
focused specs replace the current six." Replace the count with the real one from Step 1 and add one sentence recording
the two Deviations from this plan (remote HTTP refs and mixed-version sets), so the spec does not keep promising
coverage the corpus does not have.

- [ ] **Step 7: Run the full gate set**

```bash
deno fmt --check
deno lint
deno task test
deno task test:output:check
```

Expected: all pass. Record the test and step counts.

- [ ] **Step 8: Commit**

```bash
git add test/README.md docs/superpowers/specs/2026-07-25-testing-strategy-design.md
git commit -m "docs: map the expanded corpus and record phase 2b deviations"
```

## Notes for the executing agent

- The per-batch step sequence is identical every time and its order matters. Format, then discover, then regenerate,
  then prove zero churn, then check. Skipping the zero-churn step is how a behaviour change gets committed as if it
  were new coverage.
- Snapshot volume roughly triples in this phase — expect `test/output/` to pass 7000 files. That is the design working
  as intended; `linguist-generated` keeps it out of pull-request diffs by default.
- Nothing in this phase touches `test/harness/`, `test/output-tests/`, or `packages/`. A diff that does is out of scope
  and should be questioned in review.
