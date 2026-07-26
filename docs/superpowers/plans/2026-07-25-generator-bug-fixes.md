# Generator Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every generator defect the phase-2b corpus expansion surfaced, so the committed snapshot baseline records
correct output rather than a catalogue of known-broken output.

**Architecture:** Four batches, one per area, in dependency order: `@goast/core` transform first (its output feeds both
language generators), then TypeScript, then Kotlin, then the k6 client. Each batch is one commit containing the code
fix, its unit tests, and the regenerated snapshots that prove the fix reached the output.

**Tech Stack:** Deno 2.x, TypeScript, the existing tier-1 unit tests and tier-2 snapshot harness.

## Global Constraints

- Deno and Docker remain the only prerequisites.
- Every fix needs a **tier-1 unit test that fails before it and passes after**. Snapshot churn alone is not evidence:
  a snapshot proves output changed, not that it became correct.
- Run `deno task test:output` from the repo root, never elsewhere — `getSourceDocLine` renders CWD-relative paths.
- **Snapshot churn is expected and is the proof.** For each fix, state which snapshot paths changed and why that is the
  intended consequence. A fix that churns nothing either is not reached by the corpus or does not work; say which.
- **Never edit a snapshot by hand.** Regenerate.
- Do not touch `test/specs/**`. The corpus is the specification of the bug; changing it to suit a fix hides the bug.
- `deno fmt`, `deno lint`, and `deno task test` must pass at the end of every batch.
- Keep each batch's diff to its own area. A core fix that also edits Kotlin belongs in two commits.

## The defect register

Every entry was found by the phase-2b corpus and independently verified by a reviewer against committed output. The
"pinned by" column names the spec that catches a regression.

### Batch 1 — `@goast/core` transform

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 1 | 3.1 nullability via `allOf` is never detected. A schema with `type: [object, 'null']` plus `allOf` is routed to `combined` before the multi-type branch runs, and 3.1 has no `nullable: true` sibling to fall back on. | `transform/helpers.ts:23` vs `:27` | `v3.1/nullable-schemas` `NullableWithAllOf` |
| 2 | `$ref` plus a sibling 3.1 type array collapses to `type: []`, dropping nullability entirely. | `transform/` multi-type path | `v3.1/nullable-schemas` `NullableRef` |
| 3 | Anonymous nested-object naming composes only one level. A third-level inline object gets an opaque `Schema15` although `NestedInlineObject_middle` was available. | `transform/helpers.ts` `determineSchemaName` | `v3/object-extras` `NestedInlineObject` |
| 4 | An `allOf` branch contributing only `required` is dropped by both language generators. The core model retains it, so the loss is downstream — but the fix belongs wherever the merge decides a branch is empty. | `transform/` allOf merge | `v3/allof-schemas` `AllOfRequiredOnly` |
| 5 | `prefixItems` is dropped silently, and the array then renders as an array of the `items` tail type — actively mistyping rather than degrading. | array transform | `v3.1/array-schemas` `TupleWithRest`, `ClosedTuple` |

### Batch 2 — TypeScript generator

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 6 | `anyOf` is rendered as an **intersection** of `Partial<>` instead of a union. `AnyOfPrimitives` becomes `(Partial<string>) & (Partial<number>)`, which collapses to `never`. Every `anyOf` in the corpus is semantically wrong. | `generators/models/model-generator.ts:363-366` | `v3/anyof-schemas` (all names) |
| 7 | 18 × `TS2456` circular-type-alias errors: composed schemas are emitted as bare `type` aliases, which TypeScript forbids from referencing themselves. Assess feasibility — emitting an `interface` for object-shaped composed schemas is the known fix. If it proves disproportionate, document and defer rather than silently skipping. | model emission | `v3/discriminator-variants` |

### Batch 3 — Kotlin generator

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 8 | Enum values whose cased name is empty emit a nameless constant (`("1"),`) and an empty `when` branch. Invalid Kotlin. Root cause is `getWords` stripping leading digits (`string.utils.ts:70`), so `toCasing('1')` is `''`. | `generators/models/model-generator.ts:141,163` | `v3/enum-schemas` `IntEnum`, `NumEnum`, `EnumWithNumericStrings`, `EnumWithEmptyString`, `MixedEnum` |
| 9 | The `anyOf` traversal has no visited-set, so a branch cycling back to its own holder overflows the stack. The same cycle through `oneOf` is handled. | `generators/models/model-generator.ts` anyOf walk | `v3/anyof-cycle` (10 error snapshots) |
| 10 | A nested `oneOf` inside an `allOf` is silently dropped; only the sibling property survives. | model merge | `v3/nested-composition` `AllOfContainingOneOf`, `PropertyOfNestedComposition` |
| 11 | A same-name conflicting-type `allOf` merge silently drops one side with no marker. | model merge | `v3/allof-schemas` `AllOfConflicting` |
| 12 | `spring-reactive-web-clients` never emits `@Deprecated`, for a deprecated operation with or without a description. `okhttp3-clients` emits `@Deprecated("")` from the same input. | spring-reactive-web-clients generator | `v3/defaults-and-deprecated` `deprecatedOp` |
| 13 | `spring-controllers` emits `@Operation(deprecated = true)` but never `@Parameter(deprecated = true)` for a deprecated parameter. | spring-controllers generator | `v3/defaults-and-deprecated` `deprecatedParams` |

### Batch 4 — k6 client generator

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 14 | A deprecated parameter with no description renders a dangling `Deprecated:` with nothing after the colon. Introduced by commit `a92d29a`, which fixed the adjacent literal-`undefined` bug and left this one. | `generators/services/k6-clients/k6-client-generator.ts` | `v3/defaults-and-deprecated` `deprecatedParams.noDesc` |

### Batch 5 — declaration-level nullability (found during the sweep, not in the original 14)

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 15 | `nullable` is honoured **only** when rendering an object property. A nullable schema used as a type alias, an array item, or an `anyOf`/`oneOf` branch silently loses its `| null`. In TypeScript, `nullable` appears at exactly one site: `model-generator.ts:238`. So `AnyOfWithNullable`, whose second branch is `{integer, nullable: true}`, renders `(string) \| (number)` with no `null` anywhere. | TypeScript `model-generator.ts:238`; the Kotlin equivalent needs locating | `v3/anyof-schemas` `AnyOfWithNullable`, `v3/nullable-schemas` (all), `v3.1/nullable-schemas` |

Found by the batch-2 reviewer, and it is the same gap batch 1 ran into from the other side: batch 1's core fixes for 3.1
nullability churned no generator output precisely because no generator reads declaration-level nullability. Fixing this
makes those two core fixes load-bearing.

**Scope is deliberately narrow, and the boundary matters.** There are two readings of this defect:

- **Where nullability is lost with no compensation** — an `anyOf`/`oneOf` branch, an array's `items`, a `$ref`'d type
  used as a composition member. Nothing downstream re-adds the `null`, so the generated type simply cannot represent a
  value the spec permits. This is a defect and this batch fixes it.
- **Where a compensating mechanism already exists** — a nullable schema emitted as a top-level type alias. The property
  renderer at `model-generator.ts:238` adds `| null` when the *property* is nullable, so the common path is covered.
  Hoisting `null` into every alias instead would change the output semantics of the library for every downstream
  consumer, which is a design decision for the repo owner rather than a bug fix.

This batch therefore fixes the first and leaves the second alone, and must not double-add `null` where the property
renderer already does. Check whether Kotlin has the same split before assuming it does.

### Batch 6 — Kotlin discriminated-subtype contract (found during the sweep, not in the original 14)

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 16 | For an implicit or partially-mapped discriminator, the generated Kotlin does not compile: the base interface hoists **every** subtype's properties, while each subtype implements neither the discriminator property nor the hoisted ones, and its own properties lack `override`. Both halves of the contract are broken in opposite directions. **12 model files × 10 profiles = 120 uncompilable files.** | Kotlin base/subtype member computation; `collectSubSchemaProperties` never gives a subtype its base's properties | `v3/discriminator-variants` |

Example, from `test/output/kotlin/models@sb3/v3/discriminator-variants/**`:

```kotlin
interface ImplicitBase { val petType: String; val breed: String?; val lives: Int? }
data class ImplicitDog(val breed: String? = null) : ImplicitBase   // 3 compile errors
```

`ImplicitDog` implements neither `petType` (non-null, required) nor `lives`, and `breed` is missing `override`.
`AllOfInheritanceDiscriminator*` is by contrast **correct**, which is the useful contrast: the explicit-`allOf`
inheritance encoding works and the `oneOf`-holder encoding does not. This is the largest correctness hole in the Kotlin
corpus. Batch 3 correctly left it alone — its own defect-10 fix would have removed some of these errors while
introducing a semantic lie — so it needs its own batch.

### Defect 17 — a discriminated base that is itself a subtype (found by batch 6, not scheduled)

`NestedDiscriminatorGroup` compiles, but the inheritance relation it describes cannot be expressed at all. Two
independent causes, one per package:

- `getInterface` (`packages/kotlin/src/generators/models/model-generator.ts:117-132`) passes only `doc`, `annotations`
  and `members` to `kt.interface`. There is no `implements`, where `getClass` twenty lines above has one. **An interface
  can never be a subtype in this generator.**
- `resolveDescriminatorMapping` (`packages/core/src/transform/transform-schema.ts:192`) registers an implicit subtype
  only under `schema.kind === 'combined' && schema.allOf`. A `'oneOf'`-kind subtype is skipped, so
  `NestedDiscriminatorGroup` never enters `NestedDiscriminator`'s mapping and never gains it in `inheritedSchemas`.

Consequence: `NestedDiscriminator`'s `@JsonSubTypes` lists only `Leaf`, and **no** value round-trips through the parent
for the `Group` branch. Fixing it needs both an emitter change and a core change, so it is its own task.

### Defect 18 — TypeScript misclassifies an empty-named model file as a bare module, leaking an absolute path into generated source (found by phase 2b task 5, not scheduled)

A TypeScript-generated model whose normalized name is the empty string (a schema name from which no ASCII
alphanumeric character survives `getWords`'s strip — see `___`, `日本語`, `Ελληνικά`, `Кириллица` in the phase 2b
corpus) writes its file under a basename that is literally `.ts` (e.g. `models/.ts`). `getImportKind`
(`packages/typescript/src/import-collection.ts:198-201`):

```ts
protected getImportKind(fromModule: string): TypeScriptImportKind {
  const extName = extname(fromModule).toUpperCase();
  return extName === '.TS' || extName === '.JS' || extName === '.JSON' ? 'file' : 'module';
}
```

`node:path`'s `extname` returns `''` for a path whose basename is exactly `.ts` — the same reason `.bashrc` has no
extension: a leading dot with nothing before it is a hidden file, not an extension. So this one file is misclassified
as a bare `'module'` specifier instead of a `'file'`, and `resolveModulePath` (`import-collection.ts:203-215`) only
calls `getModulePathRelativeToFile` — the function that turns an absolute path into a relative import — for the
`'file'` kind. For `'module'`, the schema's raw absolute *output-directory* path is written straight into the
package's `models.ts` barrel instead of a relative import.

Pinned by `v3/extreme-names` (`___`) and `v3/non-ascii-names` (`日本語`/`Ελληνικά`/`Кириллица`), every TypeScript
profile — e.g. `test/output/typescript/models/v3/extreme-names/models.ts` line 1 (and the identical first line of
the same file under `angular-services`, `fetch-clients`, `k6-clients`, `easy-network-stub`, and the `non-ascii-names`
sibling in all five).

The committed snapshot line reads `export type {  } from '<output>/models/.ts';` rather than a real filesystem path
— `test/harness/snapshot/normalize.ts` (`normalizeFileTree`/`replaceOutputDir`) neutralizes the ephemeral per-run
temp output directory into the `<output>` marker before the tree is compared or committed, the same way it already
neutralized a leaked path in `state.txt` and in generation-error text (the tree-content path had no such
neutralization until phase 2b task 5 found the gap and closed it — see that task's report for the harness fix).
**The `<output>` marker is the harness doing its job, not evidence the underlying bug is fixed**: a reader of this
snapshot should not mistake `<output>/models/.ts` for a resolved leak — it is the same leak, made stable and
reviewable instead of a randomly-named temp path that changed on every run. Before the harness fix, and while
`existingFileBehavior: 'error'` was in effect, generation aborted on an unrelated filename collision before
`models.ts` was ever written for either spec, so this defect's committed-output consequence was invisible until
task 5's round 2 switched to `existingFileBehavior: 'count'` and let generation run far enough to reach it.

Not fixed here — this phase records defects rather than fixing them. The fix belongs in `getImportKind`: also treat
a path whose basename starts with `.ts`/`.js`/`.json` (i.e. an empty component name) as `'file'`, not `'module'`.

### Also registered, not scheduled

Small, verified, and each needing either a decision or a home:

- **Kotlin `hasProperty` is not undefined-safe** at `packages/kotlin/src/generators/models/model-generator.ts:732-733`:
  `'oneOf' in schema && schema.oneOf.some(...)`. `normalizeSchema` in the same file constructs `{...schema, oneOf:
  undefined}`, so an own `oneOf` key holding `undefined` is a shape this codebase produces. Unreachable today because
  the only caller is filtered to discriminated schemas. `schema.oneOf?.some(...)` closes it. Fold into batch 5.
- **Enums whose values share a string form emit dead constants.** `[2, '2', 2.0]` yields `_2`, `_2_2`, `_2_3`, all
  carrying `@JsonProperty("2")` and all three `when` labels `"2"`. Names no longer collide and it compiles (duplicate
  `when` labels are a Kotlin warning), but `fromValue` can only ever return `_2`. Arguably an invalid spec; no corpus
  case. Decision needed, not a fix.
- **Enum constant names are order-sensitive for colliding values only.** Reordering `[2, '2']` swaps `_2` and `_2_2`.
  Inherent to any suffix scheme; distinct values are position-independent. Documentation, not a fix.
- **`hasInvalidSubSchema` remains inverted** for `combined` branches (`packages/core/src/utils/schema.utils.ts`), and
  batch 3's defect-10 change made it newly inconsistent under `ignoreNonObjectParts: false`. All five call sites pass
  `true`, so no generated output is affected — verified twice, by two reviewers.
- **The nested and top-level `oneOf` readings now disagree in principle.** `composedOneOf` treats a discriminated
  `oneOf` as a subtype list, while Kotlin's `normalizeSchema` still flattens a top-level `oneOf` into `allOf`/`anyOf`
  and merges every branch regardless of discriminator. Pre-existing at the top level; no output impact.
- **No name deduplication exists anywhere in the three packages.** Batch 1's nested-naming fix replaced opaque ordinal
  fallbacks, which were collision-free by construction, with composed names that are not. A dedup mechanism is a design
  task.

### Explicitly out of scope

These are **missing features**, not defects, and each needs its own design:

- OpenAPI 3.1 JSON Schema keyword support: `patternProperties`, `contains`/`minContains`/`maxContains`,
  `unevaluatedItems`, `unevaluatedProperties`, `dependentSchemas`, `dependentRequired`, `propertyNames`. All are
  currently dropped from the transformed model without error. Defect 5 covers only the one case where dropping produces
  actively wrong output rather than absent output.
- `const` support. A bare `const` resolves to kind `unknown`. Treating it as a single-value enum is a feature.
- Non-ASCII identifier handling. `getWords` replaces every non-ASCII character (`string.utils.ts:69`), so `日本語`
  reduces to `''` and `über` to `ber`. Phase 2b task 5 will pin the current behaviour; changing it is a feature with a
  large blast radius across every generated name.

`getWords` itself is deliberately **not** changed by this plan. Its leading-digit strip is the root cause of defect 8,
but it is reached by every generated name in the repo, so altering it would rewrite thousands of snapshots to fix one
enum bug. Defect 8 is fixed where an identifier is required to be valid and non-empty.

---

### Task 1: Core transform fixes

**Files:**

- Modify: `packages/core/src/transform/helpers.ts`
- Modify: `packages/core/src/transform/transform-schema.ts` (and siblings as the defects require)
- Test: `packages/core/src/transform/helpers.test.ts`, `packages/core/src/transform/transform-schema.test.ts`
- Regenerate: `test/output/**`

**Interfaces:**

- Consumes: nothing. This is the first batch.
- Produces: a corrected `ApiSchema` model. Batches 2 and 3 build on it — in particular, if defect 4 is fixed here, the
  language generators may need no change for it, and if defect 5 is fixed here the TypeScript mistyping disappears
  without touching the TypeScript generator. Record which downstream defects your fix resolved so batches 2 and 3 do not
  re-fix them.

Defects 1-5 above. Take them one at a time, each with its own failing test first.

- [ ] **Step 1: Write a failing test for defect 1**

In `packages/core/src/transform/helpers.test.ts`, a `determineSchemaKind` test asserting that a schema with
`type: ['object', 'null']` and an `allOf` is `'multi-type'`, not `'combined'`. Run it and confirm it fails.

- [ ] **Step 2: Fix defect 1**

Reorder so the `Array.isArray(schema.type)` check precedes the `allOf`/`anyOf` branch, or make the `allOf` branch
tolerate a type array containing `'object'`. Whichever you choose, a type array containing `'null'` must set
`nullable: true` on the resulting schema. Verify `test/output/core/v3.1/nullable-schemas/model.txt` flips
`NullableWithAllOf` to `nullable: true` and matches its v3 twin's nullability.

- [ ] **Step 3: Run the test and the core suite**

Run: `deno task test:core`
Expected: PASS, including every pre-existing test. A pre-existing test that now fails is a signal your reordering
changed behaviour beyond the defect — investigate before proceeding, and report it rather than editing the old test to
match new behaviour.

- [ ] **Step 4: Repeat Steps 1-3 for defects 2, 3, 4 and 5**

One failing test, one fix, one green suite each. For defect 3, the composed name must continue the chain
(`NestedInlineObject_middle_inner` or the established separator) rather than falling back to an ordinal. For defect 5,
the honest minimum is that a `prefixItems` array does not claim to be an array of the tail type; `unknown[]` is
acceptable, silently wrong is not.

- [ ] **Step 5: Regenerate and review the churn**

```bash
deno task test:output
git diff --stat -- test/output | tail -1
```

Read the actual diff for at least three affected specs and confirm each change is the intended consequence of a fix,
not collateral. Report anything you cannot explain.

- [ ] **Step 6: Confirm the error snapshots did not grow**

```bash
git status --porcelain test/output | grep -c 'error\.txt'
git ls-files 'test/output/**/*.error.txt' | wc -l
```

A new `.error.txt` means a fix introduced a crash. That blocks the batch.

- [ ] **Step 7: Full gates and commit**

```bash
deno fmt --check && deno lint && deno task test && deno task test:output:check
git add packages/core test/output
git commit -m "fix(core): correct 3.1 nullability, nested naming, allOf merge and prefixItems handling"
```

---

### Task 2: TypeScript generator fixes

**Files:**

- Modify: `packages/typescript/src/generators/models/model-generator.ts`
- Test: `packages/typescript/src/generators/models/model-generator.test.ts`
- Regenerate: `test/output/**`

**Interfaces:**

- Consumes: the corrected core model from Task 1. Read Task 1's report first — if it fixed defect 5 in core, the
  TypeScript `prefixItems` mistyping is already gone and needs no work here.
- Produces: nothing later batches depend on.

Defects 6 and 7 above.

- [ ] **Step 1: Write a failing test for defect 6**

Assert that a schema with `anyOf: [string, number]` renders as a union, not an intersection — and specifically that the
rendered type is inhabitable. The strongest form of this test asserts the emitted text contains `|` and not
`Partial<`; the more valuable form additionally type-checks the emitted text. Run it and confirm it fails.

- [ ] **Step 2: Fix defect 6**

`getCombinedType` at `model-generator.ts:358-367` builds one intersection from both `allOf` and `anyOf`. `allOf` is
correctly an intersection. `anyOf` means "valid against at least one branch", which is a union — and TypeScript unions
already admit values matching several branches, so the `Partial<>` wrapper is not needed to express optionality. The
result for a schema with both should intersect the `allOf` branches with the union of the `anyOf` branches. Check that
the emitted union is parenthesised where precedence requires it.

- [ ] **Step 3: Run the suite**

Run: `deno task test:typescript`
Expected: PASS. Pre-existing tests asserting the `Partial<>` intersection should be updated — that is the point of the
fix — but state in your report exactly which assertions you changed and why each old expectation was wrong.

- [ ] **Step 4: Assess defect 7 and either fix or document it**

Measure the current `TS2456` count first, so you can report a delta:

```bash
deno task test:output
```

then type-check a generated tree (rewrite relative imports to carry explicit `.ts` extensions, then `deno check`).
Emitting an `interface` for object-shaped composed schemas is the known fix, because TypeScript permits interfaces to
reference themselves where it forbids bare type aliases. If that turns out to be a large restructuring of model
emission, do not attempt it inside this batch: report the measured count, the specific reason, and what a proper fix
would take. Documenting a deferral honestly is an acceptable outcome; a half-migration is not.

- [ ] **Step 5: Regenerate, review churn, confirm no new error snapshots**

As Task 1 Steps 5 and 6. The `anyOf` fix should churn every spec containing an `anyOf` — `v3/anyof-schemas`,
`v3/object-schemas`, `v3/nested-composition`, `v3.1/nullable-schemas` among them. Name the specs that changed and
confirm the shape of the change in at least three.

- [ ] **Step 6: Full gates and commit**

```bash
deno fmt --check && deno lint && deno task test && deno task test:output:check
git add packages/typescript test/output
git commit -m "fix(typescript): render anyOf as a union instead of a Partial intersection"
```

---

### Task 3: Kotlin generator fixes

**Files:**

- Modify: `packages/kotlin/src/generators/models/model-generator.ts`
- Modify: the `spring-reactive-web-clients` and `spring-controllers` generators under
  `packages/kotlin/src/generators/services/`
- Test: the colocated `.test.ts` files
- Regenerate: `test/output/**`

**Interfaces:**

- Consumes: the corrected core model from Task 1. Read Task 1's report — defects 4, 10 and 11 may be wholly or partly
  resolved there, in which case verify and say so rather than fixing twice.
- Produces: nothing later batches depend on.

Defects 8-13 above. This is the largest batch; take the defects in the listed order, since 8 and 9 are the ones
producing invalid output and a crash.

- [ ] **Step 1: Write a failing test for defect 8**

Assert that an enum with values `1`, `2` and `''` produces valid, distinct, non-empty Kotlin constant names and a
`when` branch with a result for each. Run it and confirm it fails.

- [ ] **Step 2: Fix defect 8**

Both `getEnum` sites — the constant at `model-generator.ts:141` and the `when` branch at `:163` — call
`toCasing(String(x), ctx.config.enumValueNameCasing)` and must agree, so route both through one helper. When the cased
name is empty, derive a deterministic valid Kotlin identifier from the raw value; a leading `_` covers the numeric case
(`1` becomes `_1`). Two raw values must never collide onto one constant name — `MixedEnum` contains both `1` and `'1'`,
so de-duplicate deterministically. Do not change `getWords`; see the register.

- [ ] **Step 3: Run the suite**

Run: `deno task test:kotlin`
Expected: PASS.

- [ ] **Step 4: Fix defect 9**

Give the `anyOf` traversal the visited-set the `oneOf` path has. The reproduction is
`test/specs/v3/anyof-cycle.yml`: a schema whose `anyOf` branch `allOf`s back to that same schema. Write a test that
generates from that shape and asserts it terminates. Success here **deletes ten committed `.error.txt` snapshots** and
replaces them with real trees — that is the intended outcome and the strongest single signal in this batch. Confirm the
count drops from 10 to 0.

- [ ] **Step 5: Repeat for defects 10, 11, 12 and 13**

One failing test, one fix, one green suite each. For defect 11 the correct behaviour is a judgment call: silently
dropping a branch is wrong, but so is emitting uncompilable Kotlin. Pick the behaviour you can defend — a conflict
marker in the doc comment, or a widened type — state your reasoning in the report, and make the test assert it. For
defects 12 and 13, match what `okhttp3-clients` already does rather than inventing a new convention.

- [ ] **Step 6: Regenerate, review churn, confirm the error snapshots dropped to zero**

As Task 1 Steps 5 and 6, except that here the `.error.txt` count must fall from 10 to 0. If any remain, name the spec
and profile and explain why.

- [ ] **Step 7: Full gates and commit**

```bash
deno fmt --check && deno lint && deno task test && deno task test:output:check
git add packages/kotlin test/output
git commit -m "fix(kotlin): valid enum identifiers, anyOf cycle guard, composition merge and deprecation annotations"
```

---

### Task 4: k6 dangling deprecation label

**Files:**

- Modify: `packages/typescript/src/generators/services/k6-clients/k6-client-generator.ts`
- Test: `packages/typescript/src/generators/services/k6-clients/k6-client-generator.test.ts`
- Regenerate: `test/output/typescript/k6-clients/**`

**Interfaces:**

- Consumes: nothing. Independent of the other batches.
- Produces: nothing.

Defect 14. This is a three-line fix with a one-file snapshot consequence; it is its own task only because it belongs in
its own commit.

- [ ] **Step 1: Write the failing test**

A k6 client generated from an operation with a deprecated parameter that has no description must not contain
`Deprecated:` followed by nothing. Assert on the rendered JSDoc text. Run it and confirm it fails.

- [ ] **Step 2: Fix it**

The current expression yields the literal `'Deprecated: '` when a parameter is deprecated and has no description. A
bare `@deprecated`-style marker with no trailing colon is what the fetch-client and Angular-service generators already
produce from the same input; match them rather than inventing a third convention.

- [ ] **Step 3: Verify and commit**

```bash
deno task test:typescript
deno task test:output
git diff --stat -- test/output
```

Expected churn: `test/output/typescript/k6-clients/v3/defaults-and-deprecated/**` only. Then:

```bash
deno fmt --check && deno lint && deno task test && deno task test:output:check
git add packages/typescript test/output
git commit -m "fix(k6): drop the dangling Deprecated label for parameters without a description"
```

## Notes for the executing agent

- The corpus is the oracle. Every one of these defects is caught by a spec that is already committed, so after each fix
  the snapshot diff tells you whether the fix reached the output. A fix with no churn needs explaining.
- Ten committed `.error.txt` files are a running score. They must be 10 at the start of Task 3 and 0 at its end, and
  must never grow in any batch.
- Resist widening scope into the out-of-scope list. Those are features; this plan is defects.
