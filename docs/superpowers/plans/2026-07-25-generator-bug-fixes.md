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

### Defect 19 — `spring-controllers` writes `responseCode = null` for `default` and range-coded responses, uncompilable (found by phase 2b task 7, confirmed by the tier-3 compile gate, fixed by b3bba55)

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

**Fixed:** `b3bba55` adds `statusKey: string` to `ApiResponse` (`packages/core/src/transform/api-types.ts:116`) — the
spec's own response key, populated for every response by `transformResponse`
(`packages/core/src/transform/transform-endpoint.ts:205`) — and changes
`getApiInterfaceEndpointMethodAnnnotations` to render `kt.string(response.statusKey)` in place of
`kt.string(response.statusCode?.toString())` (`spring-controller-generator.ts:210-216`), so a `default` or
range-coded response now emits its own literal key instead of `null`. This also closes the entry's secondary
complaint: `statusKey` makes `default`, `2XX`, `4XX`, `5XX` and `'0'` distinguishable from each other in the emitted
annotation, where before all five collapsed to the identical `responseCode = null`. Drove `Null cannot be a value of
a non-null type 'String'` to zero: **32 occurrences across 8 units**, all fully deleted — the 4
`v3/response-variants.txt` files this entry originally predicted (28 occurrences, exactly as predicted) plus 4
`integration/kitchen-sink.txt` files the corpus grew to add afterward (4 occurrences, one per profile, from
`WidgetsApi.kt` rather than `ResponsesApi.kt`). No other defect touches either file, so none of the 8 survive.
`statusKey` is **required**, which is additive for a reader of `ApiResponse` but **breaking for any external code
constructing one directly**; `@goast/core` is at `0.5.3` with no `CHANGELOG` in this repo, so this is worth a line
in the next release's notes.

### Defect 20 — the TypeScript fetch client JSON-stringifies every request body and never sets a `content-type` header, regardless of the declared media type (found by phase 2b task 9, confirmed broader in scope by the tier-4 wire contract, not scheduled)

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

**The tier-4 wire contract (phase 5) establishes this is not scoped to `multipart/form-data`.** Grepping the whole
generated `fetch-clients` tree for a `content-type` (or `Content-Type`) header assignment turns up zero hits — no
generated method for any content type sets one, matching the code excerpt above having no branch that ever would.
Driving the generated `PetsClient`/`BlobsClient` against the reference server (`test/integration/fetch-clients/`)
confirms the wire consequence for the other media types this defect's original framing did not cover: `fetch`'s own
default `content-type` for a plain-string body is `text/plain;charset=UTF-8`, not `application/json`, so a JSON body
(`updatePet/json`, `createPet/created`) and a form body (`updatePet/form`) both arrive at the server mis-typed as
`text/plain` and are read back as an opaque JSON-stringified string rather than the parsed value the case expects —
the same failure mode as the multipart case above, minus the `Blob`-specific data loss, because there is no
`Content-Type`-driven branch anywhere to get right in the first place. The data-loss consequence itself is also wider
than multipart: `uploadBlob/ok` posts a bare `Blob` under `application/octet-stream` (no multipart envelope at all),
and `JSON.stringify` on a `Blob` still produces `"{}"`, discarding the file content exactly as it does inside a
multipart part.

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

**Tier 4:** `test/wire/fetch-clients/updatePet__json.txt`, `createPet__created.txt`, `uploadBlob__ok.txt` and
`uploadPetPhoto__ok.txt` — each a `body` deviation whose `actual` is the JSON-stringified, mis-typed request the
reference server received. `addPetNote__text.txt`'s second stanza (its `body` deviation, `actual` reading
`{"kind":"text","value":"\"plain text body\""}` — the value quoted twice) is this same mechanism; its first stanza
(`header.content-type`, `expected text/plain` / `actual text/plain;charset=UTF-8`) is **not** counted as part of this
defect, on a narrower ground than "the generator doesn't control it" — it does, by omission: had the generator set
`content-type: text/plain` from the declared media type (the fix below), `fetch` would never reach its own default
and the charset difference would not exist. The reason this stanza stays unregistered is that the *value* `fetch`
defaults to is a correct media type with an extra parameter, not a wrong one — `text/plain` is what the case expects,
`;charset=UTF-8` is additional information the case's `expectRequest` does not ask about at all, not a contradiction
of it. That is a case-table strictness question, not a generator defect. One consequence worth flagging for whoever
fixes this defect: because `addPetNote/text` conforms once the generator sets any `content-type`, fixing it deletes
`addPetNote__text.txt` **in full**, charset stanza included — so a reviewer of that future deletion should not go
looking for a second register entry the charset half never had.

`updatePet__form.txt` is **not** listed above, though this operation is the other's two-content-type sibling and
`updatePet/json` is. This defect's fix — branching the one generated `updatePet` method on `content[0].contentType`
— only ever reaches the first declared media type; `updatePet`'s second media type
(`application/x-www-form-urlencoded`) has no generated code path at all to fix, which is a distinct, unregistered-
until-now mechanism. See **defect 44**, which owns that artifact and explains why this defect's fix cannot reach it.

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

### Defect 26 — `okhttp3-clients@sb4` emits a Jackson 2 `SerializationFeature` member against Jackson 3 (found by the tier-3 compile gate, fixed by f13fe6f)

The static-serializer template branches on `springBootVersion` and gets the Jackson 3 migration almost entirely right,
then splices in one member Jackson 3 removed. In
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts:158`, inside the
`springBootVersion === 4` branch:

```ts
.configure(${kt.refs.jackson.serializationFeature(springBootVersion)}.WRITE_DATES_AS_TIMESTAMPS, false)
```

`kt.refs.jackson.serializationFeature` (`packages/kotlin/src/ast/references/jackson.ts:42-45`) resolves correctly to
`tools.jackson.databind.SerializationFeature` for Spring Boot 4. `WRITE_DATES_AS_TIMESTAMPS` is a bare literal, and
Jackson 3 moved date handling off `SerializationFeature`. The sb3 branch at
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts:166` uses the same literal
correctly against Jackson 2.

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

**Fixed:** `f13fe6f` adds a dedicated `dateTimeFeature` reference (`packages/kotlin/src/ast/references/jackson.ts:57`
— Jackson 3 only, no `springBootVersion` parameter, since Jackson 2 has nothing to switch on) and uses it in the
Spring Boot 4 static-serializer branch (`okhttp3-clients-generator.ts:160`) in place of
`serializationFeature(springBootVersion).WRITE_DATES_AS_TIMESTAMPS`; the `@sb3` branch, which already targets
Jackson 2 correctly, is untouched. Drove `Unresolved reference 'WRITE_DATES_AS_TIMESTAMPS'` and its knock-on
`Unresolved reference 'configure'` to zero across **108 occurrences across 54 units** — every unit of the profile,
which is 53 as originally counted plus the kitchen-sink unit the corpus later added (2 occurrences each, matching
the original 106 across 53 exactly). 49 of the 54 are now fully deleted. The other 5 —
`v3/extreme-names`, `v3/non-ascii-names`, `v3/name-collisions`, `v3/reserved-words` and `v3/multipart-bodies` —
each lost the same 2 lines but survive on unrelated, already-registered diagnostics: defects 21, 22, 23 and 25
(model naming and redeclaration) and defect 29 (multipart `File`/`ApiRequestFile` nullability). This is not a
partial fix; it confirms defect 23's own note that `okhttp3-clients@sb4`'s reserved-words snapshot "carries two
extra lines that belong to defect 26" — those two lines are now gone, and the snapshot's remaining content is
defect 23's alone.

### Defect 27 — `okhttp3-clients` delegates to `ApiClient` with an argument order that only matches `serializer: 'parameter'` (found by the tier-3 compile gate, fixed by 73b89a7)

The generated `ApiClient` base has two possible parameter orders, chosen by `ctx.config.serializer` at
`okhttp3-clients-generator.ts:129-131`:

```ts
ctx.config.serializer === 'parameter'
  ? 'val baseUrl: String, val objectMapper: ObjectMapper, val client: Factory = defaultClient'
  : 'val baseUrl: String, val client: Factory = defaultClient, val objectMapper: ObjectMapper = Serializer.jacksonObjectMapper',
```

Each generated subclass computes the same flag (`serializerAsParameter`, `okhttp3-client-generator.ts:71`) and uses it
to order its *own* constructor parameters (`:81-83`, `:88-92`) — but its `super(…)` argument list is a constant:

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

**Fixed:** `73b89a7` extracts the decision into `getClientDelegateArguments(serializerAsParameter: boolean):
string[]` (`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:66-68`) and calls it
for the `super(…)` argument list (`:97`), so the delegate call now derives its order from the same flag — and
therefore agrees with — the subclass's own constructor parameter order, instead of the constant
`['basePath', 'objectMapper', 'client']` that matched only `serializer: 'parameter'`. Drove the
`ObjectMapper`/`Call.Factory` argument-mismatch pair to zero across **92 occurrences across 34 units**: the 32
units originally predicted (76 occurrences) plus 2 kitchen-sink units the corpus later added, one per Spring Boot
line (16 occurrences, 8 each). At this commit `@sb3`'s 17 units reached zero of this defect's diagnostics
immediately — 16 fully deleted, `v3/multipart-bodies.txt` surviving on defect 29's unrelated lines alone —
while `@sb4`'s 17 units still carried defect 26's Jackson diagnostic and did not reach zero until `f13fe6f`
landed afterward; the final state after both fixes matches `@sb3`'s.

### Defect 28 — `spring-reactive-web-clients` puts `awaitExchange`'s `Any` bound on the wrong Spring Boot line (found by the tier-3 compile gate, fixed by 01493d4)

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

**Fixed:** `01493d4` drops the `ctx.config.springBootVersion === 4` guard and makes the `Any` bound on `<T>`
unconditional — `generics: [kt.genericParameter('T', { constraint: kt.refs.any() })]`
(`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:166`)
— so `@sb3` now emits `<T : Any>` too, matching `@sb4`. Whether Spring 7 also needs the bound independently of this
change remains unsettled; making it unconditional is known to satisfy both lines as they stand. Drove the
`SuspendFunction1<…, T>` / `SuspendFunction1<…, T & Any>` argument-mismatch pair to zero across **127 occurrences
across 17 units** — the 16 units originally predicted (115 occurrences) plus the kitchen-sink unit the corpus later
added (12 occurrences). 16 of the 17 are now fully deleted; `v3/multipart-bodies.txt` survives on defect 29's
unrelated `File`/`ApiRequestFile` nullability lines alone, one of which shifted six columns
(`:251:67` → `:251:73`) as the removed lines ahead of it changed the file's byte offsets — not a new occurrence.

### Defect 29 — a multipart file parameter is typed non-nullable regardless of `required`, then given a `null` default (found by the tier-3 compile gate, not scheduled)

Both multipart-capable Kotlin client generators short-circuit the file case before the nullability decision is made:

- `okhttp3-client-generator.ts:443-447` — `getParameterType` returns `kt.refs.java.file()` as soon as
  `parameter.multipart?.isFile` is true. Only the fall-through at `:448-451` passes `nullable: !parameter.required`.
- `spring-reactive-web-client-generator.ts:435-438` — identical shape, returning `ctx.refs.apiRequestFile()`, with
  `nullable: !parameter.required` again reached only by the fall-through at `:441-444`.

`getParameterDefaultValue` (`okhttp3-client-generator.ts:450`, and its reactive twin at `:447`) is *correct*: it emits
a default only when `!parameter.required`, and for a file part carrying no schema default that default is `null`. The
two halves therefore contradict each other — the type says the parameter cannot be null, the default says it is —
and the emitted signature is `fun fileAndFields(file: File = null, …)`. The reactive generator already knows the
parameter is optional where it builds the body (`spring-reactive-web-client-generator.ts:276` picks `parameterName` or
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
keys, ref keys, $ref and $src from ownKeys, but not from Object.keys'`. `getCustomFields` itself is now pinned by
`packages/core/src/transform/helpers.test.ts`, describe block `'getCustomFields'` — `'silently drops an x- extension
inherited through $ref, though direct access still returns it'` and, as its discriminating counterpart, `'does keep an
x- extension the schema owns locally, even when it also has a $ref'`. The first proves the drop; the second proves the
drop is specific to inherited keys rather than `getCustomFields` returning `{}` unconditionally.

Not fixed here — this phase records defects rather than fixing them.

### Defect 35 — `combineParameters` matches a path parameter against an operation parameter by `name` alone, ignoring
`target`, so a same-named query parameter displaces a path parameter (found by the tier-1 unit tests, not scheduled)

`combineParameters` (`packages/core/src/transform/transform-endpoint.ts:254-265`) finds a colliding parameter with
`result.findIndex((p) => p.name === opParam.name)` (line 257) and, on a match, **replaces** the path-level entry with
the operation-level one. OpenAPI identifies a parameter by the pair `(name, in)`, not by `name` alone, so an
operation-level query parameter named `id` on `/pets/{id}` overwrites the path-level `id` parameter instead of
coexisting with it. Every downstream consumer that filters by `target` — `packages/core/src/utils/endpoint.utils.ts:5`
(`p.target === 'query'`) and the generators' own `target === 'path'`/`'query'`/`'header'` filters, e.g.
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:493`,
`spring-controller-generator.ts:407`, `spring-reactive-web-client-generator.ts:401`, and
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

`transformResponse` (`packages/core/src/transform/transform-endpoint.ts:206`) computes
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

### Defect 41 — `UrlBuilder` percent-encodes nothing, so a reserved character in a path or query value corrupts the request line (found by the tier-4 wire contract, not scheduled)

`UrlBuilder` (`packages/typescript/assets/client/fetch/fetch-client.utils.ts`, copied verbatim into every generated
TypeScript client's `utils/fetch-client.utils.ts`) never encodes a value on either side of a URL. `withPathParam`
(lines 28-31) stores `String(value)` as-is; `build()` (lines 44-51) substitutes it into the path template with a bare
string replace at line 48, with no `encodeURIComponent` anywhere in the chain. `withQueryParam` (lines 33-42) is the
same for the query side: `this.queryParams[name] = String(value)` at line 39, then `build()` joins pairs as
`` `${key}=${this.queryParams[key]}` `` at line 46, again with no encoding.

A path value containing `/` therefore splits into an extra path segment instead of staying inside the one segment its
`{param}` template placeholder occupies, and a query value containing `&` or `=` corrupts the query string's own
key/value structure. Both are exactly the characters OpenAPI's `getEncoded` kitchen-sink case exists to exercise.

**Tier 4:** `test/wire/fetch-clients/getEncoded__ok.txt` — `getEncoded`'s path value `abc def/x` needed percent-encoding
to survive as the single path segment `/encoded/{value}` expects; instead the literal `/` splits the URL into an
extra segment, so the request matches no route at all and lands in the reference server's surplus bucket (answered
418). Recorded as `getEncoded/ok`'s first deviation: `request` `expected one request matching this case's route` /
`actual get /encoded/abc%20def/x matched no route (server answered 418)`.

**Both halves of this defect are now measured, not inferred.** The same artifact carries the query half as well:

```
query.b
  expected undefined
  actual   ["c"]
query.raw
  expected ["a&b=c"]
  actual   ["a"]
```

`withQueryParam` stores the value unencoded and `build()` joins it in as literal text, so the wire carries
`raw=a&b=c` — a bare `&` and `=` inside what is meant to be one value — and the reference server parses that as *two*
parameters, `raw=a` and `b=c`, where a correct client (`URLSearchParams`, which is what the reference client in
`test/harness/ref-client.ts` uses) sends the percent-encoded `raw=a%26b%3Dc`. An earlier revision of this entry stated
this half was "inferred from the source, not from a second committed artifact", which was true of the harness at the
time and no longer is: the surplus-attribution branch of both integration tests reported only the offending request's
method and path and discarded its query, headers and body, so a request that deviated in several ways at once recorded
only one of them. That branch now runs the full `diffRequest` over the attributed request, which is what turned this
paragraph from a reading of the generator into a quotation from the artifact.

**Tier 4, confirmed on a second generator, with the opposite outcome on its sibling — `spring-reactive-web-clients`
only, not `okhttp3-clients`.** The two Kotlin client generators build a path substitution through entirely different
library calls, and only one of them closes this gap. `okhttp3-clients` generates its own `encodeURIComponent` helper
per client (`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:432-438`), built as
`HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]` —
`addPathSegment` treats its whole argument as one opaque segment and percent-encodes any `/` inside it, so
`okhttp3-clients`' `getEncoded/ok` case produces no artifact in either `@sb3` or `@sb4`: this generator gets it right.
`spring-reactive-web-clients` has no equivalent helper; its path substitution instead calls
`UriComponentsBuilder.buildAndExpand(...)` then `.toUriString()`
(`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:402,416`),
and Spring's own URI-template expansion does not percent-encode a `/` embedded inside a single path-variable value —
the identical wire consequence this entry already records for `fetch-clients`, reached through a completely
unrelated code path in a generator the original entry never covered.

**Tier 4:** `test/wire/spring-reactive-web-clients@sb3/getEncoded__ok.txt` (byte-identical in `@sb4`) — `getEncoded`'s
path value `abc def/x` splits into an extra path segment the reference server's route pattern cannot match: `request`
`expected one request matching this case's route` / `actual get /encoded/abc%20def/x matched no route (server
answered 418)`, the identical shape and cause `fetch-clients`' own `getEncoded__ok.txt` records. No artifact exists
for `okhttp3-clients@sb3`/`@sb4`'s `getEncoded/ok` case at all — that absence is the positive evidence that
`addPathSegment` (above) closes this gap for that generator alone.

This artifact carries the same `query.raw`/`query.b` split quoted above, and is now **byte-identical** to
`fetch-clients`' — which is a stronger result than either family's artifact alone. Two generators reaching this wire
through completely unrelated library calls (`UrlBuilder`'s bare string replace and `String` concatenation on one side,
`UriComponentsBuilder.buildAndExpand(...).toUriString()` on the other) produce the same corrupted query, because the
shared root cause is the same in both: a value is stringified into a URL without ever being percent-encoded. For the
reactive family the specific mechanism is that `toUriString()` on a `UriComponents` that was never `encode()`d emits
the raw string, which `WebClient.uri(String)` then re-parses as a URI template — so the `&` inside `a&b=c` becomes a
parameter separator on re-parse.

Not fixed here — this phase records defects rather than fixing them. A fix needs `encodeURIComponent` on both the
substituted path-parameter value in `build()`'s path replace and each query key/value pair, applied once each value
is stringified rather than left to the caller. For `spring-reactive-web-clients`, the fix needs the path-variable map
passed to `buildAndExpand` to have each value pre-encoded (or the builder configured to encode template values,
rather than only the literal template), since `UriComponentsBuilder` does not do this on its own for a value
containing a reserved character.

### Defect 42 — no `style`/`explode` support: every query or path array is comma-joined via `String(value)` regardless of the parameter's declared style (found by the tier-4 wire contract, not scheduled)

`UrlBuilder.withQueryParam` (`packages/typescript/assets/client/fetch/fetch-client.utils.ts:33-42`) and
`withPathParam` (`:28-31`) both coerce whatever value they are given — including an array — through `String(value)`.
`Array.prototype.toString` comma-joins with no brackets and no repetition, which is OpenAPI's `style: form, explode:
false` (or `style: simple, explode: false` for a path array). It is never what OpenAPI's own *default* asks for:
`style: form, explode: true` for a query array means repeated keys (`?formExploded=a&formExploded=b`), and
`style: spaceDelimited` means a single space-joined value — neither of which `UrlBuilder` can produce, because it has
no parameter carrying `style` or `explode` at all;
`test/output/typescript/fetch-clients/integration/kitchen-sink/clients/params-client.ts:52-54` passes each array
straight to `withQueryParam` with no style-specific branch in sight.

Two of the four cases in the kitchen-sink's style matrix — the three `styleMatrix` cases plus `pathStyleSimple` —
happen to match by construction rather than by the generator doing anything right: `formUnexploded` (`style: form,
explode: false`) is comma-joined by definition, and `pathStyleSimple` (`style: simple`, also comma-joined)
coincidentally lands on the same serialization `String(value)` produces — both correctly produce **no** artifact,
which is coverage working as intended, not a gap.

**Tier 4:** `test/wire/fetch-clients/styleMatrix__formExploded.txt` — `query.formExploded` expected `["a","b"]`
(repeated keys), actual `["a,b"]` (comma-joined). `test/wire/fetch-clients/styleMatrix__spaceDelimited.txt` —
`query.spaceDelimited` expected `["a b"]` (space-joined), actual `["a,b"]` (comma-joined, the same wrong join in both
cases since `UrlBuilder` has exactly one join strategy).

**Tier 4, confirmed on two more generators — `okhttp3-clients` and `spring-reactive-web-clients`, both Spring Boot
lines.** Both Kotlin client generators share the identical gap through an identically-named, identically-bodied
method: `getParameterToString` returns the literal `.joinToString()` for any array-typed parameter, with no
inspection of `parameter.style`/`parameter.explode` anywhere in the function —
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:413-416` and
`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:421-424`,
the same three-branch `if`/`else if`/`else` in both files. Kotlin's default `joinToString()` separator is `", "`
(comma-space), one character wider than `fetch-clients`' bare `Array.prototype.toString` comma join — wide enough
that, unlike `fetch-clients`, none of the three `styleMatrix` styles nor `pathStyleSimple` happens to match by
coincidence; all four deviate for every Kotlin unit, where `fetch-clients` only deviates on two of the four.

**Tier 4:** `test/wire/okhttp3-clients@sb3/pathStyleSimple__ok.txt` (byte-identical in `@sb4` and in both
`spring-reactive-web-clients` units) — `path` expected `/styles/a,b`, actual `/styles/a,%20b` (the comma-space
separator, percent-encoded once it lands in the path). `styleMatrix__formExploded.txt`, `styleMatrix__formUnexploded.txt`
and `styleMatrix__spaceDelimited.txt` in all four Kotlin units — `query.formExploded` expected `["a","b"]` (repeated
keys) actual `["a, b"]`; `query.formUnexploded` expected `["a,b"]` actual `["a, b"]`; `query.spaceDelimited` expected
`["a b"]` actual `["a, b"]` — the identical wrong join for all three declared styles, since `getParameterToString` has
exactly one join strategy regardless of style. `formUnexploded` conforms for `fetch-clients` today by the same
by-construction coincidence this entry's opening paragraph describes; Kotlin's wider default separator removes that
coincidence, which is why this generator has no by-construction conformer at all among the four cases this spec
exercises.

**Tier 4 (server), confirmed on a third family — `spring-controllers`, both Spring Boot lines and both strictness
flavours.** The server direction reaches the same missing capability from the other side: instead of building a query
string the generated code has to *bind* one, and it emits nothing that could express a declared style there either.
The query arm of `getApiInterfaceEndpointMethodParameter`
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:391-405`) emits
`@RequestParam` with exactly three possible arguments — `value`, `required`, and `defaultValue` when the schema has a
default — and reads `parameter.style`/`parameter.explode` nowhere. Grepping the whole `spring-controllers` generator
directory for `style` or `explode` returns only `spring-controller-generator.ts:1101-1102`, where both are *written*
as `undefined` while synthesizing a parameter for the request body — never a read. The generated declarations for the
style matrix's parameters are therefore identical apart from the name:
`test/output/kotlin/spring-controllers@sb3/integration/kitchen-sink/com/openapi/generated/api/ParamsApi.kt:58-59`
(`@RequestParam(value = "formExploded", required = false)` / `formExploded: List<String>?`) and `:66-67` (the same two
lines for `spaceDelimited`), although the spec declares `style: form, explode: true` for the first and
`style: spaceDelimited, explode: false` for the third (`test/specs/integration/kitchen-sink.yml:235-238` and
`:251-254` respectively).

**This is a generator defect and not a Spring default, and the distinction is worth stating precisely because the
proximate cause is a Spring default.** Spring's default `List<String>` query binding splits a single query value on
commas and on nothing else. That behaviour is documented, correct on its own terms, and not a bug. But Spring was
never told the parameter's style: the generator had it in the parameter object, emitted nothing carrying it, and
Spring's comma-only default is filling a vacuum the generator created. The generator had expressible options and took
none of them. The simplest needs no framework extension at all: bind the raw `String` and generate the split, since the
generator controls the parameter's Kotlin type and the delegate signature alike. If a framework hook were wanted
instead, the one that fits is `@InitBinder` with `registerCustomEditor(Class, field, editor)`, which is keyed by
*parameter name* — a `Converter`/`Formatter` is the wrong tool here, because Spring's `ConversionService` is keyed by
type, so registering one for `List<String>` would also change how this operation's comma-styled siblings
(`formExploded`, `formUnexploded`) bind, breaking the two cases that currently conform. Where the client half of this entry mis-*serializes* a declared style, the server half silently
*discards* it; in both halves the generator's own code is style-blind at the one site that would need to care.

**Tier 4:** `test/wire/spring-controllers@sb3/styleMatrix__spaceDelimited.txt` (byte-identical in `@sb4`,
`@sb3-strict` and `@sb4-strict`) — `status` expected `200`, actual `599`; `body` expected `{"kind":"none"}`, actual
`{"kind":"text","value":"MISMATCH styleMatrix.spaceDelimited expected <[a, b]> but was <[a b]>"}`. The `599` is the
handwritten delegate's own assertion reaching the wire (see `test/README.md`'s server-direction section), so the
request *did* reach the delegate and it is the bound value that is wrong: one element `"a b"` where the declared style
calls for two, `"a"` and `"b"`. The two `form`-styled siblings in the same operation conform and write no artifact,
which scopes the fault to the space-delimited style rather than to query binding generally. **On the wire the value is
`spaceDelimited=a+b`, not `a%20b`:** `issueCase` builds the query with `URLSearchParams.toString()`, which renders a
space as `+`, and says so in its own comment (`test/harness/ref-client.ts:42-48`). Spring decodes `+` back to a space,
so the bound single element is `"a b"` either way and the conclusion is unaffected — but the raw bytes are `+`.

Not fixed here — this phase records defects rather than fixing them. A fix needs `withQueryParam`/`withPathParam` to
receive the parameter's `style`/`explode` and branch: repeated `append` calls for `explode: true`, a space or pipe
join for `spaceDelimited`/`pipeDelimited`, and the current comma join kept only for the styles that actually call for
it. For Kotlin, `getParameterToString` needs the equivalent branch in both generators, since they share the identical
gap at an identically-named site. For `spring-controllers` the fix is on the binding side rather than the building
side: no `@RequestParam` argument can express `spaceDelimited` on its own, so the query arm at
`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:391-405` has to emit
something that carries the style — the plainest being a `String` parameter plus a generated split for the non-comma
styles.

### Defect 43 — cookie parameters are not implemented: a generated method takes no argument for a `cookie`-location parameter and never sets a `Cookie` header (found by the tier-4 wire contract, not scheduled)

`ParamsClient.allLocations` (`test/output/typescript/fetch-clients/integration/kitchen-sink/clients/params-client.ts:20-24`)
is generated from an operation whose spec declares four parameters — path, query, header, and a `session` cookie
parameter — and its signature is `{ pathParam: string; queryParam?: string; xHeaderParam?: string }`: three fields,
not four. Nothing in the method body (lines 25-39) references `session` or constructs a `Cookie` header from
anything. The cookie parameter is not merely unencoded or mis-styled the way defects 41 and 42 leave their targets —
there is no code path capable of sending it at all, and no caller of this method can satisfy that parameter through
any argument the generated type accepts.

**Tier 4:** `test/wire/fetch-clients/allLocations__ok.txt` — `header.cookie` expected `session=abc123`, actual
`<absent>`.

**Tier 4, confirmed on two more generators — `okhttp3-clients` and `spring-reactive-web-clients`, both Spring Boot
lines.** Both Kotlin client generators collect an operation's parameters through an identically-bodied
`getAllParameters`, filtering to `parameter.target === 'query' || parameter.target === 'path' || parameter.target
=== 'header'` with no `'cookie'` arm at all —
`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:518-520` and
`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:487-489`
— the same three-target filter, and the same omission, this entry already records for `fetch-clients`'s own
parameter-collection pass.

**Tier 4:** `test/wire/okhttp3-clients@sb3/allLocations__ok.txt` (byte-identical in `@sb4` and in both
`spring-reactive-web-clients` units) — `header.cookie` expected `session=abc123`, actual `<absent>`, the identical
deviation recorded above for `fetch-clients`.

**Tier 4 (server), confirmed on a third family by source inspection — `spring-controllers`, all four units — but
structurally unobservable on the wire in that direction.** `spring-controllers` has its own `getAllParameters`
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:1026`) whose filter is the
identical three-target one this entry already records for the two client families:
`parameter.target === 'query' || parameter.target === 'path' || parameter.target === 'header'` (`:1031-1035`), with no
`'cookie'` arm. The per-parameter annotation pass matches — it has arms for `body` (`:387-389`), `query` (`:391-405`),
`path` (`:407-413`), `header` (`:415-421`) and multipart (`:423-430`), and none for a cookie — and grepping the whole
`spring-controllers` generator directory for `cookie` returns nothing at all. The generated signature is therefore
`allLocations(pathParam, queryParam, xHeaderParam)`: three parameters for the four locations the spec declares, the
missing one being `name: session, in: cookie` (`test/specs/integration/kitchen-sink.yml:222-223`).

**No artifact records this, and that absence is a property of the direction rather than evidence of conformance.** A
dropped cookie parameter on a *server* changes no response: the reference client does send `Cookie: session=abc123`,
the generated controller has no parameter to bind it to, so the delegate has nothing to assert and the operation
answers its declared `200` regardless. `test/wire/spring-controllers@*/allLocations__ok.txt` consequently does not
exist in any of the four units, and reading that clean result as proof that the cookie location works would be reading
the tier's blind spot as a finding. The client direction is where this defect is observable, because there the
generated code has to *emit* the cookie and demonstrably does not — the `fetch-clients` and Kotlin-client artifacts
above. Both `test/README.md`'s server-direction section and
`test/integration/spring-controllers/delegates/lenient/ParamsDelegate.kt`'s doc comment say so at the point of use.

Not fixed here — this phase records defects rather than fixing them. A fix needs the fetch-client generator's
parameter-collection pass (whichever function currently filters to `target === 'path' | 'query' | 'header'` — see
defect 35's list of that filter's other call sites) to also collect `target === 'cookie'` parameters into the method
signature, and the request-building code to join them into one `Cookie` header value. For Kotlin, both
`getAllParameters` sites need the equivalent addition, since they share the identical filter at an identically-named
site. `spring-controllers` needs the same addition at its own `getAllParameters`
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:1031-1035`) plus a
`@CookieValue` arm in the annotation pass — the server side of this defect needs a fix even though this tier cannot
fail on it.

### Defect 44 — a multi-media-type `requestBody` collapses to its first declared content entry, with no way for a caller to select another (found by the tier-4 wire contract, not scheduled)

`getInterfaceEndpointMethod` (`packages/typescript/src/generators/services/fetch-clients/fetch-client-generator.ts:100`)
computes the body parameter's type from `endpoint.requestBody?.content[0]?.schema` alone, and the serialization branch
defect 20 describes (`:226`) reads the identical `content[0]`. Neither ever looks at `content[1]` or beyond. For an
operation whose `requestBody.content` declares more than one media type, the generated client has exactly one method,
one body parameter type, and one body-building path — all built from the first declared entry. A second content entry
is not merely mis-serialized (defect 20's claim about the entry that *is* reached): it is unreachable. No overload
exists, no parameter accepts it, and no caller of the generated client has any way to ask for it.

`updatePet` (`test/specs/integration/kitchen-sink.yml:33-41`) declares two media types on one `requestBody`:
`application/json` at line 36, `application/x-www-form-urlencoded` at line 39, both against `PetUpdate`. The generated
`PetsClient.updatePet` (`test/output/typescript/fetch-clients/integration/kitchen-sink/clients/pets-client.ts:42-57`)
is a single method, `updatePet(params, body: PetUpdate)`, that always `JSON.stringify`s `body` (line 53) — there is no
second signature, and no way through this client to send the operation's `application/x-www-form-urlencoded`
alternative at all.

This is why defect 20's fix cannot make every artifact in its own scope disappear. Defect 20's fix branches the
*existing single* method's serialization on `content[0].contentType` — for `updatePet` that is `application/json`, so
the fix corrects `updatePet/json` but leaves `updatePet/form` deviating forever, because there is no second signature
for a `content[0]`-keyed branch to route into. The two defects are distinct mechanisms that happen to produce
identical-looking artifact text today: defect 20 is the wrong serialization for the media type the generated code
*does* reach; this entry is the absence of any code path to the media type it doesn't.

**Tier 4:** `test/wire/fetch-clients/updatePet__form.txt` — `body` deviation, `actual` reading
`{"kind":"text","value":"{\"name\":\"Rex\",\"age\":4}"}`, the same JSON-stringify-with-no-content-type shape defect 20
produces for its own artifacts. Cross-reference: this artifact was previously listed under defect 20's **Tier 4**
element alongside `updatePet__json.txt`; it has moved here because defect 20's registered fix (branch the one method
on `content[0].contentType`) provably cannot delete it — see the reasoning above — while `updatePet__json.txt` stays
with defect 20 because that same fix does resolve it. Read the two entries together, not as duplicates: a future
reviewer who sees defect 20's fix land and delete `updatePet__json.txt` while `updatePet__form.txt` survives should
land here, not conclude the fix was incomplete on its own terms.

**Tier 4, confirmed on two more generators — `okhttp3-clients` and `spring-reactive-web-clients`, both Spring Boot
lines.** Both Kotlin client generators build `updatePet`'s single method from `endpoint.requestBody?.content[0]`
alone, the identical collapse-to-first-entry this entry describes, at a different site in each generator.
`okhttp3-clients` hardcodes the request's `Content-Type` header directly from `content[0].type`:
`localVariableHeaders["Content-Type"] = "${endpoint.requestBody?.content[0].type}"`
(`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:381-382`), so
`updatePetRequestConfig` always sends `Content-Type: application/json` — `content[0]` for this operation — regardless
of which of the two declared media types a caller means to send. `spring-reactive-web-clients` reads the same
`content[0]` for both its `.contentType(...)` call and the schema it hands to `bodyValue(...)`
(`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:253-256,304`).
Neither generator emits a second method, parameter, or branch for `updatePet`'s second declared media type
(`application/x-www-form-urlencoded`), so — exactly as for `fetch-clients` — no caller of either generated client can
send that alternative through any argument the generated signature accepts.

**Tier 4:** `test/wire/okhttp3-clients@sb3/updatePet__form.txt` (byte-identical in `@sb4` and in both
`spring-reactive-web-clients` units) — `body` expected `{"fields":{"age":["4"],"name":["Rex"]},"kind":"form"}`,
actual `{"kind":"json","value":{"age":4,"name":"Rex"}}`: both Kotlin families serialize the table's form-shaped body
as JSON, the same wrong-shape-and-label consequence `fetch-clients`' own `updatePet__form.txt` records for the
distinct-but-related reason discussed above.

Not fixed here — this phase records defects rather than fixing them. A fix needs the fetch-client generator to emit
one overload (or a discriminated body parameter) per declared media type in `requestBody.content`, rather than
building a single method's parameter type and serialization from `content[0]` alone. For Kotlin, both generators need
the equivalent second signature (or discriminated body parameter) for `updatePet`'s second media type, since both
currently read `content[0]` exclusively at the sites cited above.

### Defect 45 — the Kotlin client success-response predicate is order-dependent, so an error schema can win as the success return type (found by the final whole-branch review of the tier-4 unblock plan, not scheduled)

Both Kotlin client generators pick each endpoint's success response the same way:

- `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:507`
- `packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:476`

```ts
endpoint.responses.find((x) => !x.statusCode || (x.statusCode >= 200 && x.statusCode < 300))
```

`!x.statusCode` is the predicate's first disjunct and is true for `default`, every range code (`2XX`/`4XX`/`5XX`) and
the literal `'0'` — `statusCode` is `undefined` in all four cases, by construction (defect 38). So `find` returns
whichever response satisfies the predicate first **in spec declaration order**, not whichever is actually the success
response. A response meant to describe an error can therefore become the client's declared success return type.

**Live witness, already in the committed tree:** `test/specs/v3/response-variants.yml`'s `onlyDefault` operation
(`default` alone, no exact code) generates `fun onlyDefault(): Error` at
`test/output/kotlin/okhttp3-clients@sb3/v3/response-variants/com/openapi/generated/api/client/ResponsesApiClient.kt:180`
— the operation's error schema, declared as the success return type. The sibling `successAndDefault` operation
returns `Thing` correctly, but only because `'200'` (line 29) is declared before `default` (line 35) in the YAML;
swapping those two keys would make `successAndDefault` return `Error` too, on both affected Kotlin client targets.

This compiles clean, so **tiers 1-3 cannot see it** — the emitted Kotlin is syntactically and type-correct regardless
of which response `find` picks; it is wrong only at runtime, against whichever response the server actually sends.
That is why it matters now: `okhttp3-clients` and `spring-reactive-web-clients` are both tier-4 targets in the next
phase, where a wrong deserialization target surfaces as an opaque Jackson failure rather than as "the generator
picked the wrong response".

`integration/kitchen-sink.yml`'s `getWidget` operation is **safe today** — it declares `'200'` (line 149) before
`default` (line 178), so `find` reaches the exact code first, and the next phase will not hit this defect through
that operation. This safety is incidental, resting entirely on declaration order, not on any check the generator
performs.

**Cross-reference defect 19.** Its fix added `statusKey` (`packages/core/src/transform/api-types.ts:116`), the field
that makes the correct predicate expressible at all: prefer an exact 2xx status, then a `2XX` range, then `default`.
Before `statusKey` existed, `getResponseSchema` had no way to distinguish those three cases from one another —
`statusCode` collapses all of them to `undefined` alike. `statusKey` is the enabler for a fix, not a fix itself; this
entry does not attempt one, since correcting the predicate would change generated output, which this phase's scope
excludes.

**Compile gate:** records nothing for this defect, and that absence is the point. A `find` that resolves to the wrong
branch of a well-typed union still produces well-typed, compilable Kotlin — nothing in tiers 1-3 evaluates which
response was semantically the right one to return, only whether the emitted code parses and type-checks. Only a live
wire exchange (tier 4) can tell the two apart, which is exactly the phase this defect is being registered ahead of.

Pinned by `v3/response-variants` — `onlyDefault` (the wrong-type case) and `successAndDefault` (the safe-by-
declaration-order case). Not fixed here — this phase records defects rather than fixing them.

### Defect 46 — `okhttp3-clients`' request-body encoder throws for any media type it doesn't special-case, so a plain-text or octet-stream body never reaches the network (found by the tier-4 wire contract, not scheduled)

`ApiClient.requestBody()` (`packages/kotlin/assets/client/okhttp3/ApiClient.kt:63-117`, copied verbatim into every
generated `okhttp3-clients` client's `infrastructure/ApiClient.kt`) branches on the request's media type: a `File`
body, `multipart/form-data`, `application/x-www-form-urlencoded`, and anything ending in `json` (or a `null` media
type) each get a handled branch. Every other media type falls to the final `else` at line 116:

```kotlin
else -> throw UnsupportedOperationException("requestBody currently only supports JSON body and File body.")
```

This is reached for `text/plain` and `application/octet-stream` alike — the two media types the kitchen-sink case
table exercises that are neither JSON nor a file. The call throws while building the request body, before OkHttp
opens a connection, so the operation never reaches the reference server at all: not merely mis-serialized,
unreachable.

**Tier 4:** `test/wire/okhttp3-clients@sb3/addPetNote__text.txt` and `uploadBlob__ok.txt` (byte-identical in `@sb4`)
— both record `request` / `expected one request matching this case's route` / `actual no request received at all
(driver reported {"error":"java.lang.UnsupportedOperationException","message":"requestBody currently only supports
JSON body and File body."})`. `spring-reactive-web-clients` has no equivalent artifact for `uploadBlob/ok` — that
family always calls `bodyValue(...)` and lets WebFlux's own codec negotiation decide, with no comparable
content-type dispatch to fall through (see defect 48 below for that family's own, different multipart-only gap).

Not fixed here — this phase records defects rather than fixing them. A fix needs `requestBody()` to grow branches for
the media types a generated client's own operations can declare — at minimum a plain-text and a raw-bytes
`RequestBody`, mirroring the `File` branch's `.toMediaTypeOrNull()`/`.asRequestBody()` shape.

### Defect 47 — `okhttp3-clients` JSON-quotes a non-file multipart part's value, corrupting a plain-string part's wire value (found by the tier-4 wire contract, not scheduled)

The same `requestBody()` copied into every `okhttp3-clients` unit
(`packages/kotlin/assets/client/okhttp3/ApiClient.kt:76-93`) builds each multipart part by checking whether
`part.body is File`; the `else` branch, for every non-`File` part, calls `objectMapper.writeValueAsString(part.body)`
(line 89) and sends the result as the part's body. For a part whose declared value is already a plain Kotlin
`String` — `caption` in the kitchen-sink `uploadPetPhoto` operation — Jackson serializes a bare string by wrapping it
in quotes, so the wire value becomes `"A good boy"` rather than the unquoted text `A good boy` a multipart form field
is supposed to carry.

**Tier 4:** `test/wire/okhttp3-clients@sb3/uploadPetPhoto__ok.txt` (byte-identical in `@sb4`) — `body` deviation:
`expected` includes `{"name":"caption","value":"A good boy"}` inside the multipart `parts` array, `actual` reads
`{"name":"caption","value":"\"A good boy\""}` — the file part in the same artifact matches exactly (name, filename,
content type and bytes all agree), isolating the deviation to the non-file part's JSON-quoting alone.
`spring-reactive-web-clients` has no equivalent artifact for this operation: its multipart call never reaches the
network at all (defect 48 below), so this family's own non-file-part handling is never exercised by the corpus.

Not fixed here — this phase records defects rather than fixing them. A fix needs the non-`File` branch to write a
part's value as its own string content when the declared value is already a string, falling back to JSON
serialization only for a part whose declared type is not a string.

### Defect 48 — `spring-reactive-web-clients`' file-part wrapper hands WebFlux a raw `java.io.File`, which no default codec can write (found by the tier-4 wire contract, not scheduled)

`ApiRequestFile.from(file: File)` (`packages/kotlin/assets/client/spring-reactive-web-clients/ApiRequestFile.kt:11-18`,
copied verbatim into every generated `spring-reactive-web-clients` client) builds a multipart file part with
`builder.part("file", file)` (line 15), passing the raw `java.io.File` object as the part's body.
`MultipartBodyBuilder.part` accepts any `Object` and defers to whatever `HttpMessageWriter` WebFlux's codec
configuration can find for it at request-encode time; the default (non-Boot-autoconfigured) codec set this repo's
harness builds its `WebClient` from has no writer registered for a bare `java.io.File`, so the encoder throws
`CodecException: No suitable writer found for part: file` before the request is ever sent. The sibling
`from(filePart: FilePart)` overload two lines below (`:21-29`) does not have this problem — `FilePart` is a
WebFlux-native multipart type its own codec stack already knows how to write — but nothing in the generated client
ever constructs a `FilePart` from a caller-supplied `java.io.File`, so that overload is unreachable from the
generated `uploadPetPhoto` signature, which offers `ApiRequestFile.from(File)` as its only option for a caller
holding a plain file.

**Tier 4:** `test/wire/spring-reactive-web-clients@sb3/uploadPetPhoto__ok.txt` (byte-identical in `@sb4`) — `request`
deviation: `expected one request matching this case's route` / `actual no request received at all (driver reported
{"error":"org.springframework.core.codec.CodecException","message":"No suitable writer found for part: file"})`.
Every input to this operation hits the same throw, since it happens before any of the case's own values are
inspected. `okhttp3-clients` has no equivalent artifact for this case: its own multipart handling (defect 47 above)
at least reaches the network for the file part.

Not fixed here — this phase records defects rather than fixing them. A fix needs either a resource/byte-buffer
writer registered on the `WebClient`'s codec configuration (a caller-side fix outside the generated code's control)
or the generated client itself to wrap the file in a WebFlux-native multipart type before handing it to the builder.
This entry deliberately stops at recording the mechanism rather than guessing at unverified codec wiring.

### Defect 49 — both Kotlin client generators throw a generic exception on any non-2xx response instead of returning a decoded body, so no per-status error schema is ever reachable (found by the tier-4 wire contract, not scheduled)

Neither Kotlin client family gives an ordinary caller any way to inspect a declared error response's decoded body.
`okhttp3-clients`' per-operation plain method (e.g. `getWidget`) delegates to `<op>WithHttpInfo` and switches on
`localVarResponse.responseType`
(`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:198-227`): the `ClientError`
and `ServerError` arms (`:210-217`, `:219-226`) always throw `ClientException`/`ServerException`, constructed from
only the response's status code and an undecoded message string, with the raw `ClientError`/`ServerError` response
object attached — never running the response body through `objectMapper` against the operation's declared error
schema. `spring-reactive-web-clients`' plain call form uses `.retrieve()`
(`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:133`)
with no custom status handler, which is Spring `WebClient`'s own documented default: any 4xx/5xx response throws
`WebClientResponseException`, again carrying only the raw response text, before the operation's declared response
type is ever considered. In both families this is unconditional for every operation with a possible non-2xx
response, not a per-case bug — the kitchen-sink case table exercises it through `getWidget`'s four error cases,
which is what the four `getWidget` artifacts per unit record.

**Tier 4:** `test/wire/okhttp3-clients@sb3/getWidget__badRequest.txt`, `getWidget__notFound.txt`,
`getWidget__serverError.txt` and `getWidget__unexpectedError.txt` (byte-identical in `@sb4` and in both
`spring-reactive-web-clients` units) — each records `result` / `expected {"code":<N>,"message":"<...>"}` (the
table's declared decoded error body) / `actual {"status":<N>}` (all a driver limited to the generated signature's
thrown exception can recover). Each family's own non-throwing sibling (`<op>WithHttpInfo` for okhttp3, a
`responseHandler` overload for reactive) can read the raw response text directly, but no generated method decodes it
against the operation's declared error schema either way — the driver was run through each family's plain, throwing
call, the one an ordinary caller would reach for, which is exactly the shape this defect concerns.

Not fixed here — this phase records defects rather than fixing them. A fix needs each generator's plain call form to
decode a non-2xx response against whatever error schema the operation declares for that status (falling back to the
current throw only when none is declared) — the same shape `getWidget`'s own `expectResult` already assumes a
well-behaved client would offer.

### Defect 50 — `spring-reactive-web-clients` declares a null-inclusion config option it never wires to anything, so an unset model field is written as an explicit JSON `null` instead of being omitted (found by the tier-4 wire contract, not scheduled)

`okhttp3-clients` generates its own `Serializer.kt` per client, whose builder calls
`changeDefaultPropertyInclusion`/`setSerializationInclusion` against `ctx.config.serializerJsonInclude` (default
`'non-absent'`) to exclude absent/null values
(`packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts:154-166`).
`spring-reactive-web-clients` declares the identical config option, with the identical default, in its own
`models.ts` (`packages/kotlin/src/generators/services/spring-reactive-web-clients/models.ts:22,33`) — but grepping
the whole `spring-reactive-web-clients` generator directory for `serializerJsonInclude`, `JsonInclude`, `ObjectMapper`
or `Serializer` turns up exactly one hit, that same declaration in `models.ts`: the option is read nowhere. There is
no `Serializer.kt`-equivalent file for this family at all — `packages/kotlin/assets/client/spring-reactive-web-clients/`
holds only `ApiRequestFile.kt` — and its generated extension functions call `bodyValue(...)` directly on a
caller-supplied `WebClient`
(`packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:304-309`),
so request serialization is whatever `ObjectMapper`/`Jackson2JsonEncoder` that `WebClient`'s own codec configuration
resolves to. Under the harness's own reference `WebClient` (built with no Spring Boot autoconfiguration and no
inclusion customization), that default is Jackson's own `Include.ALWAYS`, so every unset field on a
partially-populated model is written as an explicit `null` rather than omitted — the exact opposite of what the
unused config option's own default name promises.

**Tier 4:** `test/wire/spring-reactive-web-clients@sb3/createPet__created.txt` (byte-identical in `@sb4`) — `body`
deviation: `expected {"kind":"json","value":{"id":"new1","name":"Fido"}}`, `actual`
`{"kind":"json","value":{"age":null,"birthDate":null,"createdAt":null,"friend":null,"id":"new1","name":"Fido",
"nickname":null,"owner":null,"photo":null,"status":null,"toys":null}}` — every unset `Pet` field present as an
explicit `null`. `okhttp3-clients` has no equivalent artifact for this case: its own `Serializer.kt` customization
(above) closes the gap for that family.

Not fixed here — this phase records defects rather than fixing them. The fix is a design choice as much as a code
change: either give `spring-reactive-web-clients` its own codec customization that actually reads
`serializerJsonInclude` (mirroring `okhttp3-clients`' `Serializer.kt`), or remove the unused config option and
document that this family serializes with whatever `WebClient` the caller supplies. The latter is defensible on its
own terms — this family's design is "bring your own client" rather than owning one, unlike `okhttp3-clients` — but
leaving the option declared and silently inert, as it stands today, is not.

### Defect 51 — `spring-controllers` advertises every declared request-body media type in `consumes` while binding the body with a `@RequestBody` typed from the first entry alone, so a spec-conforming form-urlencoded request is rejected with Spring's own `415` (found by the tier-4 server direction, not scheduled)

Two independent pieces of the generated `@RequestMapping` disagree about how many media types the operation can
actually accept. The `consumes` argument is built from **every** entry in the request body's content map —
`endpoint.requestBody?.content.map((x) => kt.string(x.type))`, unconditionally, whenever there is at least one
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:294-303`). The body
*parameter* is built from `endpoint.requestBody.content[0]` alone (`:1037-1039`), and the annotation it receives is
`@RequestBody` for anything that is not multipart: the only carve-out in the whole annotation pass is
`if (parameter.target === 'body' && !parameter.multipart)` (`:387-389`), with `@RequestPart` emitted for the multipart
case instead (`:423-430`). So `multipart/form-data` gets a binding strategy of its own and
`application/x-www-form-urlencoded` does not — it falls through to `@RequestBody` against the data class derived from
the *first* content entry.

For `updatePet`, whose spec declares both `application/json` and `application/x-www-form-urlencoded`, that yields
`test/output/kotlin/spring-controllers@sb3/integration/kitchen-sink/com/openapi/generated/api/PetsApi.kt:54`
(`consumes = ["application/json", "application/x-www-form-urlencoded"]`) paired with `:62-63` (`@RequestBody` /
`petUpdate: PetUpdate`). The two together are what produce the failure. `consumes` matches, so Spring routes the
request rather than rejecting it at the mapping stage; argument resolution then finds no reader, because WebFlux's
`FormHttpMessageReader` decodes `application/x-www-form-urlencoded` into a `MultiValueMap<String, String>` and never
into an arbitrary data class, and raises `UnsupportedMediaTypeStatusException`. The generated controller's own
`try { … } catch (e: Throwable) { getExceptionHandler()?.handleApiException(e) }` cannot intercept it, because argument
resolution runs *before* the method body is entered — so no handler the consumer supplies is consulted and Spring's
default error body is what reaches the client.

**This is a generator defect and not a Spring limitation.** Spring's behaviour is correct on its own terms: it was told
the endpoint consumes form-urlencoded, and it was told to bind the body as a `PetUpdate`, and those two instructions
are not jointly satisfiable by any reader that exists. Both instructions come from the generator, from two code paths
that never consult each other. This is the server-side sibling of defect 44's `content[0]` collapse and shares that
line, but the consequence is strictly worse: on the client side a caller merely *cannot select* the second media type,
whereas here the generated server publishes the second media type in its own contract — in `consumes` — and then
answers a request honouring that contract with a `415`. (`consumes` is the *only* place it appears: measured across the
`integration/kitchen-sink` tree, the string `application/x-www-form-urlencoded` occurs exactly once — in
`@RequestMapping(consumes = …)` — and the operation carries no
`io.swagger.v3.oas.annotations.parameters.RequestBody` annotation at all, the sole `mediaType` in its Swagger
annotations being on `@ApiResponses`. The wider `spring-controllers@sb3` profile directory has further hits, all in
the unrelated `v3/request-bodies` spec.)

**Tier 4 (server):** `test/wire/spring-controllers@sb3/updatePet__form.txt` (byte-identical in `@sb4`, `@sb3-strict`
and `@sb4-strict`) — `status` expected `200`, actual `415`; `body` expected
`{"kind":"json","value":{"age":4,"id":"abc","name":"Rex"}}`, actual
`{"kind":"json","value":{"error":"Unsupported Media Type","path":"/pets/abc","requestId":"<nondeterministic>","status":415,"timestamp":"<nondeterministic>"}}`
— Spring's own `DefaultErrorAttributes` shape, with only the wall-clock and per-connection values substituted by
`stabilizeFrameworkErrorBody` (`test/integration/spring-controllers/stabilize.ts`); the artifact deliberately
keeps the rest, because "the framework answered, not the delegate" is a materially different finding from "the delegate
answered wrongly". `updatePet/json` — the same operation over the same route with the other declared media type —
conforms on status and on every declared header and deviates only in its body, via defect 52 below. That is what
isolates this fault to the missing reader rather than to routing or to model binding. The artifact is identical across
the lenient and strict units, which is correct: `strictResponseEntities` changes return types only, and this failure
happens on the request side.

Not fixed here — this phase records defects rather than fixing them. A fix has to make the two sites agree, and the
shape of the fix is constrained by something worth spelling out: **one handler method cannot bind two media types into
one parameter.** The body parameter has a single Kotlin type, chosen from `content[0]`, so no additional annotation arm
on this method can help — an `@ModelAttribute` or a `MultiValueMap<String, String>` parameter would simply replace the
JSON binding rather than sit beside it, and the `content[0]` selection means such an arm would never be reached for a
multi-content operation anyway. So the two real directions are:

- **Narrow `consumes`** to the media types the generated binding can actually read. Honest, small, and a strict
  improvement over publishing a `415` — but it silently drops a declared media type from the API.
- **Emit one handler method per declared media type**, each with its own `consumes` and its own body parameter type,
  delegating to a shared delegate signature. More code, and it is the only direction that actually serves what the
  spec declares.

The second is the better contract; the first is the smaller change and would already stop the generated server from
advertising something it cannot serve.

### Defect 52 — `spring-controllers` emits no null-inclusion annotation and owns no serializer, so every unset optional field on a generated model is written as an explicit JSON `null` (found by the tier-4 server direction, not scheduled)

This is defect 50's symptom in a family that arrives at it by a different route, and the difference matters because it
changes where a fix can possibly go. `spring-reactive-web-clients` at least *declares* a `serializerJsonInclude` option
and leaves it inert. `spring-controllers` does not declare one at all: grepping its whole generator directory
(`packages/kotlin/src/generators/services/spring-controllers/`) for `serializerJsonInclude`, `JsonInclude`,
`ObjectMapper` or `Serializer` returns **no hits**. There is no serialization configuration in this generator, which is
coherent with what it generates — an API interface, a delegate interface and a controller class, never an application
and never a serializer. The runtime `ObjectMapper` belongs to whatever Spring Boot application a consumer stands up
around the generated code, and Spring Boot's autoconfigured default is Jackson's own `Include.ALWAYS`.

That leaves the models as the only place inside generated code where inclusion could be expressed, and the shared
Kotlin model generator emits `@JsonInclude` only behind a per-property vendor extension:
`getJacksonJsonIncludeAnnotation` returns an annotation exactly when
`ctx.config.addJacksonAnnotations && property.schema.custom['exclude-when-null'] === true`
(`packages/kotlin/src/generators/models/model-generator.ts:495-506`), called from both the data-class parameter path
(`:320`) and the interface property path (`:344`). `addJacksonAnnotations` defaults to `true`
(`packages/kotlin/src/generators/models/models.ts:68`), so the gate actually closed is the second one: absent an
`x-exclude-when-null: true` on the individual property there is no `@JsonInclude` emitted anywhere, at property level
or at class level, and no generator config that changes it. The generated `Pet` is the ordinary case — a `data class`
with two required properties and nine nullable ones defaulted to `null`
(`test/output/kotlin/spring-controllers@sb3/integration/kitchen-sink/com/openapi/generated/model/Pet.kt:9-66`) and no
`@JsonInclude` anywhere in the file.

**Whose defect this is, precisely.** Not the consumer's `ObjectMapper`: a `spring-controllers` consumer supplies
neither the annotation nor any reason to suspect one is missing, and telling every consumer to reconfigure Jackson
globally would change the serialization of their own hand-written types too. Not Spring Boot's default either —
`Include.ALWAYS` is Jackson's documented default and the right one for a framework that knows nothing about which
fields began life as OpenAPI optionals. The generator is the only party that knows a property came from a non-required
schema property, and it emits nothing that says so. Note that the model generator is shared across all three Kotlin
families, so the gap is common to all of them: `okhttp3-clients` hides it by owning a `Serializer.kt` that sets the
inclusion globally (defect 50's opening paragraph), `spring-reactive-web-clients` is exposed to it and has a dead
option pointed at it (defect 50), and `spring-controllers` is exposed to it with neither an option nor a serializer to
put one in.

**Tier 4 (server):** 16 of this direction's 26 artifacts are this one class — `getPet__ok.txt`, `updatePet__json.txt`,
`createPet__created.txt` and `addPetNote__text.txt`, in each of the four units, byte-identical across them.
`test/wire/spring-controllers@sb3/getPet__ok.txt` is the whole file: `body` expected
`{"kind":"json","value":{"id":"abc","name":"Rex"}}`, actual
`{"kind":"json","value":{"age":null,"birthDate":null,"createdAt":null,"friend":null,"id":"abc","name":"Rex","nickname":null,"owner":null,"photo":null,"status":null,"toys":null}}`
— nine explicit `null`s for the nine unset optionals, with status and every declared header conforming.
`updatePet__json.txt` is the same shape with eight, `age` being set there. The mechanism is "unset optional property",
not "any JSON body": the other model-bodied responses in the same units write no artifact, because their delegates
populate every declared property — `Widget(id, name, price)`, `Error(message, code)` and `BlobRef(id)` have exactly
three, two and one.

Not fixed here — this phase records defects rather than fixing them. The fix belongs in the shared Kotlin model
generator, and it is a decision before it is a change: emit `@JsonInclude(JsonInclude.Include.NON_NULL)` for any
property the schema does not require (making `x-exclude-when-null` the redundant per-property override it already reads
as), or emit it once at class level, or add a model-generator config with a sane default and actually wire it. What
must not survive is three Kotlin families in which the same generated model serializes differently depending on which
service generator happened to ship a serializer alongside it.

### Defect 53 — `strictResponseEntities` generates no factory for the spec's `default` response and makes the primary constructor `private`, so an operation declaring `default` has a response its own delegate return type forbids it from returning (found by the tier-4 server direction, not scheduled)

Under `strictResponseEntities` the generator replaces the delegate's `ResponseEntity<T>` return type with a
per-operation nested class whose only construction points are companion-object factories — one per status code in a set
built as `[...ctx.config.defaultStatusCodes, 501, ...endpoint.responses.map((x) => x.statusCode)]`, de-duplicated
through a `Set` and `.filter(notNullish)`-ed
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:520-529`), with
`defaultStatusCodes` defaulting to `[400, 401, 403, 500, 501]`
(`packages/kotlin/src/generators/services/spring-controllers/models.ts:44`). The `filter(notNullish)` is where the
spec's `default` response is lost: a `default` — and likewise a range code such as `5XX` — has no numeric
`statusCode`, `undefined` being exactly what that field holds, as this same generator's own comment records where it
has to fall back to `response.statusKey` for the Swagger annotation
(`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:212-214`). A `default`
response therefore contributes nothing to the factory set. The escape hatch is closed in the same class: the primary
constructor is emitted `private` whenever the endpoint declares any response at all
(`accessModifier: endpoint.responses.length > 0 ? 'private' : null`,
`packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:510`).

Each half is individually defensible and together they are a dead end. `getWidget` declares `200`, `400`, `404`, `500`
and a `default` (`test/specs/integration/kitchen-sink.yml:178-179`), and the generated class is
`class GetWidgetResponseEntity<T> private constructor(` with factories `badRequest`, `unauthorized`, `forbidden`,
`internalServerError`, `notImplemented`, `ok` and `notFound` — the four declared numeric codes plus the five default
ones, and nothing else
(`test/output/kotlin/spring-controllers@sb3-strict/integration/kitchen-sink/com/openapi/generated/api/WidgetsApi.kt:54-93`).
There is no factory for any status the `default` response is meant to cover, and no constructor a delegate can reach,
so an implementer who has followed the spec has no expressible way to answer — say — a `503`. The lenient flavour has
no such problem: its delegate returns a plain `ResponseEntity<Any?>` under @sb3 (`ResponseEntity<Any>` under @sb4 — the one line that differs between the two lenient trees) and can build any status. That asymmetry is what
makes this a defect of the strict flavour specifically rather than of the generator's response modelling in general.

**Tier 4 (server):** `test/wire/spring-controllers@sb3-strict/getWidget__unexpectedError.txt` (byte-identical in
`@sb4-strict`), and **no such artifact under `@sb3`/`@sb4`** — the asymmetry is itself the finding. Three fields
deviate: `status` expected `503`, actual `598`; `header.content-type` expected `application/json`, actual `text/plain`;
`body` expected `{"kind":"json","value":{"code":503,"message":"Unexpected error"}}`, actual
``{"kind":"text","value":"UNEXPRESSIBLE getWidget cannot answer 503: strictResponseEntities generates no factory for the spec's `default` response, and GetWidgetResponseEntity's constructor is private"}``.
The `598` is the strict delegate declining to fake it: it could have returned `notImplemented()` and produced a
one-field status deviation, and deliberately does not, because the honest cost of the gap is that no correct response
is constructible at all. All three deviating fields trace to that one cause.

Not fixed here — this phase records defects rather than fixing them. A fix needs the factory set to account for
responses that have no numeric `statusCode`: a `default` response wants a factory taking the status as an argument (the
natural name being the spec key itself, e.g. `default(status, body, headers)`), and a range code such as `5XX` wants
the same restricted to its range. Relaxing the `private` constructor would also unblock it, but at the cost of the
property that makes the strict flavour worth having, so the factory list is the right place. Defect 19 is the same
`default`-response blind spot in this same generator at compile level — it wrote `responseCode = null`, uncompilable,
and was fixed; this is the behavioural half of that same omission, surviving in the strict path.

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
  `input` unchanged. Removing the guard changes no test's outcome. The committed test's comment originally asserted the
  opposite — that `mergeDeep`'s `for (const key in source)` "throws on `undefined`" — which is false by direct
  execution (`for (const key in undefined) {}` completes with no error). **That comment has since been corrected**, in
  `8ade171`, along with the test's title, which had claimed an unobservable distinction ("…instead of passing it to
  `mergeDeep`") between calling `mergeDeep` with a falsy result and skipping it. The test now pins the observable
  contract instead: a falsy provider result cannot corrupt the accumulated output. See
  `packages/core/src/codegen/generator.test.ts`. The guard itself is still dead code, which is why this bullet stays.
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
- **`deref-proxy.ts`'s `get` treats an explicit `undefined` as "absent" on both sides, so writing `undefined` cannot
  shadow a `$ref` value, and a target's own real `undefined`-valued property falls through to the `$ref` anyway.**
  `get` (`packages/core/src/parse/deref-proxy.ts:23-40`) only treats `_overwrittenValues[prop]` as a shadow when
  `!== undefined` (line 30), and only treats the target's own property as present under the same `!== undefined` test
  (line 33). So `(proxy as any).description = undefined` does not clear an inherited `description` — the read still
  falls through to `$ref` — and a target constructed with an explicit `{ description: undefined }` behaves
  identically to one that never had the key at all. Pinned by `packages/core/src/parse/deref-proxy.test.ts:122`
  (`'does not let writing undefined shadow the ref value (a likely oversight, flagged for Task 12)'`) and `:131`
  (`'falls through to the ref even when the target has an explicit own undefined value (flagged for Task 12)'`). No
  production call site currently assigns `undefined` to a proxy property or constructs a target with an explicit
  `undefined` field (verified: no such shape outside test files under `transform/` or `collect/`), so this has no
  established generated-output consequence today — recorded because both tests explicitly flagged themselves for this
  task in their own descriptions.
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
- **Both file-builder constructors take a full config rather than a `Partial<…>`** —
  `packages/kotlin/src/file-builder.ts:34` (`constructor(packageName?: string, options?: KotlinGeneratorConfig)`) and
  `packages/typescript/src/file-builder.ts:40` (`constructor(filePath?: string, options?: TypeScriptGeneratorConfig)`).
  This is the root cause of a 48-fold duplication across 44 test files: pinning `newLine` requires
  `{ ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig` (or the TypeScript equivalent), and
  the cast is unavoidable because `defaultKotlinGeneratorConfig` is typed
  `DefaultGenerationProviderConfig<KotlinGeneratorConfig>` (`packages/kotlin/src/config.ts:37`), which makes every
  inherited field optional in the *type* even though the runtime object is complete — the same shape on the
  TypeScript side. Verified by direct count: 48 occurrences of `as KotlinGeneratorConfig`/`as TypeScriptGeneratorConfig`
  across 44 `*.test.ts` files. All 12 production call sites (`new KotlinFileBuilder(...)`/`new
  TypeScriptFileBuilder(...)` outside `*.test.ts` — 8 in `packages/kotlin`, 4 in `packages/typescript`) pass either
  `ctx.config` directly or a full config value forwarded unchanged from a caller; none passes a partial object. So
  changing both constructors to accept `Partial<KotlinGeneratorConfig>`/`Partial<TypeScriptGeneratorConfig>` and merge
  with defaults — the way `SourceBuilder`'s own constructor already does for `Partial<SourceBuilderOptions>` — is
  backwards-compatible and cannot alter generated output. This is the entry point for a follow-up phase: fix the two
  constructors, then collapse the 44 pins down to `{ newLine: '\n' }` with no cast.
- **`addSourceIfTest`'s `!result.__source__` guard** (`packages/core/src/codegen/internal-utils.ts:3`) gives a `$ref`
  wrapper schema the *target's* provenance rather than its own. `getSchemaResult`
  (`packages/core/src/codegen/schemas-generator.ts:53-68`) resolves a pure-`$ref` schema to its target via
  `getSchemaReference`, recurses to get (or generate) the target's result, and only then calls `addSourceIfTest` with
  the *wrapper* schema's own `$src`. Because the recursive call already stamped `__source__` from the target's own
  `$src`, the guard's refusal to overwrite an existing value means the wrapper's `__source__` — populated only when
  `ctx.config.__test__` is set, which the tier-2 harness does (`test/output-tests/profiles.ts:30-31`) — reads the
  *target's* `$src.file`/`$src.path`, not the wrapper's own. Pinned by task 11's synthetic test (see
  `task-11-report.md`). No production-output consequence beyond that `__test__`-only field is established here;
  flagged because the direction (target wins over wrapper) is a real, verified choice this code makes, not because
  it is known to be wrong.
- **`tryParseYamlOrJson` is far more lenient than assumed** (`packages/core/src/parse/parser.ts:183`). Task 7 tried
  roughly a dozen "obviously broken" YAML snippets — including `{ this is: [not valid` — and every one of them
  recovered silently via the `yaml` package's `parseDocument().toJS()` instead of throwing. The one input confirmed
  to throw is an alias to an anchor that was never defined (`a: *undefined\n`, `Unresolved alias (the anchor must be
  set before the alias): undefined`). So a malformed spec is far more likely to parse into some garbage document
  object than to raise the "unparseable content" error `parser.ts` otherwise handles — decoding failure is not a
  reliable signal for a malformed OpenAPI document.
- **`resolveReference` leaves `$ref` as `undefined`** (`packages/core/src/parse/parser.ts:79`, resolving via
  `resolveReference` at `:112-131`) when a reference resolves to a non-object value — e.g. `$ref: '#/info/title'`,
  a string. `resolveReference` returns `undefined` in that case (`:128-129` guards `typeof value === 'object'`
  before recursing), and the deref proxy's `set` trap accepts an `undefined` assignment silently
  (`typeof value === 'undefined'` is allowed), storing `this._ref = undefined` — so `Source.$ref` reads back as
  `undefined`, not a thrown error and not the unresolved reference string. Pinned by task 7's `'leaves $ref undefined
  when it resolves to a non-object value'` test in `packages/core/src/parse/parser.test.ts`.
- **The `Deref<OpenApiDiscriminator>` special case** in `packages/core/src/parse/types.ts:12-16` (`_DerefDiscriminator`)
  drops `$src`/`$ref`: every other branch of `_Deref<T>` adds `$src: DerefSource<T>` and `$ref?: Deref<T>` to the
  mapped type, but the discriminator branch is `Omit<OpenApiDiscriminator, 'mapping'> & { mapping?: Record<string,
  Deref<OpenApiSchema>> }` alone — no `$src`, no `$ref`. Confirmed by task 8: a plain `{ propertyName, mapping }`
  object literal (not wrapped in `derefAt`/`derefSchemaAt`) type-checks and behaves correctly as a
  `Deref<OpenApiDiscriminator>`, because nothing in `collectResponse` or its neighbours ever dereferences
  `schema.discriminator.$src`. Consistent with production code never reading that field off a discriminator; flagged
  as a documented asymmetry in the `Deref` type rather than a defect.
- **`kt.string(undefined)` silently renders the bare token `null`.** `KtString.onWrite`
  (`packages/kotlin/src/ast/nodes/string.ts:43-45`) branches on `this.value === null` and appends `null`
  unconditionally, with no branch that omits the argument or throws. This is how defect 19 stayed invisible until a
  compile gate existed: a generator passing an `undefined` through `kt.string` produces syntactically valid but
  semantically wrong Kotlin. Defect 19 fixed its own caller; the footgun remains for every other caller. A fix needs
  to decide whether a null-valued `KtString` should throw at construction or render an empty string, and auditing
  existing callers is part of that decision. **The audit is now done, and it finds exactly one unguarded caller:**
  `spring-controller-generator.ts:365`, `parameter.schema?.enum?.map((x) => kt.string(x?.toString()))`, building a
  `@Schema`'s `allowableValues` from a **parameter**'s enum. Every other non-literal `kt.string(...)` caller in
  `packages/kotlin/src` is either guarded by a truthiness check on the same value (`spring-controller-generator.ts:190`,
  `:195`, `:220`, `:338-341`, and `model-generator.ts:461`, `:487`) or wrapped in `String(...)`
  (`spring-controller-generator.ts:356`, `:400`, and `model-generator.ts:144-164`). A parameter schema with
  `enum: ['a', 'b', null]` would emit `@Schema(allowableValues = ["a", "b", null])`, and `allowableValues()` is a
  `String[]` — the identical `Null cannot be a value of a non-null type 'String'.` break defect 19 just closed, in the
  same file. The corpus misses it: `test/specs/v3/enum-schemas.yml:37` and `test/specs/v3.1/enum-schemas.yml:46` do
  have a `null` enum member, but only on `MixedEnum`, a **model** schema, which takes the `String(x)`-wrapped path at
  `model-generator.ts:144-164`, not this one — no corpus parameter schema has a `null` enum member.
  `grep "allowableValues = \[.*null" test/output/kotlin/spring-controllers@sb3` (checked against the committed
  snapshots) returns nothing, confirming no case reproduces it. Stays an observation rather than a numbered defect for
  exactly that reason — no corpus case reaches it — and is not fixed here, matching every other entry in this
  section.
- **`ApiResponse.statusCode` remains lossy on purpose.** `Number(status) || undefined`
  (`packages/core/src/transform/transform-endpoint.ts:206`) still maps `'0'` to `undefined` — this is **defect 38**,
  which stays open. `statusKey`, added by defect 19's fix, is the non-lossy field; anything that needs to emit or
  distinguish a response key must read it. Cross-reference defect 38.
- **`transformResponse`'s object cache can give a `$ref`'d response the wrong `statusKey`.** The cache is keyed on
  `openApiObjectId` (`packages/core/src/transform/transform-endpoint.ts:193-194`, with the `.set` at `:212`), so if
  one `#/components/responses/X` is referenced from two different status keys, the first key wins for the shared
  target — `endpoint.responses[1].$ref.statusKey` would read `'400'` for a response reached under `'default'`.
  Pre-existing, not introduced by defect 19's fix: `statusCode` has always aliased identically, for the same reason.
  It does **not** affect generated output, because the emitted `responseCode` reads the *wrapper*'s `statusKey`, and
  wrappers are distinct spec nodes with their own correct keys — only the shared `$ref` target's own `statusKey`
  is affected, and nothing reads it that way. The corpus does not exercise it: `v3/response-variants` has exactly
  one `$ref`'d response under exactly one key. Register as an observation; do not fix.
- **`spring-controllers` advertises a `default`/range-coded response for which it gives a hand-written delegate no
  typed factory to return.** `getApiResponseEntityClass`'s companion object
  (`spring-controller-generator.ts:521-537`) builds one `ApiResponseEntity` factory per numeric status code —
  `Array.from(new Set([...ctx.config.defaultStatusCodes, 501, ...endpoint.responses.map((x) => x.statusCode)]
  .filter(notNullish)))`, matched back to a response with `x.statusCode === code` — and that is **correct** use of
  `statusCode` rather than `statusKey`: `getReasonPhrase(code)` needs an actual number, and a `2XX` range or
  `default` has no reason phrase to look up. Not a defect. But defect 19's fix means the sibling `@ApiResponses`
  annotation now documents every response by its `statusKey`, including `default` and any range code, while this
  factory list still only ever covers exact numeric codes. `integration/kitchen-sink.yml`'s `getWidget` declares
  `200`, `400`, `404`, `500` and `default` — verified above — so a delegate author hand-writing `getWidget`'s
  implementation finds four typed `ApiResponseEntity` factories and no fifth one for `default`. The four numeric
  factories cover every case the operation can concretely construct; the absence is a reading hazard for whoever
  writes that delegate next, not a bug in this generator. Register as an observation for the next phase; do not fix.

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
