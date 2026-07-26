# Testing Strategy Design

**Date:** 2026-07-25 **Status:** Approved

## Problem

The repo's current tests cover two extremes and miss the middle. Roughly 60 unit tests exercise the TypeScript and
Kotlin AST builders and the `@goast/core` utils; five "generation output" tests stub `fs.writeFileSync`, concatenate
every generated file into one large `.expect.txt`, and on mismatch `spawn('code', ['--diff', ...])` to open VS Code.

Three consequences:

- **Output changes are unreviewable.** A 50 KB concatenated snapshot buries the actual diff, and the format is not the
  language it represents, so no syntax highlighting or navigation applies.
- **Nothing verifies the generated code is usable.** Output that does not compile, or that serializes a query parameter
  wrongly, passes CI as long as the text is stable.
- **The failure workflow requires a GUI.** `code --diff` cannot run in CI, and the fallback is reading an uploaded
  artifact by hand.

Coverage gaps compound this: `@goast/core`'s `parse/`, `transform/`, `collect/`, and `codegen/` directories have almost
no unit tests, and the spec corpus is six files covering a small fraction of OpenAPI.

## Goals

- Four test tiers, each answering exactly one question, with no coverage falling between them.
- Generation output committed as real files, reviewed as ordinary diffs in pull requests.
- Write mode by default locally; check mode by default in CI.
- Generated code proven to compile, and proven to behave correctly over real HTTP.
- Deno and Docker as the only prerequisites. Any other toolchain lives in a container.
- Extensive OpenAPI edge-case coverage.
- One CI job per integration target, with publishing gated on all of them.

## Non-Goals

- Testing the generators' business logic through the generated code. Tier 1 owns that.
- Runtime integration tests for the `models` generators. They produce types with no behaviour; tier 3 covers them.
- Integration coverage of the full edge-case corpus. Integration cost is per-spec and high; the corpus is covered by
  tiers 2 and 3.

## Tiers

| # | Tier        | Question                                              | Runner                   | Cost     |
| - | ----------- | ----------------------------------------------------- | ------------------------ | -------- |
| 1 | Unit        | Does this function do what it says?                   | `deno test`              | seconds  |
| 2 | Output      | Did the generated text change?                        | `deno test`, write/check | seconds  |
| 3 | Compile     | Is the generated code valid in its language?          | Deno + Docker            | ~minutes |
| 4 | Integration | Does the generated code behave correctly on the wire? | Deno + Docker            | minutes  |

Tier 2 has two flavours, because `@goast/core` generates no files:

- **Model snapshots** — spec to parsed and transformed `ApiData`, serialized as text. This is what
  `packages/core/tests/openapi.test.ts` does today via `declutterApiData`; the shape is right and is retained.
- **File-tree snapshots** — spec plus generator config to a real directory of generated files.

Coverage responsibility:

- **Tier 1** owns `@goast/core`'s internals — `parse/`, `transform/`, `collect/`, `codegen/` — plus the AST builders and
  all utils.
- **Tier 2** owns the full edge-case corpus across all nine generators.
- **Tier 3** owns the full corpus as well. It is the only tier that catches an edge-case spec producing uncompilable
  output, and the only coverage the two `models` generators receive.
- **Tier 4** owns one curated kitchen-sink spec across the seven generators with runtime behaviour.

## Repository Layout

```
test/
  specs/                      # OpenAPI corpus (replaces test/openapi-files/)
    v2/ v3/ v3.1/             # ~45 edge-case specs, one concern per file
    integration/              # the curated kitchen-sink spec
  cases/cases.ts              # shared case table (tier 4 expectations)
  output/                     # COMMITTED generated trees, reviewed in PRs
    typescript/<profile>/<version>/<spec>/...      # generated files
    typescript/<profile>/<version>/<spec>.state.txt # generator state snapshot
    kotlin/<profile>/<version>/<spec>/...
    kotlin/<profile>/<version>/<spec>.state.txt
    core/<version>/<spec>/model.txt                # parsed ApiData snapshot
  harness/                    # replaces test/utils/
    snapshot/                 # mode, tree, text-diff, normalize, verify-file-tree, verify-text
    docker.ts  ref-server.ts  ref-client.ts
    declutter.ts  paths.ts  string.utils.ts  types.ts
  output-tests/profiles.ts    # profile registry driving tier 2 and 3
  docker/
    kotlin/  node/  playwright/  k6/
  integration/<target>/       # driver plus test per runtime generator
  README.md                   # tier documentation for contributors
```

`<profile>` names a generator together with its config variant, because config changes output: `models`,
`fetch-clients`, `spring-controllers@sb3`, `spring-controllers@sb3-strict`, `spring-reactive-web-clients@sb4`. Each
profile maps to exactly one tier-3 compile unit.

Review ergonomics: `test/output/**` is added to `fmt.exclude` and `lint.exclude` — it is generated, and byte-exactness
is the point — and marked `linguist-generated` in `.gitattributes` so GitHub collapses those diffs by default while
keeping them expandable. A 40-spec regeneration must not bury the substantive change in a pull request.

Because tier 2 lets generators write real files, assets emitted through `copyAssetFile` (`easy-network-stub.utils.ts`,
the okhttp3 client base, and so on) land in the committed tree. Asset drift becomes reviewable, which it is not today.

## Spec Corpus

54 focused specs replace the current six (measured via `discoverSpecs()` after the corpus-expansion phase landed;
see `docs/superpowers/plans/2026-07-25-corpus-expansion.md`). Each file isolates one concern so a failure names its
own cause. Three items this section describes are not in the corpus: remote HTTP `$ref` (excluded — it would make
tier 2 non-hermetic, fail offline, and pin a third party's document), mixed spec versions in one set (excluded —
`discoverSpecs()` derives `version` from the parent directory, so a mixed-version set has no honest home in the
layout without a discovery change), and a document mixing `webhooks` with a non-empty `paths` (a coverage gap: the
corpus-expansion plan asked for both "no `paths` at all" and a regular operation in `v3.1/webhooks.yml`, which are
unsatisfiable together, so the no-`paths` case was kept and the mixed case dropped rather than faked).

- **Types and schemas** — primitive formats; `nullable` (3.0) versus type arrays (3.1); enums (string, integer, mixed,
  single-value); `const`; arrays (nested, `prefixItems`, `uniqueItems`); objects (`additionalProperties`
  true/false/schema, required combinations, `readOnly`/`writeOnly`, `patternProperties`); defaults; `deprecated`.
- **Composition** — `allOf` merging, `oneOf`, `anyOf`, discriminators with implicit and explicit mapping, nested
  composition, deep inheritance.
- **References** — self-recursion, mutual recursion, external file, remote HTTP, reference to the root document, `$ref`
  with sibling keywords, bare JSON Schema as root (the case fixed in `35a746b`).
- **Naming** — collisions, per-language reserved words, non-ASCII, casing variants, very long names, numeric-leading
  identifiers.
- **Parameters** — all four locations; the `style` and `explode` matrix (form, spaceDelimited, pipeDelimited,
  deepObject); array and object parameters; path-item-level parameters and operation-level overrides; `allowEmptyValue`;
  reserved characters.
- **Request bodies** — JSON, form-urlencoded, multipart including files and nested objects, octet-stream, text/plain,
  several content types on one operation, optional body, `*/*`.
- **Responses** — multiple 2xx, `default`, 204, `2XX` ranges, response headers, error schemas, no-content.
- **Operations and document** — missing `operationId` and the resulting name derivation; tag combinations; `servers` at
  document, path, and operation level; security schemes (apiKey, basic, bearer, oauth2); special-character paths;
  overlapping paths; multiple spec files parsed together; mixed spec versions; 3.1 `webhooks`; JSON versus YAML input.

Cross-version duplication is deliberate but bounded. Schema and composition specs exist per applicable version — v2
where meaningful, v3, v3.1 — because version handling is a real code path. Parameter and body specs live in v3 only
unless the version changes semantics.

Discovery walks `test/specs/{v2,v3,v3.1}/`. A _directory_ there means "parse these files together as one spec set",
which is how the multi-file and mixed-version cases are expressed.

## Tier 1: Unit Tests

Existing tests are retained and normalized to one convention:

- `it` everywhere, replacing today's mix of `it` and `test`.
- `import { expect } from '@std/expect'` consistently, replacing `@std/expect/expect`.
- Literal `\n` instead of `EOL` from `node:os`, so tests do not depend on host OS. `normalizeEOL` is removed where it
  exists only to paper over that.
- One top-level `describe` per exported symbol, colocated as `<symbol-file>.test.ts`.
- No `stub(fs, ...)`. Tier 2 performs real IO.

New coverage targets `@goast/core`'s untested directories: `parse/` (document loading, `$ref` resolution, deref
proxying, version detection), `transform/` (document, endpoint, and schema transformation), `collect/`, and `codegen/`.

## Tier 2: Output Snapshots

`test/harness/snapshot.ts` exposes two primitives:

```ts
verifyFileTree(snapshotDir, (outputDir) => Promise<void>); // generator writes into outputDir
verifyText(snapshotFile, text); // core model, generator state
```

`verifyFileTree` generates into a temporary directory, walks both trees into `Map<relPath, bytes>`, and diffs into
added, changed, and removed. `verifyText` handles the two text snapshots: the generator's returned `state` object,
serialized with `util.inspect({ sorted: true })` as today and written to `<spec>.state.txt` beside the tree —
deliberately outside it, so the compiled tree contains only generated source — and the core `ApiData` model snapshot at
`core/<version>/<spec>/model.txt`. Every file-tree profile also produces a state snapshot; both must match for the test
to pass.

**Write mode** applies the diff to the committed tree — writing added and changed files, deleting removed ones — and
passes, logging a terse `+3 ~1 -0` per profile so the developer knows to inspect `git status`.

**Check mode** throws a report: the add/change/remove file list, then a unified diff capped at approximately 50 lines
across three files, ending with an instruction to run `deno task test:output` and commit the result. Full detail goes to
the CI artifact rather than bloating logs.

**Mode resolution:** `GOAST_SNAPSHOT=write|check` wins when set. Otherwise `check` when `CI` is set, `write` when it is
not.

**Pruning safety rail:** write mode deletes files, so if a generator throws early, the harness fails rather than wiping
the tree. A broken test must never silently delete snapshots. The rail is `actual.size === 0 && expected.size > 0`:
emitting zero files is legitimate — `KotlinModelsGenerator` does exactly that for a spec without `components/schemas` —
so only the combination of nothing generated and a populated snapshot is treated as a fault.

**Error snapshots.** A wide edge-case corpus crossed with nine generators guarantees combinations that throw:
`existingFileBehavior: 'error'` throws by design when two schemas map to one filename, which is precisely what the
naming-collision specs provoke, and generators carry genuine bugs on unusual input. A thrown generation is therefore a
recordable outcome, not a test failure: the harness catches it and snapshots the message to `<spec>.error.txt` beside
the tree, with the file tree asserted empty. Committing the crash makes it reviewable — a PR that fixes a generator
shows the `.error.txt` deleted and a real tree appearing, and a PR that introduces a crash shows the inverse. The
alternative, letting throws fail the test, would leave the suite permanently red on a corpus this wide and force the
narrower corpus the tier exists to avoid. A profile and spec pair has exactly one of the two snapshot forms, never
both; possessing both is itself a failure.

**Log suppression.** The generators emit roughly 23 hardcoded `console.log` calls — `Generating … to <path>`, `Copying
asset file …` — with no verbosity flag or logger seam anywhere in `packages/*/src`. Across hundreds of profile and spec
pairs that buries the per-profile `+3 ~1 -0` summary the write mode exists to surface. The harness captures `console`
for the duration of each generation and replays the captured output only when that generation fails. Adding a logger
option to `OpenApiGeneratorConfig` would be the cleaner fix, but it is a public API change to a published package in
service of a test concern, so it stays out of scope.

**Determinism:** generators always run with `newLine: '\n'`, and comparison is byte-exact — a stray `\r` in a snapshot
is a real bug, not noise to strip. `.gitattributes` gets `test/output/** text eol=lf` so a Windows checkout does not
mangle the tree that CI validates on Linux. Absolute paths embedded in output — the `__source__` fields in generator
state, and source-doc lines per `24a6f8d` — are normalized to `<root>/...` before comparison, reusing the logic in
today's `verify.ts`. A committed tree must be machine-independent. Where the generator already emits relative paths the
normalization is inert. Normalized paths appear only inside comments, so tier 3 still compiles the tree.

**CI artifact:** the harness itself emits no patch. When the `output-check` job fails, CI re-runs it in write mode and
uploads `git diff` as a `snapshot.patch` artifact, which a developer can `git apply` instead of regenerating locally.
This replaces the current `verify-outputs` upload. Producing the patch from write mode plus `git diff` is strictly
simpler than reimplementing patch generation in the harness, and it needs no `test/.snapshot-actual/` tree.

This makes the `.gitattributes` treatment of `test/output/**` load-bearing: the tree is marked `-text` so git never
normalizes line endings on either checkout or commit. `text eol=lf` would fix the checkout half but silently rewrite
CRs on commit — which would make `git diff` blind to exactly the CR-only changes this patch mechanism has to carry, and
would leave check mode permanently red on a Windows checkout while CI stayed green. Assets copied verbatim into
generated output (`copyAssetFile`) are pinned to LF at source instead, via `packages/*/assets/** text eol=lf`.

**Profile registry.** Handwriting 45 x 9 test files is untenable, so a registry drives both tier 2 and tier 3:

```ts
// test/output-tests/profiles.ts
{ name: 'spring-controllers@sb3-strict',
  language: 'kotlin',
  specs: 'all',                       // or a filter, e.g. v3-only
  configure: (g) => g.useType(KotlinModelsGenerator, cfg)
                     .useType(KotlinSpringControllersGenerator, {...cfg, strictResponseEntities: true}) }
```

One test file iterates profiles against discovered specs and emits a `describe`/`it` per pair. Adding an edge-case spec
is dropping a file in `test/specs/`; adding a config variant is one registry entry.

Fifteen profiles, because `springBootVersion` sits on the shared `KotlinGeneratorConfig` base and so varies all four
Kotlin generators: `models@sb3`, `models@sb4`, `spring-controllers@sb3`, `spring-controllers@sb3-strict`,
`spring-controllers@sb4`, `spring-controllers@sb4-strict`, `spring-reactive-web-clients@sb3`,
`spring-reactive-web-clients@sb4`, `okhttp3-clients@sb3`, `okhttp3-clients@sb4` for Kotlin; `models`, `fetch-clients`,
`angular-services`, `k6-clients`, `easy-network-stub` for TypeScript.

**Measured cost.** Generation runs at roughly 30 ms per profile and spec pair, so the full 45 x 15 matrix is about 20
seconds of generation — tier 2 stays inside the everyday loop. Output volume is roughly 65 KB and 60 files per spec
across the profiles, extrapolating to some 4.5 MB and 4500 committed files. About 40 KB per spec of that is
byte-identical client boilerplate that the okhttp3, k6, and easy-network-stub generators re-emit per spec. Accepted:
`linguist-generated` collapses it in review, and an asset change genuinely does affect every output tree.

## Tier 3: Compile Gate

One container start per language, not per tree.

**Kotlin.** The harness synthesizes a Gradle multi-project build in a temporary directory: a `settings.gradle.kts` with
one `include` per profile/version/spec, and per-subproject `build.gradle.kts` declaring only that profile's dependencies
(Spring Boot 3 or 4 BOM, okhttp3, Jackson, Reactor). Each subproject points `srcDirs` at its committed tree via bind
mount. A single `gradle --parallel compileKotlin` follows: one daemon, parallel subprojects. Package collisions across
specs cannot occur, because every spec is its own source set.

Dependency coordinates live in one `test/docker/kotlin/versions.gradle.kts`, which the Dockerfile also consumes to
pre-warm the dependency cache in an image layer. That layer is what makes the job fast on a warm cache.

**TypeScript.** Two groups, because most generated TypeScript needs no npm packages:

- `models` and `fetch-clients` — `deno check` on the host. No Docker, no `node_modules`.
- `angular-services`, `k6-clients`, `easy-network-stub` — `tsc --noEmit` inside the `node` image, which has
  `@angular/*`, `@types/k6`, and `easy-network-stub` baked in.

Compiler output is reported verbatim. Wrapping a `kotlinc` or `tsc` error makes it harder to read.

Tier 3 reads the committed tree, so it is meaningful only when that tree is current. CI gates it behind the tier-2 check
job.

## Tier 4: Integration

### Case table

`test/cases/cases.ts` is the single source of truth:

```ts
type ApiCase = {
  id: string; // 'getPet/ok', 'getPet/not-found'
  operationId: string;
  method: HttpMethod;
  pathTemplate: string; // '/pets/{id}'
  expectRequest: { // what the wire must look like
    path: string; // resolved and encoded: '/pets/abc%20def'
    query?: Record<string, string[]>;
    headers?: Record<string, string>;
    body?: BodyExpectation; // json | form | multipart | text | binary | none
  };
  response: { status: number; headers?: Record<string, string>; body?: unknown };
  expectResult: unknown; // what the generated client must hand back
  directions: ('client' | 'server')[];
  except?: Profile[]; // for features a given generator cannot express
};
```

Three consumers, one table:

- The **reference server** serves `response`, records the real request, and the harness asserts it against
  `expectRequest`.
- The **reference client** issues `expectRequest` verbatim and asserts `response`.
- **Drivers** know only how to invoke.

Drivers hardcode their call arguments rather than reading the table. Writing `client.createPet(Pet(name = "x"))` in
typed Kotlin _is_ the assertion that the generated signature is usable; reading arguments from JSON would require a
dynamic dispatch layer that erases exactly what is under test. Drivers emit one `{"caseId":...,"result":...}` line per
case and nothing else.

**Drift protection:** the harness asserts that the set of case ids a driver reported equals the expected set for that
profile and direction. A forgotten case fails loudly rather than quietly shrinking coverage.

### Reference server

`Deno.serve` on an ephemeral port, in the test process. Per request: match `(method, pathTemplate)`, pop from that key's
ordered case queue, record the parsed request, return the case's response.

Keying per endpoint rather than globally means the only ordering requirement is _within_ one endpoint that has several
cases (`getPet` 200 then 404), where the driver iterates in table order. A client's stray retry or preflight lands in a
separate surplus-requests bucket and is reported, instead of desynchronizing every subsequent assertion.

Comparison normalizes what is not under test: a header allowlist dropping `host`, `user-agent`, `accept-encoding`, and
`content-length`; query as an order-insensitive multi-map unless the case says order matters; JSON bodies compared
structurally; multipart parsed into named parts.

### Reference client

Handwritten, spec-independent, and deliberately dumb — raw `fetch` with URL, headers, and body built directly from
`expectRequest`. It shares no code with any generator. That independence is the reason it can serve as an oracle.

### Per-target wiring

Client direction, generated client to reference server:

| Target                                  | Runtime                                                  | Container |
| --------------------------------------- | -------------------------------------------------------- | --------- |
| `fetch-clients`                         | Deno subprocess                                          | none      |
| `okhttp3-clients`                       | Gradle `run`                                             | `kotlin`  |
| `spring-reactive-web-clients` x SB3/SB4 | Gradle `run`                                             | `kotlin`  |
| `angular-services`                      | Node with `TestBed` and `provideHttpClient(withFetch())` | `node`    |
| `k6-clients`                            | `k6 run`, one iteration                                  | `k6`      |

Containerized drivers reach the in-process server via `host.docker.internal:host-gateway`. The committed output tree is
bind-mounted at a fixed path and imported by the driver project, so what runs is byte-identical to what was reviewed.

Server direction, reference client to generated server:

- **`spring-controllers`** — a handwritten delegate implements `PetsApiDelegate` and its siblings. The generated
  interface ships `501` defaults, so the delegate is the only glue needed. Two variants exist, strict and non-strict,
  because `strictResponseEntities` changes delegate return types from `ResponseEntity<Pet>` to
  `CreatePetResponseEntity<Pet>`; each variant compiles against both SB3 and SB4. The application runs as a real Spring
  Boot app in the `kotlin` image on a mapped port; the harness polls health, then the reference client drives it. The
  delegate's behaviour is dictated by the case table: given `expectRequest`, return `response`.
- **`easy-network-stub`** — inverted, because the generated stubs _are_ the API. In the `playwright` image a page
  installs the generated stubs through `playwright-easy-network-stub`, an in-browser known-good fetch client issues each
  case's request, and results are collected out of the browser and asserted in Deno. Playwright rather than Cypress,
  because the generator targets the framework-agnostic `easy-network-stub` core and `playwright-easy-network-stub` is
  its binding.

Seven targets, seven CI jobs.

### Kitchen-sink spec

`test/specs/integration/kitchen-sink.yml` covers only what is observable on the wire: all four parameter locations; the
`style` and `explode` serialization matrix; path parameters requiring encoding; JSON, form-urlencoded, multipart with a
file part, and binary bodies; several content types on one operation; 200, 201, 204, 400, 404, 500, and a `default`
response; response headers; nullable and optional fields; enums; nested and recursive objects; date, date-time, and byte
formats; arrays of objects; and bearer plus apiKey auth.

Purely generative concerns — discriminators, `allOf` merging, naming collisions — stay in the tier-2 and tier-3 corpus.

### Docker layer

`test/harness/docker.ts` keeps container handling in one place:

- `buildImage(name)` — `docker buildx build` with `type=gha` cache in CI, local cache otherwise. The tag derives from a
  hash of the Dockerfile and its context, so a stale image cannot be silently reused.
- `runContainer({image, mounts, env, ports, hostGateway})` — wraps `docker run --rm`, streams output through, returns
  exit code and captured stdout.
- Named volumes for `~/.gradle` and the npm cache, so repeat local runs are fast.
- Every container has a timeout and is killed on test abort. No orphans after Ctrl-C.

If `docker` is absent, tiers 3 and 4 fail with a plain "Docker is required for this tier" rather than a confusing spawn
error. Tiers 1 and 2 never touch Docker, so the everyday `deno task test` loop stays Docker-free.

## Local Tasks

```
deno task test              # tiers 1+2, write mode - the everyday loop
deno task test:unit
deno task test:output       # tier 2, write mode
deno task test:output:check # tier 2, check mode
deno task test:compile      # tier 3
deno task test:it           # tier 4, all targets
deno task test:it:<target>  # tier 4, one target
deno task test:all
```

## CI Workflow

```
lint --+
unit --+
output-check --+-> compile-ts ------------+
images --------+-> compile-kotlin --------+
               +-> it-fetch-clients ------+
               +-> it-angular-services ---+
               +-> it-k6-clients ---------+-> all-tests --+
               +-> it-easy-network-stub --+               +-> publish
               +-> it-okhttp3-clients ----+               |   (main only)
               +-> it-spring-reactive-web-+               |
               +-> it-spring-controllers -+               |
build (jsr dry-run + dnt npm) ----------------------------+
```

- **`images`** — a matrix over the four Dockerfiles, building with `cache-to: type=gha,mode=max`. It exists to warm the
  layer cache once instead of having four jobs race to build the same image. Downstream jobs build with
  `cache-from: type=gha` and get layer hits.
- **`output-check`** gates compile and integration, because both read the committed tree, and validating a stale tree
  produces misleading results. It is a sub-minute job, so the serialization is cheap.
- **Matrix expansions** — `it-spring-reactive-web` over SB3/SB4; `it-spring-controllers` over SB3/SB4 crossed with
  strict and non-strict.
- **`all-tests`** is an aggregator with `if: always()`, failing when `contains(needs.*.result, ...)` matches `failure`,
  `cancelled`, or `skipped`. Treating _skipped_ as failure is deliberate: a mis-authored job-level `if` must never
  silently open the publish gate. `publish` then needs only `[all-tests, build]`.
- **Concurrency** — `cancel-in-progress` for pull requests only, never on `main`, so a publish run cannot be killed
  mid-flight.
- **Composite action** at `.github/actions/setup/` performs Deno setup plus `deno install --frozen`. The pinned-`v2.8.2`
  workaround and its explanatory comment are currently duplicated per job; with roughly 15 jobs that becomes
  unmaintainable.
- **Failure artifacts** — `snapshot.patch` from `output-check`; driver stdout, container logs, and the Spring Boot
  application log from failed integration jobs.

Integration jobs run on every push and every pull request. A client-serialization regression should be caught before
merge, which is the purpose of the tier.

## Migration

**Deleted:**

- `packages/{core,kotlin,typescript}/tests/openapi*.test.ts`, replaced by the profile registry.
- Every `packages/*/tests/.verify/` tree, the concatenated `.expect.txt` files.
- `test/utils/verify.ts`, including `MultipartData` and the `spawn('code', '--diff')` call.

**Moved:**

- `test/utils/` to `test/harness/`, the workspace member renamed to `@goast/test-harness`, retaining `declutter.ts` (the
  core model snapshot still needs it), `paths.ts`, `string.utils.ts`, `types.ts`.
- `test/openapi-files/` to `test/specs/`.

Whether the `npm:test-utils` dnt task is still required — it exists so dnt can type-check package-internal tests — is
verified during implementation and the task is dropped if not.

**Config changes:**

- `deno.json`'s `test.include` is `["/packages/*"]` today, which would exclude everything under `test/`. It widens.
- `fmt.exclude` and `lint.exclude` gain `test/output/**`, and drop `.verify/**`.
- `.gitignore` drops `**/.verify/**/*.actual.txt`. Nothing replaces it: the harness generates into a system temp
  directory via `Deno.makeTempDir()`, so no scratch tree lands inside the repo.
- New `deno task` entries as listed under Local Tasks.

**Documentation:** `test/README.md` documents the four tiers, write and check modes, and how to add a spec, a profile,
or a case.

## Implementation Phases

Each phase gets its own implementation plan.

1. **Harness foundation** — `test/harness/snapshot/` (mode, tree, text-diff, normalize, and the two verify entry
   points), `deno.json` wiring, `test/README.md`. `docker.ts` moved to phase 3, where the compile gate gives it a real
   consumer; building it here would mean either an untested abstraction or Docker-dependent tests with no workload.
2. **Tier 2 machinery** — spec discovery, profile registry, `verifyProfile`, the output test driver, deletion of the old
   verify tests, initial committed trees over the _existing_ 14-file corpus. Delivers a working tier 2 end to end.
2b. **Corpus expansion** — the ~45 edge-case specs, in category batches, each batch regenerating trees. Split from 2
   because authoring the corpus is bulk content work gated on nothing but a functioning tier 2, and because reviewing
   ~4500 committed files is tractable per category and not in one commit.
3. **Tier 3** — Gradle multi-project compile, TypeScript compile, `kotlin` and `node` Dockerfiles.
4. **Tier 1** — `@goast/core` `parse`/`transform`/`collect`/`codegen` coverage plus the convention pass. Independent of
   the others; can slot anywhere.
5. **Contract proof** — case table, reference server, reference client, kitchen-sink spec, and `fetch-clients`
   integration.
6. **Kotlin integration** — okhttp3, spring-reactive-web, spring-controllers with delegates.
7. **Remaining TypeScript integration** — angular, k6, easy-network-stub with their Dockerfiles.
8. **CI rework.**

Phase 5 precedes the Docker-heavy targets deliberately. It validates the case table, the reference server, the reference
client, and the driver line protocol with zero container complexity. If the contract design is wrong, that is the
cheapest place to discover it.
