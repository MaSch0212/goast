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
| 7 | **105 ×** `TS2456` circular-type-alias errors (the original count of 18 was one spec in one profile): composed schemas are emitted as bare `type` aliases, which TypeScript forbids from referencing themselves. Assess feasibility — emitting an `interface` for object-shaped composed schemas is the known fix. If it proves disproportionate, document and defer rather than silently skipping. **Compile gate:** `test/compile/typescript/models/v3/discriminator-variants.txt`, `…/v3/anyof-cycle.txt` and the same pair under the other four TypeScript profiles — `TS2456 Type alias 'X' circularly references itself.`, **105 occurrences across 10 units** (two units in each of the 5 profiles; 21 occurrences per profile, being 18 in `v3/discriminator-variants` plus 3 in `v3/anyof-cycle`, which the original count did not include). Largest TypeScript defect the gate found on both occurrences and units. | model emission | `v3/discriminator-variants` |

### Batch 3 — Kotlin generator

| # | Defect | Site | Pinned by |
| - | ------ | ---- | --------- |
| 8 | Enum values whose cased name is empty emit a nameless constant (`("1"),`) and an empty `when` branch. Invalid Kotlin. Root cause is `getWords` stripping leading digits (`string.utils.ts:70`), so `toCasing('1')` is `''`. **Compile gate: the "Invalid Kotlin" claim no longer holds.** `v3/enum-schemas` compiles clean in all ten Kotlin profiles — the only snapshot is `test/compile/kotlin/okhttp3-clients@sb4/v3/enum-schemas.txt`, carrying nothing but that profile's unrelated `Serializer.kt` pair (defect 26). Every constant is named and every `when` branch has a label: `IntEnum` emits `_1`/`_2`/`_3`, `NumEnum` emits `_1_1`/`_2_2`/`_3_3`, `EnumWithEmptyString` emits `_EMPTY`, `MixedEnum` emits `ONE`/`_2`/`TRUE`/`NULL`. Fixed by `ae6fd17`, an ancestor of the commit adding this note. Annotated rather than removed: the row may still cover concerns beyond the compile break, so re-scoping it belongs to whoever picks it up. | `generators/models/model-generator.ts:141,163` | `v3/enum-schemas` `IntEnum`, `NumEnum`, `EnumWithNumericStrings`, `EnumWithEmptyString`, `MixedEnum` |
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
| 16 | For an implicit or partially-mapped discriminator, the generated Kotlin does not compile: the base interface hoists **every** subtype's properties, while each subtype implements neither the discriminator property nor the hoisted ones, and its own properties lack `override`. Both halves of the contract are broken in opposite directions. **12 model files × 10 profiles = 120 uncompilable files.** **Compile gate: this compile claim no longer holds, and the 120 figure is stale.** `v3/discriminator-variants` compiles clean in all ten Kotlin profiles — the only snapshot is `test/compile/kotlin/okhttp3-clients@sb4/v3/discriminator-variants.txt`, carrying nothing but that profile's unrelated `Serializer.kt` pair (defect 26). The output is now correct rather than merely compiling: `ImplicitBase.kt` declares `petType` alone instead of hoisting every subtype's property, and `ImplicitDog.kt` carries `override val petType: String = "ImplicitDog"` — so both halves of the contract this row describes are closed. Fixed by `38c3e0e`, an ancestor of the commit adding this note. Annotated rather than deleted: the row may still cover concerns beyond the compile break, so re-scoping it belongs to whoever picks it up. | Kotlin base/subtype member computation; `collectSubSchemaProperties` never gives a subtype its base's properties | `v3/discriminator-variants` |

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

**Compile gate:** `test/compile/typescript/models/v3/extreme-names.txt` (and the `v3/non-ascii-names` sibling, and
both under `fetch-clients`) — `TS2307 Import "<output>/models/.ts" not a dependency and not in import map from
"models.ts"`, **4 occurrences across 4 units**. One diagnostic per spec rather than one per empty-named schema,
because only the schema whose file basename is exactly `.ts` is misclassified; the `_1.ts`/`_2.ts` counted siblings
have real basenames and resolve correctly. **The gate under-reports this defect.** The identical leaked line is
present in all five TypeScript profiles' `models.ts`, but only the two host-checked ones (`models`, `fetch-clients` —
`test/compile-tests/compile.test.ts:29`) report it. `tsc` 5.7.3 under `test/docker/node/tsconfig.base.json` reports
nothing for the same line in `angular-services`, `k6-clients` and `easy-network-stub`. Why is not established here; a
zero-binding `export type {  } from …` being elided before resolution is the plausible reason and is unverified. Do
not read the three silent profiles as unaffected.

Cross-reference: **must not land before defect 21 is fixed.** `deno check` refuses to build a module graph
containing any unparseable module, root or merely imported — it reports only that one error and checks nothing
else — so `runDenoCheck`'s workaround (`test/compile-tests/runners/deno-check.ts`) drops an unparseable file from
the root list and retries, which excludes it only while it stays unreachable from every other root. Fixing this
defect resolves the `<output>/models/.ts` specifier into a real import, making the still-unparseable `models/.ts`
(defect 21) reachable from `models.ts` instead of merely a root, so the workaround can no longer exclude it: the
four affected units (`models`/`fetch-clients` × `extreme-names`/`non-ascii-names`) would fail loudly with a harness
error instead of the diagnostics defect 21 records. Land defect 21's fix first.

Not fixed here — this phase records defects rather than fixing them. The fix belongs in `getImportKind`: also treat
a path whose basename is **exactly** `.ts`, `.js`, or `.json` (i.e. an empty component name) as `'file'`, not
`'module'` — basename equality with the extension, not a prefix match (a prefix match would also wrongly capture
`.tsx`, `.tsconfig`, or `.jsonc`, which are not this bug).

### Defect 19 — `spring-controllers` writes `responseCode = null` for `default` and range-coded responses, uncompilable (found by phase 2b task 7, confirmed by the tier-3 compile gate, not scheduled)

`getApiInterfaceEndpointMethodAnnnotations` (`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:211-212`) builds each `@ApiResponse`'s `responseCode` argument as
`kt.string(response.statusCode?.toString())`. `response.statusCode` is only populated for an exact numeric code; a
`default` response or a range code (`2XX`, `4XX`, `5XX`) leaves it `undefined`, so `response.statusCode?.toString()`
is `undefined` and `kt.string(undefined)` constructs a `KtString` with `value: null`. `KtString.onWrite`
(`packages/kotlin/src/ast/nodes/string.ts:43-45`) renders a `null` value as the bare token `null`, unconditionally —
there is no branch that omits the argument or substitutes a sentinel string. The result, written straight into
generated Kotlin source, is `ApiResponse(responseCode = null, ...)`.

**This is a compile break, not merely lost information — established, no longer a prediction.**
`io.swagger.v3.oas.annotations.responses.ApiResponse.responseCode()` is declared as a non-nullable `String` annotation
element (with a non-null default, `"default"`), and neither the Kotlin nor the Java annotation-argument grammar
permits assigning `null` to a non-nullable-typed element. Phase 2b registered that as high-confidence-**unverified**:
neither the task 7 worker nor its reviewer compiled the affected file, because the repo had no Kotlin compilation step
at the time. The tier-3 gate compiles it, and the prediction was correct — including the predicted site count.
Secondary to the compile break: `default`, `2XX`, `4XX` and `5XX` all collapse to the identical `responseCode = null`,
so even if this had compiled, the four would be indistinguishable from each other and from a genuine `default` in the
emitted annotation.

**Compile gate:** `test/compile/kotlin/spring-controllers@sb3/v3/response-variants.txt` (and the `@sb3-strict`,
`@sb4`, `@sb4-strict` siblings) — `Null cannot be a value of a non-null type 'String'.`, **28 occurrences across
4 units**, 7 per file, exactly one per site listed below and at exactly the lines listed below.

Affected files (all four `spring-controllers` profiles, since `springBootVersion` and `strictResponseEntities` do not
touch this code path):

- `test/output/kotlin/spring-controllers@sb3/v3/response-variants/com/openapi/generated/api/ResponsesApi.kt:51,62,96-98,112-113`
- `test/output/kotlin/spring-controllers@sb3-strict/v3/response-variants/com/openapi/generated/api/ResponsesApi.kt:54,65,99-101,115-116`
- `test/output/kotlin/spring-controllers@sb4/v3/response-variants/com/openapi/generated/api/ResponsesApi.kt:51,62,96-98,112-113`
- `test/output/kotlin/spring-controllers@sb4-strict/v3/response-variants/com/openapi/generated/api/ResponsesApi.kt:54,65,99-101,115-116`

(the `-strict` variants carry one extra annotation argument per response and so are shifted a few lines relative to
the plain variants; the pattern and site count are otherwise identical.)

Pinned by `v3/response-variants` — specifically `successAndDefault` (`default` alongside `200`), `onlyDefault`
(`default` alone), `rangeCodes` (`2XX`/`4XX`/`5XX` alone) and `mixedExactAndRange` (`200` + `2XX` + `default`
together). Not fixed here — this phase records defects rather than fixing them. A fix needs to decide what a
range-coded or `default` response's `responseCode` should read as (Swagger/OpenAPI tooling elsewhere typically uses
the literal string `"default"` for the default response and has no standard representation for a range code in this
particular annotation field); that decision, plus verifying the fix actually compiles, belongs to whichever batch
picks this up.

### Defect 20 — the TypeScript fetch client JSON-stringifies every `multipart/form-data` body (found by phase 2b task 9, not scheduled)

`FetchClientsGenerator`'s request builder (`packages/typescript/src/generators/services/fetch-clients/fetch-client-generator.ts:226`) decides how to serialize a request body from schema presence alone:

```ts
endpoint.requestBody?.content[0]?.schema ? ts.property('body', { value: 'JSON.stringify(body)' }) : null,
```

This branch never inspects `endpoint.requestBody.content[0].contentType`, so every request body — JSON, form-urlencoded,
`multipart/form-data`, anything — is wrapped in `JSON.stringify(...)` and sent with no `Content-Type` header set to
match. For a `multipart/form-data` operation whose body includes a `Blob`-typed part, this is not just the wrong
serialization — `JSON.stringify` on an object holding a `Blob` produces `"{}"` (or drops the field, depending on the
engine), so the file content itself is lost on the wire, not merely mis-encoded.

Pinned by `v3/multipart-bodies`, all seven operations, in
`test/output/typescript/fetch-clients/v3/multipart-bodies/clients/multipart-client.ts`:
`singleFile` (line 31), `multipleFiles` (line 50), `fileAndFields` (line 72), `nestedObjectPart` (line 94),
`refPart` (line 113), `withEncoding` (line 135), `optionalFile` (line 154) — every one reads `body: JSON.stringify(body)`.
Five of the seven (`singleFile`, `multipleFiles`, `fileAndFields`, `withEncoding`, `optionalFile`) have a `Blob`-typed
field in the body, so the data-loss consequence above applies to those five; `nestedObjectPart` and `refPart` have no
`Blob` field and only mis-serialize.

**Scoped to the `fetch-clients` profile only.** The other two TypeScript client generators that emit multipart
operations both delegate to a shared, content-type-aware request builder instead of inlining `JSON.stringify`:
`k6-clients` and `angular-services` both emit `rb.body(params.body, 'multipart/form-data')`
(`test/output/typescript/k6-clients/v3/multipart-bodies/clients/multipart-client.js` and
`test/output/typescript/angular-services/v3/multipart-bodies/services/multipart.service.ts`, seven call sites each).
Whether that builder itself handles `multipart/form-data` correctly is not verified here — only that neither of those
two profiles inlines the JSON-stringify mistake `fetch-clients` does.

This is a distinct defect from `multipart-bodies.yml`'s inert `style` key (a corpus quirk recorded in `test/README.md`,
not a generator bug): the `encoding` block being ignored is specification-conformant and separate from the body itself
being serialized wrong regardless of `encoding`. Not fixed here — this phase records defects rather than fixing them.
A fix needs `fetch-client-generator.ts` to branch on `content[0].contentType`: build a `FormData` and `append` each
property for `multipart/form-data`, URL-encode for `application/x-www-form-urlencoded`, and keep `JSON.stringify` only
for JSON-like media types.

### Defect 21 — Kotlin and TypeScript both emit an unnamed type declaration for a schema whose normalized name is empty (found by phase 2b task 5, not scheduled)

`getDeclarationTypeName` computes a type's emitted identifier as `toCasing(schema.name, ...)` with no fallback for the
empty string, in both language generators:

- Kotlin: `packages/kotlin/src/generators/models/model-generator.ts:658`, feeding `getClass` (`:94`) and `getInterface`
  (`:120`).
- TypeScript: `packages/typescript/src/generators/models/model-generator.ts:502`, feeding `getTypeAlias` (`:157`).

For a schema whose name normalizes to the empty string via `getWords`'s ASCII-alphanumeric strip
(`string.utils.ts:69`) — `___` in `v3/extreme-names.yml`, and `日本語`/`Ελληνικά`/`Кириллица` in
`v3/non-ascii-names.yml` — this produces literally-empty type declarations: Kotlin writes `data class (` (invalid
Kotlin — no identifier before the parameter list) and TypeScript writes `export type  = {` (invalid TypeScript — no
identifier between `type` and `=`). Both are syntactically invalid, not merely badly named.

Counted directly from the committed snapshots: Kotlin hits **40 files** (4 empty-named schemas — `___` from
`extreme-names`, three from `non-ascii-names` — × 10 profiles: `models@sb3`, `models@sb4`, `okhttp3-clients@sb3`,
`okhttp3-clients@sb4`, `spring-controllers@sb3`, `spring-controllers@sb3-strict`, `spring-controllers@sb4`,
`spring-controllers@sb4-strict`, `spring-reactive-web-clients@sb3`, `spring-reactive-web-clients@sb4`), e.g.
`test/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/.kt` and
`test/output/kotlin/models@sb3/v3/non-ascii-names/com/openapi/generated/model/_1.kt`. TypeScript hits **20 files**
(the same 4 schemas × 5 profiles: `models`, `fetch-clients`, `angular-services`, `k6-clients`, `easy-network-stub`),
e.g. `test/output/typescript/models/v3/extreme-names/models/.ts`.

**Compile gate:** Kotlin — `test/compile/kotlin/models@sb3/v3/extreme-names.txt` and its 19 siblings,
`Syntax error: Name expected.`, **40 occurrences across 20 units**, matching the 40 predicted files exactly.
TypeScript — `test/compile/typescript/angular-services/v3/extreme-names.txt` and its 5 siblings, **48 occurrences
across 6 units**, four surface shapes of the one root cause per file: `TS1005 '{' expected.` at the missing
identifier, then `TS2304 Cannot find name 'X'.` / `TS1109 Expression expected.` / `TS2693 'X' only refers to a type,
but is being used as a value here.` as `tsc` re-reads the object body `{ prop?: string; }` as a conditional
expression. All four were confirmed to come from this defect and nothing else. All 20 TypeScript files are reachable:
the host runner passes every `.ts` file in a unit to `deno check` rather than entering through a barrel
(`test/compile-tests/runners/deno-check.ts`), so `models` and `fetch-clients` no longer depend on defect 18's broken
import to reach the empty-named file. Checking it directly surfaced **8 new diagnostic lines across 4 units**, all
one message — `The module's source code could not be parsed: Expected '{', got '='` — one occurrence each in
`models/v3/extreme-names` and `fetch-clients/v3/extreme-names`, three each in `models/v3/non-ascii-names` and
`fetch-clients/v3/non-ascii-names` (`test/compile/typescript/models/v3/extreme-names.txt`,
`fetch-clients/v3/extreme-names.txt`, `models/v3/non-ascii-names.txt`, `fetch-clients/v3/non-ascii-names.txt`).

Cross-reference: **defect 21 must be fixed before defect 18.** `deno check` refuses to build a module graph
containing any unparseable module, root or merely imported — it reports only that one error and checks nothing
else — so `runDenoCheck`'s workaround (`test/compile-tests/runners/deno-check.ts`) drops an unparseable file from
the root list and retries, which excludes it only while it stays unreachable from every other root. Fixing defect 18
resolves the `<output>/models/.ts` specifier into a real import, making the still-unparseable `models/.ts` (this
defect) reachable from `models.ts` instead of merely a root, so the workaround can no longer exclude it: the four
affected units (`models`/`fetch-clients` × `extreme-names`/`non-ascii-names`) would fail loudly with a harness error
instead of reporting the diagnostics above. Land this defect's fix first.

Cross-reference: distinct from **defect 8**, which covers the Kotlin *enum-constant* emission site (`getEnum`,
`model-generator.ts:141,163`) for an enum value whose cased name is empty — a different generator function, pinned by
a different corpus entry (`v3/enum-schemas`), producing a different symptom (a nameless enum constant and an empty
`when` branch, not an unparseable type declaration). Distinct from **defect 18**, which is scoped to the TypeScript
*import path* consequence of a file that already has this defect — `getImportKind` misclassifying the resulting
empty-basename `.ts` file as a bare module specifier and leaking an absolute path into `models.ts`. Defect 18 assumes
the empty-named file already exists; this defect is why that file's own declaration is invalid content in the first
place, independent of how anything imports it.

Not fixed here — this phase records defects rather than fixing them.

### Defect 22 — Kotlin emits an unnamed constructor parameter for an object property whose normalized name is empty (found by phase 2b task 5, not scheduled)

`getClassParameter` (`packages/kotlin/src/generators/models/model-generator.ts:308`) computes a property's Kotlin
parameter name the same way — `toCasing(property.name, ctx.config.propertyNameCasing)`, no fallback — so a property
whose name normalizes to empty emits `val : String? = null` inside an otherwise-valid `data class`: invalid Kotlin,
missing the identifier between `val` and `:`.

Pinned by `ObjectWithExtremeProperties`'s `''` property in `v3/extreme-names.yml` and
`ObjectWithNonAsciiProperties`'s `日本語` property in `v3/non-ascii-names.yml` (`Ελληνικά` and `Кириллица` appear only
as type names in the corpus, not as property names). **20 files** across the 10 Kotlin profiles (10 per spec), e.g.
`test/output/kotlin/models@sb3/v3/extreme-names/com/openapi/generated/model/ObjectWithExtremeProperties.kt` and
`test/output/kotlin/models@sb3/v3/non-ascii-names/com/openapi/generated/model/ObjectWithNonAsciiProperties.kt`.

**Compile gate:** `test/compile/kotlin/models@sb3/v3/extreme-names.txt` and its 19 siblings —
`Syntax error: Parameter name expected.`, **20 occurrences across 20 units**, matching the 20 predicted files exactly.
That message shape occurs 80 times in the committed snapshots overall; the other 60 are in `v3/reserved-words` and
belong to **defect 23** below, not here. Counting the shape rather than the spec would overstate this entry fourfold.

TypeScript has no equivalent defect at this site: `getProperties` (`typescript/.../model-generator.ts:231`) emits a
property using its raw, uncased name as a quoted string-literal key rather than routing it through `toCasing`, so an
empty or non-ASCII property name still produces a valid quoted key — `''?: string;` and `'日本語'?: string;` in
`test/output/typescript/models/v3/extreme-names/models/object-with-extreme-properties.ts` and its `non-ascii-names`
sibling. That is a compensating mechanism Kotlin's parameter-name position has no equivalent for, which is also why
this defect is Kotlin-only where defect 21 above is not.

Cross-reference: distinct from **defect 8** (the enum-constant site, not a class-property site) and from **defect
18** (a TypeScript import-path consequence; inapplicable here since TypeScript has no property-level defect to leak
a path from). Kept as its own entry rather than folded into defect 21 above because the emission site differs (a
constructor-parameter declaration, not a type declaration) and so does a fix's scope (`getClassParameter` /
`getInterfaceProperty`, not `getDeclarationTypeName`) — even though both share the same `getWords`-empties-a-name
root cause.

Not fixed here — this phase records defects rather than fixing them.

### Defect 23 — Kotlin emits hard keywords unbackticked as property and constructor-parameter names (found by phase 2b task 5, confirmed by the tier-3 compile gate, not scheduled)

`getClassParameter` (`packages/kotlin/src/generators/models/model-generator.ts:308`) and `getInterfaceProperty`
(`:338`) both compute a Kotlin identifier as `toCasing(property.name, ctx.config.propertyNameCasing)` and hand the
result to the AST unexamined. Nothing downstream examines it either: `KtParameter.onWrite`
(`packages/kotlin/src/ast/nodes/parameter.ts:81`) and `KtProperty.onWrite`
(`packages/kotlin/src/ast/nodes/property.ts:168`) each do `builder.append(this.inject.beforeName, this.name,
this.inject.afterName)` and nothing more. A property named after a Kotlin **hard** keyword therefore emits an
identifier the parser rejects.

**A backtick-quoting helper does exist, it is the natural fix site, and two separate things are wrong with it.**
`toKotlinPropertyName` (`packages/kotlin/src/utils.ts:18-23`) returns a backticked name for any value failing
`/^[a-zA-Z_$][a-zA-Z_$0-9]*$/`, and `KotlinFileGenerator.toPropertyName`
(`packages/kotlin/src/generators/file-generator.ts:18-20`) already composes it with `toCasing` — precisely the
composition `getClassParameter` open-codes at `:308`. First, **it has zero callers**: `grep -rn "toPropertyName"
packages/` matches only its own definition and the import that feeds it, so the model generator bypasses it entirely.
Second, **routing through it unchanged would fix nothing here**, because it guards on identifier *charset* alone, and
`class`, `val`, `is`, `in` and `this` all match that pattern and would pass through unquoted. There is no keyword list
anywhere in `packages/kotlin`. A fix therefore needs both halves — route `:308` and `:338` through the helper *and*
give the helper a hard-keyword denylist. Either alone leaves this defect standing.

`test/output/kotlin/models@sb3/v3/reserved-words/com/openapi/generated/model/ObjectWithReservedProperties.kt` declares
nine properties, all unbackticked: `class` (`:10`), `val` (`:15`), `is` (`:20`), `in` (`:25`), `function` (`:30`),
`default` (`:35`), `constructor` (`:40`), `prototype` (`:45`), `this` (`:50`). **Exactly five break** — `class`,
`val`, `is`, `in`, `this`, the hard keywords. The other four compile clean, and that is the load-bearing detail:
`constructor` is a Kotlin **soft** keyword and is legal as an identifier, while `function`, `default` and `prototype`
are not Kotlin keywords at all (Kotlin's is `fun`, not `function`). So the fix is a hard-keyword denylist plus
backtick-quoting, **not** a general "looks reserved" filter — a filter broad enough to catch those four would rename
identifiers that are correct today and churn snapshots for nothing.

Thirteen diagnostics for five broken properties, because `val val:` alone yields **five** where the other four yield
two each: the parser cannot tell where the `val` modifier ends and the name begins, so its block (`:12-15`) carries
two `Conflicting declarations:`, two `Syntax error: Parameter name expected.` and the file's only
`An explicit type is required on a value parameter.`

**Compile gate:** `test/compile/kotlin/models@sb3/v3/reserved-words.txt` and its 9 profile siblings —
`Syntax error: Parameter name expected.` (60), `Conflicting declarations:` (60) and `An explicit type is required on a
value parameter.` (10). **130 occurrences across 10 units**, 13 per unit, and those 13 are identical in all ten Kotlin
profiles because this is a model-emission defect no profile option touches. (The snapshot *files* are byte-identical
in nine; `okhttp3-clients@sb4`'s carries two extra lines that belong to defect 26.) **Largest Kotlin defect the gate
found by occurrence count** — 130, ahead of defect 28's 115 and defect 26's 106. By units affected it is the smallest
of the Kotlin set at 10, because it is one model file per profile. The two metrics give near-opposite orders across
defects 23, 26 and 28, so any ranking here should say which one it means.

Pinned by `v3/reserved-words` (`ObjectWithReservedProperties`). Cross-reference: distinct from **defect 22** above,
which shares the emission site (`getClassParameter`) and one message shape but not the root cause — that one is an
identifier `getWords` emptied, this one is a perfectly well-formed identifier the *language* reserves. Defect 22 is
fixed by supplying a fallback name; this one by quoting a name that is already right. Distinct from **defect 24**
below, which is the same corpus entry and the same "the name is a Kotlin keyword" intuition applied in a *type*-name
position, and which the gate does not catch at all. Not fixed here — this phase records defects rather than fixing
them.

### Defect 24 — a Kotlin schema named after a `kotlin.*` type shadows that type for its whole package (found by phase 2b task 5, **not** caught by the tier-3 compile gate, not scheduled)

`getDeclarationTypeName` (`packages/kotlin/src/generators/models/model-generator.ts:657-658`) computes a type's
emitted identifier as `toCasing(args.schema.name, ctx.config.typeNameCasing)` and never checks it against the names
Kotlin's default imports already bind. A schema named `String`, `Int`, `List`, `Map`, `Any` or `Unit` is emitted as a
top-level class in `com.openapi.generated.model`, and a class declared in a package outranks a default import for
every other file in that package — so from that point on `String` in that package means the generated data class, not
`kotlin.String`.

`test/output/kotlin/models@sb3/v3/reserved-words/com/openapi/generated/model/` holds twenty files, nineteen of them
named after a Kotlin keyword or type. At least eight shadow a name Kotlin's default imports already bind: `Any.kt`,
`Int.kt`, `List.kt`, `Map.kt`, `String.kt`, `Unit.kt` and `Enum.kt` against `kotlin.*`, plus `Class.kt` against
`java.lang.*`, which is also default-imported on the JVM. `String.kt:6-11` is the clearest witness — it declares
`data class String(… val value: String? = null)`, where the property's type resolves to the class being declared.

**Compile gate: zero diagnostics, and that is the finding.** Every one of those nineteen classes in the corpus has
the same body — a single `val value: String? = null` — which is self-consistent whichever `String` it means, so
no `test/compile/kotlin/*/v3/reserved-words.txt` mentions any **model** file other than
`ObjectWithReservedProperties.kt` — `okhttp3-clients@sb4`'s snapshot additionally carries that profile's
`Serializer.kt` pair, which is defect 26 and has nothing to do with this spec. Both the
task-8 brief and its addendum assumed this symptom was among the gate's compile breaks. It is not, and an entry
claiming a snapshot for it would be citing evidence that does not exist. The defect is real and **latent**: it needs
only a sibling model in the same package using a shadowed type generically — `val items: List<Thing>`, where the
shadowing `List` takes no type arguments — to become a compile error, and short of that it silently retypes every
`String`-typed property in the package.

Pinned by `v3/reserved-words`, identically in all ten Kotlin profiles. Cross-reference: **kept separate from defect
23** rather than folded into it, on three grounds — a different emission site (`getDeclarationTypeName`, a type-name
position, against `getClassParameter`/`getInterfaceProperty`, a property-name position), a different fix (qualify or
rename, against backtick-quote), and, decisively, a different evidential status: 130 committed diagnostics against
none. One entry covering both would have to either lend this symptom defect 23's evidence or lend defect 23 this
symptom's uncertainty. Related to the open dedup question in "Also registered, not scheduled" below only in that a
rename-based fix would need the same policy.

Not fixed here — this phase records defects rather than fixing them. A fix chooses between emitting every `kotlin.*`
reference fully qualified (`kotlin.String` rather than `String`), which is mechanical and complete, and renaming the
colliding declaration, which is a naming policy. Whichever is chosen, **verifying it needs a corpus addition first** —
a model in the same package that actually uses a shadowed type generically — because the corpus as it stands would
show no snapshot change either way.

### Defect 25 — the `_N` file-name disambiguation renames the file and never the declaration, so colliding Kotlin models redeclare each other (found by the tier-3 compile gate, not scheduled)

Two schemas whose names normalize to one Kotlin identifier target one output path. `writeGeneratedFile`
(`packages/core/src/utils/file-system.utils.ts:81`) resolves that under `existingFileBehavior: 'count'` by calling
`getCountedFilePath` (`:68`, invoked at `:92`), which inserts `_1`, `_2`, … before the extension until it finds a free
path. It operates on the path string alone; it never sees, and could not change, the identifier inside the file. That
identifier was fixed much earlier by `getDeclarationTypeName`
(`packages/kotlin/src/generators/models/model-generator.ts:657-658`) and is never revisited. The result is N
differently-named files declaring the same class in the same package — which in Kotlin is one namespace, not N.

**Compile gate:** `test/compile/kotlin/models@sb3/v3/name-collisions.txt` and its 19 siblings — `Redeclaration:`,
**90 occurrences across 20 units**, 9 per profile, from two corpus entries:

- `v3/name-collisions`, 7 per profile — `MyThing.kt`, `MyThing_1.kt` … `MyThing_4.kt`, five files each declaring
  `data class MyThing` (from `myThing`, `MyThing`, `my_thing`, `my-thing`, `my thing`), plus `Thing2.kt` and
  `Thing2_1.kt`, two declaring `data class Thing2` (from `Thing2` and `Thing_2`).
- `v3/extreme-names`, 2 per profile — `A.kt` and `A_1.kt`, both declaring `data class A`, from the case-only pair `A`
  and `a`. The brief and the corpus-expansion deviation note both name only the `MyThing` group; this second corpus
  entry hits the same defect and is easy to miss.

**Kotlin only.** TypeScript emits one module per model with a kebab-cased filename and no package-level namespace, so
`my-thing.ts` and `my-thing_1.ts` each export their own `MyThing` without conflict. There is no
`test/compile/typescript/*/v3/name-collisions.txt` at all — an absence that is informative rather than missing.

**Structurally invisible before phase 2b.** Under the previous `existingFileBehavior: 'error'`, `v3/name-collisions`,
`v3/extreme-names` and `v3/non-ascii-names` aborted on the first collision and committed nothing but a one-line
`.error.txt` — no tree, so nothing to compile. `test/output-tests/output.test.ts:22` now passes `'count'`. That switch
was an owner decision recorded in `docs/superpowers/plans/2026-07-25-corpus-expansion.md` under "Deviations taken
during execution", whose closing note predicted this outcome in as many words ("those trees do not compile — five
`data class MyThing` declarations in one Kotlin package") and left tier 3's response to whoever built it. This entry
is that response: recorded as a defect, with the specs kept in the gate rather than excluded from it.

Cross-reference: this entry records the **compile consequence** of one located mechanism. The general absence it sits
inside — "No name deduplication exists anywhere in the three packages" — stays where it is, as the unnumbered design
note at the end of "Also registered, not scheduled" below, and was deliberately **not** promoted to a numbered defect
on this evidence. The two are not the same claim: that note is about the core transform composing names that can
collide and needing a dedup *design*, with no site and no obvious right answer; this entry is about the one place in
the codebase that looks like deduplication and is not, which has a `path:line` and is fixable on its own terms.
Fixing this entry — make the counter rename the declaration too, or refuse the collision outright — does not answer
the design question, and answering the design question would make this entry unreachable rather than correct. Not
fixed here — this phase records defects rather than fixing them.

### Defect 26 — `okhttp3-clients@sb4` emits a Jackson 2 `SerializationFeature` member against Jackson 3 (found by the tier-3 compile gate, not scheduled)

The static-serializer template branches on `springBootVersion` and gets the Jackson 3 migration almost entirely right,
then splices in one member Jackson 3 removed. In
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts:158`, inside the
`springBootVersion === 4` branch:

```ts
.configure(${kt.refs.jackson.serializationFeature(springBootVersion)}.WRITE_DATES_AS_TIMESTAMPS, false)
```

`kt.refs.jackson.serializationFeature` (`packages/kotlin/src/ast/references/jackson.ts:42-45`) resolves correctly to
`tools.jackson.databind.SerializationFeature` for Spring Boot 4. `WRITE_DATES_AS_TIMESTAMPS` is a bare literal, and
Jackson 3 moved date handling off `SerializationFeature`. The sb3 branch at `:164` uses the same literal correctly
against Jackson 2.

**This is not a gate dependency gap.** Every other `tools.jackson` name in the same generated file resolves — the
`ObjectMapper`, `SerializationFeature` and `DeserializationFeature` imports, `jacksonMapperBuilder()`,
`.findAndAddModules()`, `.changeDefaultPropertyInclusion { … }`, and
`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES` on the very next line. Only the member is missing. Worth
stating, because "every unit of a profile fails" otherwise reads as a harness or image problem.

**Compile gate:** `test/compile/kotlin/okhttp3-clients@sb4/v3/simple-schemas.txt` and its 52 siblings —
`Serializer.kt:14:45 Unresolved reference 'WRITE_DATES_AS_TIMESTAMPS'.` plus the knock-on `:15:14 Unresolved reference
'configure'.` (the failed call yields an error type, so the chained call cannot resolve either). **106 occurrences
across 53 units — every unit of the profile.** **Widest defect the gate found in either language by units affected**,
at 53 against defect 27's 32; by occurrence count its 106 places it third among the Kotlin defects, behind defect 23's
130 and defect 28's 115.

Witness: `test/output/kotlin/okhttp3-clients@sb4/v3/simple-schemas/com/openapi/generated/api/client/infrastructure/Serializer.kt:14`.
Scoped to `okhttp3-clients@sb4`; `@sb3` emits the Jackson 2 API against Jackson 2 and is clean here. **This is the
class of defect that gating both Spring Boot lines exists to find** — a single-line gate would have missed it
entirely. Not fixed here — this phase records defects rather than fixing them; a fix needs Jackson 3's replacement for
the feature, a lookup this entry deliberately does not guess at.

### Defect 27 — `okhttp3-clients` delegates to `ApiClient` with an argument order that only matches `serializer: 'parameter'` (found by the tier-3 compile gate, not scheduled)

The generated `ApiClient` base has two possible parameter orders, chosen by `ctx.config.serializer` at
`okhttp3-clients-generator.ts:129-131`:

```ts
ctx.config.serializer === 'parameter'
  ? 'val baseUrl: String, val objectMapper: ObjectMapper, val client: Factory = defaultClient'
  : 'val baseUrl: String, val client: Factory = defaultClient, val objectMapper: ObjectMapper = Serializer.jacksonObjectMapper',
```

Each generated subclass computes the same flag (`serializerAsParameter`, `okhttp3-client-generator.ts:59`) and uses it
to order its *own* constructor parameters (`:69`, `:76`) — but its `super(…)` argument list is a constant:

```ts
delegateArguments: ['basePath', 'objectMapper', 'client'],   // okhttp3-client-generator.ts:85
```

which matches only the `'parameter'` shape. Under the default `serializer: 'static'`, which is what every corpus
profile uses, the base is `(baseUrl, client, objectMapper)` and the positional call hands `objectMapper` to the
`Call.Factory` slot and `client` to the `ObjectMapper` slot. Kotlin reports both, which is why the diagnostic always
arrives as a symmetric pair on one line.

**Compile gate:** `test/compile/kotlin/okhttp3-clients@sb3/v2/parameter-locations.txt` and its 31 siblings —
`ParametersApiClient.kt:23:25 Argument type mismatch: actual type is 'ObjectMapper', but 'Call.Factory' was expected.`
and `:23:39 … actual type is 'Call.Factory', but 'ObjectMapper' was expected.` **76 occurrences across 32 units**
(`@sb3` and `@sb4`, 16 units each — the 16 being the units whose spec has operations and therefore a client class; a
models-only spec emits no subclass and no diagnostic). Two occurrences per client class, so `v3/tags-and-servers`
contributes 8 rather than 2.

Witness: `test/output/kotlin/okhttp3-clients@sb3/v2/parameter-locations/com/openapi/generated/api/client/ParametersApiClient.kt:23`
against the base at `…/api/client/infrastructure/ApiClient.kt:26`. Independent of `springBootVersion` — it
reproduces identically on both lines, which is the contrast with defect 26 above. Not fixed here — this phase
records defects rather than fixing them. The fix is to derive `delegateArguments` from `serializerAsParameter` as the
list above it already is, rather than to reorder the base: the `'parameter'` path is not exercised by the corpus, so
nothing here shows it is broken, and reordering the base would be a change made blind.

### Defect 28 — `spring-reactive-web-clients` puts `awaitExchange`'s `Any` bound on the wrong Spring Boot line (found by the tier-3 compile gate, not scheduled)

Each generated `…Requests.kt` emits a `suspend fun <T> WebClient.<operation>(responseHandler: suspend (ClientResponse)
-> T): T` extension that forwards to Spring's `awaitExchange`.
`spring-reactive-web-client-generator.ts:164-166` decides whether `T` carries an `Any` bound:

```ts
// Spring 7's `WebClient.awaitExchange` is `<V : Any>`, so the `<T>` overloads need an `Any` bound to infer.
generics: [
  kt.genericParameter('T', ctx.config.springBootVersion === 4 ? { constraint: kt.refs.any() } : undefined),
],
```

The guard names the wrong version. `@sb4` gets `<T : Any>` and compiles; `@sb3` gets a bare `<T>` and fails, and its
diagnostic states the expectation directly — `'SuspendFunction1<ClientResponse, T & Any>' was expected`. It is the
Spring 6 signature on the Boot 3 line that needs the bound, and that is exactly the line the guard withholds it from.
Whether Spring 7 also needs it is **not** settled by the gate — `@sb4` emits the bound and compiles, so both readings
survive — but making the constraint unconditional is known to satisfy both lines as they stand.

**Compile gate:** `test/compile/kotlin/spring-reactive-web-clients@sb3/v3/json-input.txt` and its 15 siblings —
`Argument type mismatch: actual type is 'SuspendFunction1<ClientResponse, T (of fun <T> WebClient.<op>)>', but
'SuspendFunction1<ClientResponse, T (of fun <T> WebClient.<op>) & Any>' was expected.` **115 occurrences across 16
units, `@sb3` only**, one per generated extension function. **This is the entire explanation for that profile's
snapshot asymmetry**: `@sb3` has 20 committed snapshots against `@sb4`'s 5 for the same 53 units, and the 15 extra are
this defect and nothing else.

Compare `test/output/kotlin/spring-reactive-web-clients@sb3/v3/json-input/com/openapi/generated/api/client/Service1Requests.kt:21`
(`suspend fun <T> WebClient.listThings(…)`) with its `@sb4` sibling at the same line
(`suspend fun <T : Any> WebClient.listThings(…)`) — same generator, same spec, one token apart. Pinned by every
`spring-reactive-web-clients@sb3` unit that has operations. Like defect 26 this is visible only to a gate that
compiles both Spring Boot lines, and unlike defect 26 it is the *older* line that breaks. Not fixed here — this phase
records defects rather than fixing them.

### Defect 29 — a multipart file parameter is typed non-nullable regardless of `required`, then given a `null` default (found by the tier-3 compile gate, not scheduled)

Both multipart-capable Kotlin client generators short-circuit the file case before the nullability decision is made:

- `okhttp3-client-generator.ts:431-434` — `getParameterType` returns `kt.refs.java.file()` as soon as
  `parameter.multipart?.isFile` is true. Only the fall-through at `:436-439` passes `nullable: !parameter.required`.
- `spring-reactive-web-client-generator.ts:436-439` — identical shape, returning `ctx.refs.apiRequestFile()`, with
  `nullable: !parameter.required` again reached only by the fall-through at `:441-444`.

`getParameterDefaultValue` (`okhttp3-client-generator.ts:450`, and its reactive twin at `:447`) is *correct*: it emits
a default only when `!parameter.required`, and for a file part carrying no schema default that default is `null`. The
two halves therefore contradict each other — the type says the parameter cannot be null, the default says it is —
and the emitted signature is `fun fileAndFields(file: File = null, …)`. The reactive generator already knows the
parameter is optional where it builds the body (`spring-reactive-web-client-generator.ts:277` picks `parameterName` or
`${parameterName}?` from `p.required && !p.schema?.nullable`); only the type declaration is missing that test.

**Compile gate:** `test/compile/kotlin/okhttp3-clients@sb3/v3/multipart-bodies.txt` and 3 siblings —
`Null cannot be a value of a non-null type 'File'.` and `Null cannot be a value of a non-null type 'ApiRequestFile'.`
**36 occurrences across 4 units**, splitting **18 against `'File'`** (`okhttp3-clients@sb3` and `@sb4`, 9 each) and
**18 against `'ApiRequestFile'`** (`spring-reactive-web-clients@sb3` and `@sb4`, 9 each). Both types must be covered;
a fix aimed at `java.io.File` alone would leave half the occurrences standing.

Nine per unit is three operations × three emission sites. `v3/multipart-bodies.yml` has four operations with a file
part: `singleFile` lists `file` under `required` and correctly emits `file: File` with no default, while
`fileAndFields`, `withEncoding` and `optionalFile` do not and each emits `file: File = null` three times — from the
public function, the `…WithHttpInfo` overload and the private `…RequestConfig` helper. See
`test/output/kotlin/okhttp3-clients@sb3/v3/multipart-bodies/com/openapi/generated/api/client/MultipartApiClient.kt:49`
(correct, required) against `:188`, `:230` and `:248` (broken, optional).

Pinned by `v3/multipart-bodies`. Cross-reference: distinct from **defect 20**, the TypeScript `fetch-clients`
multipart *serialization* defect pinned by the same spec — a different language, a different generator, and a
wire-format bug rather than a signature that will not compile. Not fixed here — this phase records defects rather than
fixing them. The fix is to give the file branch the same `nullable: !parameter.required` its fall-through already has,
in both generators.

### Defect 30 — the Angular and k6 response-model barrels re-export a multi-tagged operation's response type once per tag (found by the tier-3 compile gate, not scheduled)

An operation carrying two tags is generated into one service per tag, and each service emits its own response-model
type named after the operation. The barrel then re-exports both without deduplicating:

- `packages/typescript/src/generators/services/angular-services/angular-services-generator.ts:277-282` —
  `getResponseModelsIndexFileContent` flat-maps every service's `responseModels` straight into one `ts.export(…)` per
  entry.
- `packages/typescript/src/generators/services/k6-clients/k6-clients-generator.ts:164-169` — the same, as a value
  export rather than a type export.

Nothing between the flat-map and the emit asks whether a component name has already been exported.

**Compile gate:** `test/compile/typescript/angular-services/v3/tags-and-servers.txt` and
`test/compile/typescript/k6-clients/v3/tags-and-servers.txt` — `TS2300 Duplicate identifier 'TwoTagsApiResponse'.`
**4 occurrences across 2 units**, two per barrel, because TypeScript flags both the first declaration and the second.

Pinned by `v3/tags-and-servers`, whose `twoTags` operation is tagged `[Alpha, Beta]`.
`test/output/typescript/angular-services/v3/tags-and-servers/responses.ts:1` exports `TwoTagsApiResponse` from
`alpha-responses.model` and `:2` exports it again from `beta-responses.model`. The two definitions are textually
identical — which is what makes deduplicating the barrel a safe fix, and is worth re-confirming before one is written.
`easy-network-stub` and `fetch-clients` generate no such barrel and are unaffected; the `models` profile generates no
services at all.

Cross-reference: a name collision, but not **defect 25**'s. These names are identical by construction rather than by
normalization, they collide in a barrel's export scope rather than a package's declaration scope, and the fix is local
to the two barrel builders. Not fixed here — this phase records defects rather than fixing them.

### Defect 31 — `easy-network-stub` emits `OPTIONS` and `HEAD` into a stub API whose `HttpMethod` union rejects them (found by the tier-3 compile gate, not scheduled)

`EasyNetworkStubGenerator` passes each operation's HTTP method through verbatim:
`packages/typescript/src/generators/services/easy-network-stub/easy-network-stub-generator.ts:160` emits
`ts.string(endpoint.method.toUpperCase())` as the first argument to `this.stubWrapper.stub2<…>()(…)` (`:159`). The
`easy-network-stub` package types that argument as `HttpMethod`, and in the version the gate pins
(`easy-network-stub@9.0.0`, `test/docker/node/package.json`) that union admits neither `OPTIONS` nor `HEAD`. OpenAPI
permits both.

**Compile gate:** `test/compile/typescript/easy-network-stub/v3/operation-naming.txt` —
`stubs/naming.stubs.ts:195:7 TS2345 Argument of type '"OPTIONS"' is not assignable to parameter of type 'HttpMethod'.`
and `:213:7` for `'"HEAD"'`. **2 occurrences across 1 unit** — the smallest defect the gate found, and the only one
confined to a single unit.

Pinned by `v3/operation-naming`, the only corpus spec declaring `options:` and `head:` operations. The same generated
file emits ten other method literals — `GET` ×6, `POST`, `PUT`, `DELETE`, `PATCH` — and all ten compile clean, so
the generator's method handling is right for everything the target library models. Scoped to `easy-network-stub`; the
other four TypeScript profiles hand the method to their own request builders, which do not constrain it to a union.

Not fixed here — this phase records defects rather than fixing them, and this one needs a decision before it needs a
fix: skip operations the target library cannot stub, emit them with a cast and a comment, or take the constraint
upstream. What it should not keep doing is silently generating a stub file that does not type-check. Note also that
this defect is a property of the pinned library version and could resolve with no generator change at all if
`easy-network-stub` widens the union — so a fix should pin the expectation in a test, not only in the snapshot.

### Defect 32 — `collectResponse` treats a response's entire `headers` map as one item, so no named header is ever
collected, and a header literally named `"type"` crashes it (found by the tier-1 unit tests, not scheduled)

`collectResponse` (`packages/core/src/collect/collector.ts:125-136`) calls `collect(data, responses.headers, ...)` at
line 128. `responses.headers` is a `Record<string, OpenApiHeader>`, and `collect` (`collect/helpers.ts:5-21`) treats
any non-array, non-nullish argument as **one** item, handing the whole map to the callback rather than iterating it by
key — iterating by key is what `collectRecord` (`helpers.ts:23-36`) does, and `collectResponse` never calls it. So
`isSchema`/`collectHeader` run exactly once, against the headers object itself, never against an individual named
header: a header's own schema is never reachable through `collectResponse`, for either the Swagger 2 schema shape or
the OpenAPI 3 `{schema: …}` shape.

Worse, `isSchema` (`collector.ts:121-123`) tests `obj['type'] !== undefined`. If a header happens to be named literally
`"type"`, `responses.headers['type']` is truthy, so `isSchema` misreads the *map* as a schema and calls
`collectSchema(data, header)` (the header map, not a schema) — `collectSchema` (`collector.ts:77-101`) immediately
dereferences `schema.$src.file` at line 79, and the map has no `$src`, so this throws
`TypeError: Cannot read properties of undefined (reading 'file')`.

**Tier 1:** `packages/core/src/collect/collector.test.ts`, describe block `'response header schema-or-header
discrimination'` (line 453) — `'does not collect an ordinarily-named response header at all: the headers record is
examined as a whole, not per name'` (line 462), `'does not collect an OpenAPI 3 style header schema either, for the
same reason'` (line 485), and `'crashes when a header happens to be named "type": the whole headers record is then
misread as a schema and collectSchema dereferences its missing $src'` (line 511, asserting `toThrow(TypeError)`).

Not fixed here — this phase records defects rather than fixing them. The fix is to route `responses.headers` through
`collectRecord`, the way every other named-map field in this file already does.

### Defect 33 — `x-ignore: true` on an operation is not honoured, because the per-method loop reads `pathItem[method]`
directly instead of through `collect`/`collectRecord` (found by the tier-1 unit tests, not scheduled)

`x-ignore` is checked in exactly two places in the whole codebase: `collect` and `collectRecord`
(`packages/core/src/collect/helpers.ts:14,18,33`) — confirmed by `grep -rn "x-ignore" packages/`, which matches
nothing else. `collectPathItem` (`packages/core/src/collect/collector.ts:56-75`) reads each HTTP method directly off
the path item — `const operation = pathItem[m];` at line 60 — bypassing both helpers entirely. An operation carrying
`x-ignore: true` is therefore collected and generated exactly like any other operation; nothing downstream re-checks
the flag.

**Tier 1:** `packages/core/src/collect/collector.test.ts`, describe block `'endpoint collection'` — `'does not skip an
operation carrying x-ignore: the per-method loop reads pathItem[method] directly, bypassing the
collect()/collectRecord() ignore check'` (line 371).

Not fixed here — this phase records defects rather than fixing them.

### Defect 34 — `getCustomFields` silently drops an `x-*` vendor extension inherited through `$ref`, because it
enumerates with `for...in` over a proxy whose `getOwnPropertyDescriptor` trap is missing (found by the tier-1 unit
tests, not scheduled)

`getCustomFields` (`packages/core/src/transform/helpers.ts:187-196`) collects vendor extensions with
`for (const key in schema)` (line 189). A `for...in` loop walks a proxy's `[[OwnPropertyKeys]]` (the `ownKeys` trap)
and then, per key, its `[[GetOwnProperty]]` (the `getOwnPropertyDescriptor` trap) to decide enumerability.
`createDerefProxy`'s handler (`packages/core/src/parse/deref-proxy.ts`) implements `ownKeys` (lines 59-69) — which
reports keys from both the target *and* the `$ref` target — but defines **no** `getOwnPropertyDescriptor` trap at all,
so that step falls back to querying the real, unproxied target. A key that exists only on the `$ref` target (never
overridden locally) has no descriptor there and is silently skipped, exactly like `Object.keys` on the same proxy (see
the deref-proxy test cited below).

`getCustomFields` is called on real `Deref<...>` proxies in production at `transform-schema.ts:80`
(`custom: getCustomFields(schema)`) and `transform-endpoint.ts:52` (`custom: getCustomFields(endpointInfo.operation)`).
So a vendor extension declared only on a schema's `$ref` target, with no local override, is silently absent from the
transformed model and therefore from generated output — even though the value is reachable and correct via direct
property access (`schema['x-vendor']` still returns it; only enumeration is affected).

**Tier 1:** the underlying mechanism is pinned by `packages/core/src/parse/deref-proxy.test.ts:108`, `'lists target
keys, ref keys, $ref and $src from ownKeys, but not from Object.keys'`. **No test currently calls `getCustomFields`
itself against this scenario** — Task 6's report reproduced it empirically (a throwaway script, since deleted) and
explicitly declined to add a test because `helpers.test.ts` was outside that task's file list; no later task added one
either. This is a real coverage gap on one of the least obvious, highest-impact defects on this list — flagged here
rather than silently left implicit.

Not fixed here — this phase records defects rather than fixing them.

### Defect 35 — `combineParameters` matches a path parameter against an operation parameter by `name` alone, ignoring
`target`, so a same-named query parameter displaces a path parameter (found by the tier-1 unit tests, not scheduled)

`combineParameters` (`packages/core/src/transform/transform-endpoint.ts:253-264`) finds a colliding parameter with
`result.findIndex((p) => p.name === opParam.name)` (line 256) and, on a match, **replaces** the path-level entry with
the operation-level one. OpenAPI identifies a parameter by the pair `(name, in)`, not by `name` alone, so an
operation-level query parameter named `id` on `/pets/{id}` overwrites the path-level `id` parameter instead of
coexisting with it. Every downstream consumer that filters by `target` — `packages/core/src/utils/endpoint.utils.ts:5`
(`p.target === 'query'`) and the generators' own `target === 'path'`/`'query'`/`'header'` filters, e.g.
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:481`,
`spring-controller-generator.ts:404`, `spring-reactive-web-client-generator.ts:402`, and
`packages/typescript/src/generators/services/fetch-clients/fetch-client-generator.ts:98` — never sees the lost path
parameter, so a generated client for `/pets/{id}` has no `id` path argument to substitute.

**Tier 1:** `packages/core/src/transform/transform-endpoint.test.ts`, describe block `'parameter combination'` —
`'replaces a path parameter with a same-named operation parameter in a DIFFERENT position'` (line 221).

Not fixed here — this phase records defects rather than fixing them.

### Defect 36 — the implicit (untagged) service omits `$src`, while a tag-derived service always sets it (found by the
tier-1 unit tests, not scheduled)

`transformEndpoint` (`packages/core/src/transform/transform-endpoint.ts:55-68`) creates one `ApiService` per tag an
operation carries, falling back to the empty-string tag when it carries none. The object literal for a newly-seen tag
(lines 60-66) has no `$src` field at all, unlike `transformTag` (`packages/core/src/transform/transform-document.ts:
20-30`), whose `ApiService` always sets `$src` from the tag object (lines 21-24). A consumer that reads
`service.$src.file` unconditionally crashes for the implicit, untagged service — and `services-generator.ts:61`
already carries a defensive `service.$src ? ... : 'tag:${service.name}'` ternary, which only makes sense as a
workaround for exactly this gap.

**Tier 1:** `packages/core/src/transform/transform-endpoint.test.ts`, describe block `'service attachment'` —
`'creates the implicit service without a $src, unlike a tag-derived service'` (line 101).

Not fixed here — this phase records defects rather than fixing them.

### Defect 37 — `ApiPath.path` goes stale on a `transformed.paths` cache hit reached via a different path string (found
by the tier-1 unit tests, not scheduled)

`transformApiPath` (`packages/core/src/transform/transform-endpoint.ts:78-118`) keeps two caches: `context.paths`,
keyed by the path string, and `context.transformed.paths`, keyed by the path item's own identifier (line 88). The
`path` field is set exactly once, at construction (line 101, `path: path`), from whichever path string reached the
constructor first. A second call that misses `context.paths` (a different path string) but hits
`context.transformed.paths` (the same underlying path-item object, e.g. via a `$ref`) returns the cached `ApiPath` at
line 89 without ever revisiting `path`. So the second endpoint's `pathInfo.path` reports the *first* endpoint's path
string, not its own. This is a plausible latent bug for OpenAPI 3.1's Referenced Path Item Object: a document with
`paths: { '/pets': {...}, '/pets-alias': { $ref: '#/paths/~1pets' } }` would produce an `ApiPath` for `/pets-alias`
whose `.path` field reads `/pets`.

**Tier 1:** `packages/core/src/transform/transform-endpoint.test.ts`, describe block `'path transformation'` —
`'separates the two path caches: one pathItem object reused under two different path strings'` (line 143).

Not fixed here — this phase records defects rather than fixing them.

### Defect 38 — `statusCode: Number(status) || undefined` maps the numeric string `'0'` to `undefined`, the same
bucket as `'default'` and a wildcard range (found by the tier-1 unit tests, not scheduled)

`transformResponse` (`packages/core/src/transform/transform-endpoint.ts:205`) computes
`statusCode: Number(status) || undefined`. `Number('0')` is `0`, which is falsy, so the `||` collapses a genuine (if
unusual) `'0'` status code to `undefined` — indistinguishable from `'default'` or a range code like `'2XX'`.
Cross-reference **defect 19**, the `responseCode = null` consequence in the Kotlin `spring-controllers` generator
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:211-212`), which is
downstream of the same "no status code" bucket this line produces.

**Tier 1:** `packages/core/src/transform/transform-endpoint.test.ts`, describe block `'responses'` — `'also leaves
statusCode undefined for the numeric string "0"'` (line 285).

Not fixed here — this phase records defects rather than fixing them.

### Defect 39 — `OpenApiGenerator.use()` mutates the receiver's own `_providers` array before copying it, so branching
twice off one generator leaks the second branch's providers into the first (found by the tier-1 unit tests, not
scheduled)

`use()` (`packages/core/src/codegen/generator.ts:41-48`) does `this._providers.push({ provider, config })` (line 46) —
mutating the array already stored on `this` — and only afterwards constructs the returned generator from
`[...this._providers]` (line 47). So calling `.use()` twice on the same base generator does not produce two
independent branches: the second call's push lands on the same array the first call already mutated, and the
generator returned from the *second* call inherits the *first* call's provider too. A generator meant as a shared,
reusable starting point silently accumulates every provider ever branched off it.

**Tier 1:** `packages/core/src/codegen/generator.test.ts` — `'accumulates providers on the receiver as well as the
returned generator'` (line 97).

Not fixed here — this phase records defects rather than fixing them.

### Defect 40 — `mergeDeep`'s array-concatenation branch is unreachable, so two providers contributing to the same
array-valued output key merge by index instead of concatenating (found by the tier-1 unit tests, not scheduled)

`mergeDeep` (`packages/core/src/codegen/generator.ts:134-155`) tests `value && typeof value === 'object'` (line 143)
before `Array.isArray(value)` (line 146). Every non-null array satisfies the first condition — arrays are objects —
so the concatenating branch below it can never run; an array-valued key is always routed into the object-merge
branch instead, which recurses `mergeDeep(target[key], value)` and, because array indices are just string keys,
overwrites by index. Two providers contributing `['a', 'b']` and `['c']` to the same output key merge to
`['c', 'b']`, not `['a', 'b', 'c']`.

**Tier 1:** `packages/core/src/codegen/generator.test.ts` — `'merges arrays from two providers element-wise rather
than concatenating them'` (line 108).

Not fixed here — this phase records defects rather than fixing them. Cited by the plan's Global Constraints and
Out-of-scope notes as a fix that would change generated output and therefore belong to a separate phase.

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
  task. **Left as a design note deliberately, not promoted**, now that the tier-3 gate has proved one consequence is a
  compile break: that consequence has a located mechanism and its own numbered entry, **defect 25** above, while this
  note remains the open design question the entry's fix does not settle. See defect 25's cross-reference for why the
  two are not the same claim.
- **`generator.ts`'s `if (result)` guard before `mergeDeep` is dead code, unlike defect 40 above.**
  `for (const key in x)` over `null`/`undefined` is a documented no-op — it does not throw — so calling
  `mergeDeep(input, undefined)` unconditionally is harmless: the loop does nothing and the recursive call returns
  `input` unchanged. Removing the guard changes no test's outcome. **The committed test's own explanatory comment is
  incorrect**: `packages/core/src/codegen/generator.test.ts:122-124` asserts "mergeDeep does `for (const key in
  source)`, which throws on `undefined`" — verified false by direct execution (`for (const key in undefined) {}`
  completes with no error). The test itself (`'skips merging a falsy provider result instead of passing it to
  mergeDeep'`, line 121) still passes, because a falsy result genuinely is skipped before ever reaching `mergeDeep` —
  only the comment's stated reason for needing the guard is wrong, not the assertion. Flagged here rather than
  silently left as an authoritative-sounding but incorrect explanation for the next reader.
- **`endpoints-generator.ts` and `services-generator.ts`'s memoization caches (`existingEndpointResults`,
  `existingServiceResults`) are read but never written by anything in this repo.** Both base classes only ever call
  `.get()` on the map (`endpoints-generator.ts:53`, `services-generator.ts:53`); every real subclass's
  `addEndpointResult`/`addServiceResult` writes into the output object instead (e.g.
  `okhttp3-clients-generator.ts:70-72`, `ctx.output.kotlin.clients[service.id] = result`), never into the cache. Unlike
  defect 40's `mergeDeep` branch, this is dead *in practice*, not *by construction*: nothing stops a subclass from
  populating the map directly, and a synthetic test pins that the early-return branch works correctly if it ever is
  used (`endpoints-generator.test.ts:118`, `'returns the cached result and skips generateEndpoint when
  existingEndpointResults is pre-populated'`). No generated output is affected today because nothing currently
  produces two `ApiEndpoint`/`ApiService` objects sharing an id within one provider run.
- **`deref-proxy.ts`'s `set` trap silently no-ops when `$ref` is written a non-object, non-`undefined` value.** The
  first branch of `set` (`packages/core/src/parse/deref-proxy.ts:43-46`) only recognizes
  `typeof value === 'object' || typeof value === 'undefined'`; a string falls through to the generic
  `_overwrittenValues[prop] = value` path, and the trap still returns `true` (a well-formed write, per the Proxy
  invariants). But `get` (lines 23-40) intercepts `prop === '$ref'` before ever consulting `_overwrittenValues`, so the
  write is permanently invisible — the original ref is neither replaced nor cleared. Pinned by
  `packages/core/src/parse/deref-proxy.test.ts:94`, `'silently no-ops when $ref is set to a non-object, non-undefined
  value'`. No known call site writes a non-object to `$ref` in production; recorded because the escape hatch exists
  and is easy to trip over by accident.
- **`createTypeof` is exported** from `packages/typescript/src/ast/nodes/typeof.ts:35`, and grepping for the bare
  identifier finds no importer anywhere in `packages/` or `test/` outside its own defining file. The framing that
  "every sibling node keeps its factory private" needs correcting, though: `createExport` (`ast/nodes/export.ts:46`)
  and `createMethod` (`ast/nodes/method.ts:131`) are exported the identical way, with the identical property — zero
  direct importers of the bare name, the functionality reached only through the wrapped `tsExport`/`tsMethod`/
  `tsTypeof` convenience objects (which *are* used throughout the generators). `createPropertySetter`/
  `createPropertyGetter` (`ast/nodes/property-accessor.ts:167,171`) are a different case entirely — also exported, but
  genuinely imported and used, by `ast/nodes/property.ts:10-11` and directly by `property-accessor.test.ts`. So the
  actual, verified shape of this observation is: three node files (`export.ts`, `method.ts`, `typeof.ts`) export a
  redundant raw factory alongside their public `tsXxx` wrapper, where every other sibling keeps it module-private;
  `createTypeof` is one instance of a three-way pattern, not a singleton.

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
