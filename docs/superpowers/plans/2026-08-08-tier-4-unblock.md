# Tier-4 Unblock: Kotlin Generator Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four registered Kotlin generator defects that make every phase-6 tier-4 target fail to compile the
kitchen-sink spec, so phase 6 can actually run the generated code.

**Architecture:** Four independent one-mechanism fixes, each landing as a single commit that carries the generator
change, its unit tests, and the regenerated tier-2 snapshots and tier-3 diagnostics together. A fifth task verifies the
whole gate, updates the register, and proves phase-6 readiness. Nothing in this plan touches tier 4 itself — all four
defects are Kotlin, so `test/wire/**` must not change.

**Tech Stack:** Deno, TypeScript, Kotlin/Gradle in Docker, Jackson 2 and 3, Spring Boot 3 and 4.

## Why this plan exists

Tier 4 runs generated code. Tier 3 records that the code does not compile. Today:

| Target                            | Kitchen-sink compile | Blocking defect        |
| --------------------------------- | -------------------- | ---------------------- |
| `okhttp3-clients@sb3`             | 8 errors             | 27                     |
| `okhttp3-clients@sb4`             | 10 errors            | 27 + 26                |
| `spring-controllers` × 4 variants | 1 error each         | 19                     |
| `spring-reactive-web-clients@sb3` | 12 errors            | 28                     |
| `spring-reactive-web-clients@sb4` | **clean**            | — (the only one today) |

All four defects are already fully diagnosed in
[`2026-07-25-generator-bug-fixes.md`](2026-07-25-generator-bug-fixes.md) with located mechanisms and exact citations.
This plan is implementation, not discovery. Read each defect's register entry before its task — the entry is the
authority on the mechanism, and its `**Compile gate:**` element tells you the occurrence count your fix must drive to
zero.

## Global Constraints

- **Only Deno and Docker are prerequisites.** Any other toolchain runs inside a container.
- **One commit per defect.** Each commit carries the generator fix, its unit tests, the regenerated `test/output/**`
  snapshots, and the regenerated `test/compile/**` diagnostics. Never split a fix from the output it changes — the
  point of the commit shape is that a reviewer sees which output change came from which mechanism.
- **`test/wire/**` must not change in this plan.** All four defects are Kotlin; tier 4 currently covers only
  `fetch-clients` (TypeScript). A changed wire artifact means something unintended happened — stop and report.
- **Every tier-2 snapshot change must be intentional and explained.** Tier 2 is byte-exact. For each task, state in
  your report how many files changed and why that is exactly the set the mechanism predicts.
- `deno fmt --check` and `deno lint` must both pass before every commit.
- `test/harness` is linted under JSR rules: every exported symbol needs an explicit type annotation, or `deno lint`
  fails `no-slow-types`.
- One top-level `describe` per exported symbol, colocated as `<symbol-file>.test.ts`.
- **Never run `git checkout -- <path>` to restore a file.** `core.autocrlf=true` here rewrites it CRLF, which still
  matches `git hash-object` but then fails `deno fmt --check`. Use `git show HEAD:<path> > <path>`.
- Do not end a verification command with `tail` and then report its exit code — that masks the real status. Run it in
  the foreground with a real timeout and propagate the exit code.

## Regeneration commands

```
deno task test:output          # tier 2, write mode - rewrites test/output/**
deno task test:output:check    # tier 2, check mode - must pass after regenerating
deno task test:compile         # tier 3, write mode - rewrites test/compile/**  (Docker, ~2-5 min warm)
deno task test:compile:check   # tier 3, check mode - must pass after regenerating
deno task test                 # tiers 1+2
```

The Kotlin compile gate cannot be scoped to one profile — `test/compile-tests/compile.test.ts:174-177` compiles every
Kotlin unit in a single Gradle invocation, so `--filter` cannot narrow it. Budget one full Kotlin gate run per task.
Gradle state persists in `.goast-cache/gradle-work`, so a warm run is ~2 min; a task that changes a widely-emitted file
invalidates the units it touches and takes longer. `deno task test:compile:clean` clears that state if you ever need a
cold run.

## File Structure

| File                                                                                  | Responsibility                        | Task |
| ------------------------------------------------------------------------------------- | ------------------------------------- | ---- |
| `packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts` | drop the version guard on the `Any` bound | 1 |
| `.../spring-reactive-web-clients/spring-reactive-web-client-generator.test.ts`         | pin the bound on both Boot lines      | 1    |
| `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts` | derive `delegateArguments` from the serializer mode | 2 |
| `.../okhttp3-clients/okhttp3-client-generator.test.ts`                                 | **new** — pin both argument orders    | 2    |
| `packages/kotlin/src/ast/references/jackson.ts`                                        | add the Jackson 3 `DateTimeFeature` reference | 3 |
| `packages/kotlin/src/ast/references/jackson.test.ts`                                   | pin its package                       | 3    |
| `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts` | use it in the Spring Boot 4 branch    | 3    |
| `packages/core/src/transform/api-types.ts`                                             | add `statusKey` to `ApiResponse`      | 4    |
| `packages/core/src/transform/transform-endpoint.ts`                                    | populate it                           | 4    |
| `packages/core/src/transform/transform-endpoint.test.ts`                                | pin it for exact, range, default, `'0'` | 4  |
| `packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts` | emit `statusKey` instead of `statusCode` | 4 |
| `.../spring-controllers/spring-controller-generator.test.ts`                            | pin the emitted `responseCode`         | 4    |
| `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`                              | mark all four fixed                   | 5    |

---

### Task 1: Defect 28 — the `Any` bound is on the wrong Spring Boot line

**Files:**

- Modify: `packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.ts:164-166`
- Test: `packages/kotlin/src/generators/services/spring-reactive-web-clients/spring-reactive-web-client-generator.test.ts`

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on.

Read defect 28's register entry first. Mechanism: each generated `…Requests.kt` emits
`suspend fun <T> WebClient.<operation>(responseHandler: suspend (ClientResponse) -> T): T`. Spring's `awaitExchange` is
declared `<V : Any>`, so `T` needs an `Any` bound to infer. The guard gives the bound to Spring Boot **4** only, and it
is the Boot **3** line that needs it — 115 diagnostics across 16 units, `@sb3` only. `@sb4` emits the bound and
compiles, so making the constraint unconditional is known to satisfy both lines as they stand.

- [ ] **Step 1: Write the failing test**

Append to the existing `describe('DefaultKotlinSpringReactiveWebClientGenerator', …)` block. The file already has a
`createContext()` that hardcodes one config; parameterize it by Spring Boot version rather than adding a second helper.

Change the existing helper from `function createContext(): …` to:

```ts
function createContext(springBootVersion: 3 | 4 = 3): KotlinSpringReactiveWebClientGeneratorContext {
  return { config: { ...config, springBootVersion } } as unknown as KotlinSpringReactiveWebClientGeneratorContext;
}
```

and update `TestGenerator` to pass it through:

```ts
class TestGenerator extends DefaultKotlinSpringReactiveWebClientGenerator {
  public members(endpoint: ApiEndpoint, springBootVersion: 3 | 4 = 3): kt.Function<KotlinFileBuilder>[] {
    return this.getEndpointMembers(createContext(springBootVersion), {
      endpoint,
      parameters: [],
    }) as kt.Function<KotlinFileBuilder>[];
  }

  /** The rendered generic parameters of every handler overload, e.g. `['T : Any']`. */
  public handlerGenerics(springBootVersion: 3 | 4): string[] {
    return this.members(createEndpoint(false), springBootVersion)
      .filter((fn) => fn.generics.length > 0)
      .flatMap((fn) =>
        fn.generics.map((g) => SourceBuilder.build((b) => g.write(b as KotlinFileBuilder), config).trim())
      );
  }
}
```

Then add a new `describe` for the behaviour:

```ts
  // Spring's `awaitExchange` is `<V : Any>` on BOTH Boot lines, so the `<T>` handler overload needs the
  // bound on both. Defect 28 gave it to Boot 4 only, which is the line that did not need it most: `@sb3`
  // produced 115 diagnostics across 16 units and `@sb4` compiled clean.
  describe('awaitExchange Any bound', () => {
    it('bounds T by Any on the Spring Boot 3 line', () => {
      const generics = new TestGenerator().handlerGenerics(3);

      expect(generics.length).toBeGreaterThan(0);
      for (const generic of generics) expect(generic).toBe('T : Any');
    });

    it('bounds T by Any on the Spring Boot 4 line too', () => {
      const generics = new TestGenerator().handlerGenerics(4);

      expect(generics.length).toBeGreaterThan(0);
      for (const generic of generics) expect(generic).toBe('T : Any');
    });
  });
```

- [ ] **Step 2: Run the test and watch the Boot 3 case fail**

Run: `deno test -A packages/kotlin/src/generators/services/spring-reactive-web-clients/`
Expected: the Boot 3 test FAILS with `expected "T : Any"` / `received "T"`. The Boot 4 test PASSES already — that is
the asymmetry the defect describes, and seeing one pass and one fail is the confirmation you have reproduced it.

- [ ] **Step 3: Make the constraint unconditional**

In `spring-reactive-web-client-generator.ts:164-166`, replace:

```ts
      // Spring 7's `WebClient.awaitExchange` is `<V : Any>`, so the `<T>` overloads need an `Any` bound to infer.
      generics: [
        kt.genericParameter('T', ctx.config.springBootVersion === 4 ? { constraint: kt.refs.any() } : undefined),
      ],
```

with:

```ts
      // `WebClient.awaitExchange` is `<V : Any>` on both Spring lines, so the `<T>` overload needs the bound
      // unconditionally. Defect 28 scoped it to Spring Boot 4, leaving every Boot 3 unit uncompilable.
      generics: [kt.genericParameter('T', { constraint: kt.refs.any() })],
```

- [ ] **Step 4: Run the test and watch both pass**

Run: `deno test -A packages/kotlin/src/generators/services/spring-reactive-web-clients/`
Expected: PASS, both cases.

- [ ] **Step 5: Regenerate tier 2 and confirm the change is exactly what the mechanism predicts**

```bash
deno task test:output
git status --short test/output | wc -l
```

Expected: only `spring-reactive-web-clients@sb3` files change, and each change is the single token `<T>` → `<T : Any>`.
`@sb4` must not change at all — it already emitted the bound. Verify with:

```bash
git diff --stat test/output | tail -3
git diff test/output | grep -c "^[-+].*suspend fun <T"
```

Report both numbers. Then confirm check mode is clean: `deno task test:output:check`.

- [ ] **Step 6: Regenerate tier 3 and confirm the diagnostics are gone**

```bash
deno task test:compile
```

This is a Docker run; expect roughly 2-5 minutes. Run it in the foreground and propagate its exit code.

Expected: every `test/compile/kotlin/spring-reactive-web-clients@sb3/**` diagnostic file is **deleted** — the register
records 115 occurrences across 16 units, and the entry notes those 15 extra snapshots (20 for `@sb3` against `@sb4`'s 5)
are "this defect and nothing else". Confirm:

```bash
git status --short test/compile | grep "spring-reactive-web-clients" | wc -l
```

Then verify: `deno task test:compile:check` passes.

**If any `spring-reactive-web-clients@sb3` diagnostic survives, read it.** A surviving diagnostic is either a second
defect the gate was masking behind this one, or your fix is incomplete. Report which, and do not commit a partial fix
as if it were complete.

- [ ] **Step 7: Commit**

```bash
deno fmt --check && deno lint
git add packages/kotlin/src/generators/services/spring-reactive-web-clients test/output test/compile
git commit -m "fix(kotlin): bound awaitExchange's T by Any on both Spring Boot lines"
```

---

### Task 2: Defect 27 — `okhttp3-clients` passes `super(…)` arguments in the wrong order

**Files:**

- Modify: `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.ts:58-88`
- Test: `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.test.ts` (**new file**)

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: `protected getClientDelegateArguments(serializerAsParameter: boolean): string[]` on
  `DefaultKotlinOkHttp3ClientGenerator` — a new seam introduced so the decision is testable without a deep fake
  context. No other task depends on it.

Read defect 27's register entry first. Mechanism: the generated `ApiClient` base has two parameter orders, chosen by
`ctx.config.serializer` at `okhttp3-clients-generator.ts:129-131`:

- `serializer: 'parameter'` → `(baseUrl, objectMapper, client)`
- anything else (the default is `'static'`) → `(baseUrl, client, objectMapper)`

Each subclass orders its **own** constructor parameters by the same flag (`okhttp3-client-generator.ts:59`, used at
`:69` and `:76`) but its `super(…)` argument list is the constant `['basePath', 'objectMapper', 'client']`
(`:85`), which matches only the `'parameter'` shape. Every corpus profile uses the default, so the positional call
hands `objectMapper` to the `Call.Factory` slot and `client` to the `ObjectMapper` slot. Kotlin reports both, which is
why the diagnostic always arrives as a symmetric pair on one line: 76 occurrences across 32 units.

**Fix the subclass, not the base.** The register is explicit: the `'parameter'` path is not exercised by the corpus, so
nothing shows the base is broken, and reordering the base would be a change made blind.

- [ ] **Step 1: Write the failing test**

Create `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-client-generator.test.ts`. The delegate-argument
decision is extracted into its own method in Step 3 precisely so this test needs no generator context at all:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { DefaultKotlinOkHttp3ClientGenerator } from './okhttp3-client-generator.ts';

class TestGenerator extends DefaultKotlinOkHttp3ClientGenerator {
  public delegateArguments(serializerAsParameter: boolean): string[] {
    return this.getClientDelegateArguments(serializerAsParameter);
  }
}

describe('DefaultKotlinOkHttp3ClientGenerator', () => {
  // The generated `ApiClient` base takes `(baseUrl, objectMapper, client)` under `serializer: 'parameter'`
  // and `(baseUrl, client, objectMapper)` otherwise (okhttp3-clients-generator.ts:129-131). Defect 27 hard-
  // coded the first order for both, so the default `'static'` config passed `objectMapper` into the
  // `Call.Factory` slot and vice versa — 76 diagnostics across 32 units, always as a symmetric pair.
  describe('getClientDelegateArguments', () => {
    it('matches the base order when the serializer is a constructor parameter', () => {
      expect(new TestGenerator().delegateArguments(true)).toEqual(['basePath', 'objectMapper', 'client']);
    });

    it('matches the base order when the serializer is static', () => {
      expect(new TestGenerator().delegateArguments(false)).toEqual(['basePath', 'client', 'objectMapper']);
    });
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `deno test -A packages/kotlin/src/generators/services/okhttp3-clients/`
Expected: FAIL — `getClientDelegateArguments` does not exist yet (a TypeScript error on the `TestGenerator` method).

- [ ] **Step 3: Extract the decision and derive the order from it**

In `okhttp3-client-generator.ts`, add the method next to `getClientClass`:

```ts
  /**
   * The `super(…)` arguments, in the base class's own parameter order.
   *
   * The base's order is chosen by `serializer` at `okhttp3-clients-generator.ts:129-131`, and this list is
   * positional, so the two must be derived from the same flag. Defect 27 was this list being a constant that
   * matched only the `'parameter'` shape while every corpus profile uses the default `'static'`.
   */
  protected getClientDelegateArguments(serializerAsParameter: boolean): string[] {
    return serializerAsParameter
      ? ['basePath', 'objectMapper', 'client']
      : ['basePath', 'client', 'objectMapper'];
  }
```

Then in `getClientClass`, replace the constant at `:85`:

```ts
          delegateArguments: ['basePath', 'objectMapper', 'client'],
```

with:

```ts
          delegateArguments: this.getClientDelegateArguments(serializerAsParameter),
```

`serializerAsParameter` is already in scope — it is computed at `:59` and used for the parameter ordering at `:69`
and `:76`.

- [ ] **Step 4: Run the test and watch it pass**

Run: `deno test -A packages/kotlin/src/generators/services/okhttp3-clients/`
Expected: PASS, both cases.

- [ ] **Step 5: Regenerate tier 2**

```bash
deno task test:output
git diff --stat test/output | tail -3
```

Expected: only `okhttp3-clients@sb3` and `okhttp3-clients@sb4` client classes change, and every change is the same
`super(basePath, objectMapper, client)` → `super(basePath, client, objectMapper)` line. The register says 16 units per
Boot line have a client class (a models-only spec emits no subclass). Confirm the shape:

```bash
git diff test/output | grep "^[-+].*super(basePath" | sort | uniq -c
```

Report that output. Then: `deno task test:output:check` must pass.

- [ ] **Step 6: Regenerate tier 3**

```bash
deno task test:compile
```

Docker, foreground, propagate the exit code.

Expected: every `Argument type mismatch: actual type is 'ObjectMapper', but 'Call.Factory' was expected.` pair
disappears — 76 occurrences across 32 units. **`okhttp3-clients@sb4` diagnostics will NOT disappear entirely**: that
profile also carries defect 26's two `Serializer.kt` lines, which Task 3 fixes. So expect `@sb3` diagnostic files for
units whose only problem was this defect to be deleted, and `@sb4` files to shrink to exactly the two
`WRITE_DATES_AS_TIMESTAMPS` / `configure` lines. Verify that reading:

```bash
cat test/compile/kotlin/okhttp3-clients@sb4/integration/kitchen-sink.txt
```

Expected: exactly two lines, both about `Serializer.kt`. Then `deno task test:compile:check` must pass.

- [ ] **Step 7: Commit**

```bash
deno fmt --check && deno lint
git add packages/kotlin/src/generators/services/okhttp3-clients test/output test/compile
git commit -m "fix(kotlin): derive okhttp3 super() argument order from the serializer mode"
```

---

### Task 3: Defect 26 — `okhttp3-clients@sb4` uses a Jackson 2 member against Jackson 3

**Files:**

- Modify: `packages/kotlin/src/ast/references/jackson.ts`
- Modify: `packages/kotlin/src/ast/references/jackson.test.ts`
- Modify: `packages/kotlin/src/generators/services/okhttp3-clients/okhttp3-clients-generator.ts:158`

**Interfaces:**

- Consumes: Task 2's fix to the same profile (so this task's diagnostics are the only ones left in `@sb4`).
- Produces: `export const dateTimeFeature: KtReferenceFactory` in `jackson.ts`.

Read defect 26's register entry first. Mechanism: the static-serializer template gets the Jackson 3 migration almost
entirely right, then splices in one member Jackson 3 removed. At `okhttp3-clients-generator.ts:158`, inside the
`springBootVersion === 4` branch:

```ts
.configure(${kt.refs.jackson.serializationFeature(springBootVersion)}.WRITE_DATES_AS_TIMESTAMPS, false)
```

`serializationFeature` correctly resolves to `tools.jackson.databind.SerializationFeature`, but Jackson 3 moved date
handling off `SerializationFeature`. 106 occurrences across 53 units — every unit of the profile, the widest defect the
gate found in either language.

**The replacement, verified against Jackson's migration guide:**
`WRITE_DATES_AS_TIMESTAMPS` moved to `tools.jackson.databind.cfg.DateTimeFeature`. Note it is a Jackson **3**-only
type — Jackson 2 keeps the constant on `SerializationFeature` — so the new reference takes no Spring Boot version and is
used only in the Boot 4 branch. The Boot 3 branch at `:164` stays exactly as it is.

**A considered alternative, deliberately not taken:** Jackson 3 also flipped this feature's default to `false`, which is
precisely what the generated code configures, so the Boot 4 branch could simply drop the call. Rejected because it
would leave the two branches asymmetric and silently dependent on an upstream default that has already changed once.
Emit it explicitly.

- [ ] **Step 1: Write the failing test**

In `jackson.test.ts`, add a `describe` inside the existing `describe('jackson', …)` → `describe('jackson references', …)`
block, beside the two that are already there:

```ts
    // Jackson 3 moved WRITE_DATES_AS_TIMESTAMPS off SerializationFeature onto DateTimeFeature, which exists
    // only in Jackson 3 — so unlike its neighbours this reference takes no Spring Boot version. Defect 26 was
    // the Boot 4 branch emitting the member against `tools.jackson.databind.SerializationFeature`, where it
    // does not exist, breaking every unit of the profile.
    describe('dateTimeFeature', () => {
      it('resolves to the Jackson 3 config package', () => {
        expect(jackson.dateTimeFeature().packageName).toBe('tools.jackson.databind.cfg');
      });

      // `refName` is a property of the FACTORY (reference.ts:135), not of the reference it creates — the
      // created reference exposes `name` instead. The annotation block above uses `factory.refName` the
      // same way.
      it('is named DateTimeFeature', () => {
        expect(jackson.dateTimeFeature.refName).toBe('DateTimeFeature');
      });
    });
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `deno test -A packages/kotlin/src/ast/references/`
Expected: FAIL — `jackson.dateTimeFeature` does not exist.

- [ ] **Step 3: Add the reference**

In `jackson.ts`, add below the `deserializationFeature` factory (i.e. at the end of the databind group, before the
`module.kotlin` comment):

```ts
/**
 * `tools.jackson.databind.cfg.DateTimeFeature` — Jackson 3 only.
 *
 * Jackson 3 moved `WRITE_DATES_AS_TIMESTAMPS` off `SerializationFeature` onto this type. Unlike its
 * neighbours it takes no `springBootVersion`, because Jackson 2 has no equivalent: on the Spring Boot 3
 * line the constant still lives on `SerializationFeature`.
 */
export const dateTimeFeature: KtReferenceFactory = ktReference.factory(
  'DateTimeFeature',
  'tools.jackson.databind.cfg',
);
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `deno test -A packages/kotlin/src/ast/references/`
Expected: PASS.

- [ ] **Step 5: Use it in the Spring Boot 4 branch**

In `okhttp3-clients-generator.ts`, inside the `springBootVersion === 4` branch, replace line 158:

```ts
            .configure(${kt.refs.jackson.serializationFeature(springBootVersion)}.WRITE_DATES_AS_TIMESTAMPS, false)
```

with:

```ts
            .configure(${kt.refs.jackson.dateTimeFeature()}.WRITE_DATES_AS_TIMESTAMPS, false)
```

Leave the `deserializationFeature` line directly below it untouched — `FAIL_ON_UNKNOWN_PROPERTIES` did not move. Leave
the Boot 3 branch's `serializationFeature` line at `:164` untouched.

Note that `serializationFeature` remains exported and used by the Boot 3 branch, so do not delete it.

- [ ] **Step 6: Regenerate tier 2**

```bash
deno task test:output
git diff --stat test/output | tail -3
```

Expected: only `okhttp3-clients@sb4` `Serializer.kt` files change — 53 of them, one per unit of the profile — and each
change is the import line plus the `.configure(...)` line. Nothing under `@sb3` may change. Confirm:

```bash
git diff --name-only test/output | grep -vc "okhttp3-clients@sb4"
```

Expected: `0`. Then `deno task test:output:check` must pass.

- [ ] **Step 7: Regenerate tier 3 — this is the step that proves the Jackson 3 name is right**

```bash
deno task test:compile
```

Docker, foreground, propagate the exit code. This run is the authority on whether `DateTimeFeature` resolves against
the Jackson 3 jars actually on the classpath.

Expected: **every** `okhttp3-clients@sb4` diagnostic file is deleted. With Task 2 already landed, defect 26's two lines
were the only thing left in that profile, so the profile should go to zero diagnostics. Confirm:

```bash
ls test/compile/kotlin/okhttp3-clients@sb4/ 2>&1
```

Expected: the directory is gone or empty. Then `deno task test:compile:check` must pass.

**If `Unresolved reference 'DateTimeFeature'` or `Unresolved reference 'configure'` appears, report BLOCKED with the
exact diagnostic.** Two plausible causes worth naming in your report: the Jackson 3 builder may expose
`.enable(...)`/`.disable(...)` rather than `.configure(feature, state)` for this feature type, in which case
`.disable(${kt.refs.jackson.dateTimeFeature()}.WRITE_DATES_AS_TIMESTAMPS)` is the equivalent; or the type may sit in a
different sub-package than `databind.cfg`. Do not guess a third name blind — report what the compiler said.

- [ ] **Step 8: Commit**

```bash
deno fmt --check && deno lint
git add packages/kotlin/src/ast/references packages/kotlin/src/generators/services/okhttp3-clients test/output test/compile
git commit -m "fix(kotlin): emit Jackson 3's DateTimeFeature for WRITE_DATES_AS_TIMESTAMPS"
```

---

### Task 4: Defect 19 — `spring-controllers` writes `responseCode = null`

**Files:**

- Modify: `packages/core/src/transform/api-types.ts:107-112`
- Modify: `packages/core/src/transform/transform-endpoint.ts:198-209`
- Test: `packages/core/src/transform/transform-endpoint.test.ts` (extend the existing status-code describe)
- Modify: `packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.ts:211-212`
- Test: `packages/kotlin/src/generators/services/spring-controllers/spring-controller-generator.test.ts`

**Interfaces:**

- Consumes: nothing from other tasks.
- Produces: `statusKey: string` on `ApiResponse`, exported from `@goast/core`. Additive; no other task depends on it.

Read defect 19's register entry first. Mechanism:
`getApiInterfaceEndpointMethodAnnnotations` (note the three-`n` spelling — it is the real method name) builds each
`@ApiResponse`'s `responseCode` as `kt.string(response.statusCode?.toString())`. `statusCode` is populated only for an
exact numeric code, so a `default` or range code (`2XX`/`4XX`/`5XX`) leaves it `undefined`, `kt.string(undefined)`
constructs a `KtString` with `value: null`, and `KtString.onWrite` (`packages/kotlin/src/ast/nodes/string.ts:43-45`)
renders `null` as the bare token `null`. `ApiResponse.responseCode()` is a non-nullable annotation element, so the
result does not compile: 28 occurrences across the 4 `spring-controllers` variants, plus 1 per variant on the
kitchen-sink.

**The root cause is upstream of the generator, and that is what this task fixes.** `transformResponse`
(`transform-endpoint.ts:205`) receives the spec's response key as `status` — a string like `'200'`, `'2XX'` or
`'default'` — and throws it away, keeping only `statusCode: Number(status) || undefined`. So the generator has no way to
distinguish `default` from `2XX` even if it wanted to. Adding the key to `ApiResponse` fixes the compile break and the
information loss in one move, and reduces the generator change to a single token.

**Deliberately not changed:** `KtString.onWrite`'s rendering of a `null` value as the bare token `null`. That is a
genuine footgun — `kt.string(undefined)` silently emitting invalid Kotlin is how this defect stayed invisible — but
other callers may depend on it, and changing it would be a far wider behavioural change than this task's mechanism.
Task 5 registers it as a new observation instead.

- [ ] **Step 1: Write the failing core test**

`transform-endpoint.test.ts` already has a describe pinning this area, with tests at roughly lines 242-295 covering a
numeric code, `default`, a range code, and the string `'0'`. Add four `statusKey` assertions beside them, reusing
whatever spec-building helper those existing tests use (read them first — match their construction exactly rather than
inventing a second style):

```ts
    // `statusCode` deliberately keeps its lossy shape; `statusKey` is the spec's own response key, which is
    // what an emitted `@ApiResponse(responseCode = …)` needs. Defect 19 existed because only the former was
    // kept, so `default`, `2XX`, `4XX` and `5XX` were indistinguishable from each other and from a missing
    // code — and the Kotlin generator rendered all of them as the bare token `null`.
    it('keeps the exact numeric response key in statusKey', () => {
      // ... build a spec whose only response is `200`, as the numeric-status-code test above does
      expect(endpoint.responses[0].statusKey).toBe('200');
    });

    it('keeps "default" in statusKey', () => {
      expect(endpoint.responses[0].statusKey).toBe('default');
    });

    it('keeps a range code such as 2XX in statusKey', () => {
      expect(endpoint.responses[0].statusKey).toBe('2XX');
    });

    it('keeps the numeric string "0" in statusKey, which statusCode cannot represent', () => {
      expect(endpoint.responses[0].statusKey).toBe('0');
      expect(endpoint.responses[0].statusCode).toBeUndefined();
    });
```

- [ ] **Step 2: Run the core test and watch it fail**

Run: `deno test -A packages/core/src/transform/`
Expected: FAIL — `statusKey` does not exist on `ApiResponse`.

- [ ] **Step 3: Add and populate the field**

In `api-types.ts`, extend `ApiResponse`:

```ts
export type ApiExampleComponent = ApiComponent<OpenApiResponse>;
export type ApiResponse = ApiExampleComponent & {
  /**
   * The response key exactly as the spec wrote it: an exact code (`'200'`), a range (`'2XX'`), or
   * `'default'`.
   *
   * Kept alongside {@link statusCode} because that field is lossy by construction —
   * `Number(status) || undefined` collapses `default`, every range code and the literal `'0'` into
   * `undefined`. Anything that has to *emit* a status code needs this one.
   */
  statusKey: string;
  statusCode: number | undefined;
  description: string | undefined;
  headers: ApiHeader[];
  contentOptions: ApiContent[];
};
```

In `transform-endpoint.ts`, populate it in the `ApiResponse` literal at `:198-209`, directly above `statusCode`:

```ts
    statusKey: status,
    statusCode: Number(status) || undefined,
```

`status` is already the function's third parameter and is already passed through the `$ref` recursion at `:197`, so no
signature change is needed.

- [ ] **Step 4: Run the core test and watch it pass**

Run: `deno test -A packages/core/src/transform/`
Expected: PASS. Then run the whole unit suite to catch any other construction site:
`deno task test:unit`. Expected: PASS. If a test fails because it constructs an `ApiResponse` without `statusKey`, add
the field to that fixture — do not make `statusKey` optional to avoid the work, because an optional field would let the
generator fall back to the same `undefined` this defect is about.

- [ ] **Step 5: Write the failing Kotlin test**

In `spring-controller-generator.test.ts`, add a `TestGenerator` method exposing the annotation builder and a describe
for it. The existing file's `createContext()` and `endpoint` const are reusable; the annotations method takes the
endpoint, so build endpoints with responses:

```ts
function createEndpointWithResponses(statusKeys: string[]): ApiEndpoint {
  return {
    name: 'responses',
    method: 'get',
    path: '/responses',
    responses: statusKeys.map((statusKey) => ({
      statusKey,
      statusCode: Number(statusKey) || undefined,
      description: undefined,
      headers: [],
      contentOptions: [],
    })),
  } as unknown as ApiEndpoint;
}
```

and on `TestGenerator`:

```ts
  /** Every rendered `responseCode = …` argument of the generated `@ApiResponses` annotation. */
  public responseCodes(endpointWithResponses: ApiEndpoint): string[] {
    return this.getApiInterfaceEndpointMethodAnnnotations(createContext(), endpointWithResponses)
      .map((a) => SourceBuilder.build((b) => a.write(b as KotlinFileBuilder), config))
      .flatMap((rendered) => [...rendered.matchAll(/responseCode = ("[^"]*"|null)/g)].map((m) => m[1]));
  }
```

Then the behaviour:

```ts
  // `ApiResponse.responseCode()` is a non-nullable annotation element, so the bare token `null` does not
  // compile — 28 occurrences across the four spring-controllers variants. Rendering the spec's own response
  // key fixes the compile break and also makes `default`, `2XX`, `4XX` and `5XX` distinguishable, which the
  // old `statusCode?.toString()` collapsed into one indistinguishable `null`.
  describe('getApiInterfaceEndpointMethodAnnnotations', () => {
    it('renders an exact status code as a quoted string', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['200']))).toEqual(['"200"']);
    });

    it('renders the default response as "default" rather than null', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['default']))).toEqual(['"default"']);
    });

    it('keeps range codes distinct from each other and from default', () => {
      expect(new TestGenerator().responseCodes(createEndpointWithResponses(['2XX', '4XX', '5XX', 'default'])))
        .toEqual(['"2XX"', '"4XX"', '"5XX"', '"default"']);
    });

    it('never emits a bare null', () => {
      const codes = new TestGenerator().responseCodes(createEndpointWithResponses(['200', '2XX', 'default']));

      expect(codes).not.toContain('null');
    });
  });
```

- [ ] **Step 6: Run the Kotlin test and watch it fail**

Run: `deno test -A packages/kotlin/src/generators/services/spring-controllers/`
Expected: FAIL — the `default` and range cases render `null`, which is exactly the defect. The `'200'` case passes
already.

- [ ] **Step 7: Emit the key**

In `spring-controller-generator.ts:211-212`, replace:

```ts
                    kt.argument.named(
                      'responseCode',
                      kt.string(response.statusCode?.toString()),
                    ),
```

with:

```ts
                    kt.argument.named(
                      'responseCode',
                      // The spec's own response key, not `statusCode`: that field is `undefined` for
                      // `default` and every range code, and `kt.string(undefined)` renders the bare token
                      // `null`, which is not assignable to this non-nullable annotation element.
                      kt.string(response.statusKey),
                    ),
```

- [ ] **Step 8: Run the Kotlin test and watch it pass**

Run: `deno test -A packages/kotlin/src/generators/services/spring-controllers/`
Expected: PASS, all four cases.

- [ ] **Step 9: Regenerate tier 2**

```bash
deno task test:output
git diff --stat test/output | tail -3
```

Expected: only `spring-controllers@*` files change, and **only** where a response key was not an exact numeric code.
An exact code rendered `"200"` before and after, so those lines must be untouched. Confirm no `null` survives and
nothing else moved:

```bash
git diff test/output | grep "^[-+].*responseCode" | sort | uniq -c
grep -rn "responseCode = null" test/output | wc -l
```

Expected: the second command prints `0`. Then `deno task test:output:check` must pass.

- [ ] **Step 10: Regenerate tier 3**

```bash
deno task test:compile
```

Docker, foreground, propagate the exit code.

Expected: every `Null cannot be a value of a non-null type 'String'.` diagnostic disappears across all four
`spring-controllers` variants — the register records 28 occurrences on `v3/response-variants` plus 1 per variant on
`integration/kitchen-sink`. Confirm:

```bash
grep -rn "Null cannot be a value" test/compile | wc -l
```

Expected: `0`. Then `deno task test:compile:check` must pass.

- [ ] **Step 11: Commit**

```bash
deno fmt --check && deno lint
git add packages/core/src/transform packages/kotlin/src/generators/services/spring-controllers test/output test/compile
git commit -m "fix(kotlin): emit the spec's response key as responseCode instead of null"
```

---

### Task 5: Verify the gate, update the register, and prove phase-6 readiness

**Files:**

- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Interfaces:**

- Consumes: all four fixes from Tasks 1-4.
- Produces: nothing. This is the phase's verification and bookkeeping task.

- [ ] **Step 1: Confirm every phase-6 target now compiles the kitchen-sink**

This is the whole point of the plan, so assert it directly:

```bash
ls test/compile/kotlin/*/integration/kitchen-sink.txt 2>&1
```

Expected: no such files — every one of the seven that existed at the start of this plan is gone. Enumerate what remains
under `test/compile/` and confirm each surviving diagnostic belongs to a defect this plan did **not** schedule (the
register names them: 23, 25, 29, 30, 31 among others). Report the before/after count:

```bash
find test/compile -name "*.txt" | wc -l
```

It was **156** before this plan. Report the new number and account for the difference.

- [ ] **Step 2: Run the full gate**

```bash
deno fmt --check
deno lint
deno task test
deno task test:output:check
deno task test:integration:check
deno task test:compile:check
```

Expected: all pass. Report each result with its counts. Baselines before this plan, for comparison: `deno task test`
192 passed / 2287 steps; tier 2 18 passed / 887 steps; tier 4 3 passed; tier 3 16 passed / 844 steps.

**`deno task test:integration:check` must pass with zero changes to `test/wire/**`.** All four defects are Kotlin and
tier 4 currently covers only the TypeScript `fetch-clients` target, so a changed wire artifact means something
unintended happened. Confirm with `git status --short test/wire` — expect no output.

- [ ] **Step 3: Update the four register entries**

In `2026-07-25-generator-bug-fixes.md`, for each of defects 19, 26, 27 and 28:

- Change the heading suffix from `not scheduled` to `fixed by <short SHA>`, keeping the rest of the heading intact.
- Add a `**Fixed:**` element at the end of the entry, matching the style of the existing `**Compile gate:**` elements,
  naming the commit, the one-sentence mechanism of the fix, and the diagnostic count it drove to zero.
- Keep the diagnosis prose as it stands. It is the record of what was found; do not rewrite history to read as though
  the fix were always obvious.

For defect 19 also note that `statusKey` was added to `ApiResponse` and that this makes `default`, `2XX`, `4XX`, `5XX`
and `'0'` distinguishable — the entry's secondary complaint, now also closed.

**Verify every claim you write by opening the file and line you cite.** A wrong citation in this register is a finding.

- [ ] **Step 4: Register the two new observations this plan surfaced**

Add to the `### Also registered, not scheduled` section:

- **`kt.string(undefined)` silently renders the bare token `null`.** `KtString.onWrite`
  (`packages/kotlin/src/ast/nodes/string.ts:43-45`) branches on `this.value === null` and appends `null`
  unconditionally, with no branch that omits the argument or throws. This is how defect 19 stayed invisible until a
  compile gate existed: a generator passing an `undefined` through `kt.string` produces syntactically valid but
  semantically wrong Kotlin. Defect 19 fixed its own caller; the footgun remains for every other caller. A fix needs to
  decide whether a null-valued `KtString` should throw at construction or render an empty string, and auditing existing
  callers is part of that decision.
- **`ApiResponse.statusCode` remains lossy on purpose.** `Number(status) || undefined`
  (`packages/core/src/transform/transform-endpoint.ts:206`) still maps `'0'` to `undefined` — this is **defect 38**,
  which stays open. `statusKey`, added by defect 19's fix, is the non-lossy field; anything that needs to emit or
  distinguish a response key must read it. Cross-reference defect 38.

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint
git add docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: record the four generator fixes that unblocked tier 4"
```

---

## Out of scope, recorded rather than dropped

- **Every other registered defect.** 23, 25, 29, 30, 31 and the rest stay open. This plan fixes only what blocks a
  phase-6 target from compiling the kitchen-sink, because that is what tier 4 needs to run. Widening it would turn a
  four-mechanism plan into a generator-quality project.
- **Defect 38** (`Number(status) || undefined` maps `'0'` to `undefined`). Task 4 makes it harmless for the one
  generator that needed the key, and Task 5 records that; the lossy field itself is unchanged.
- **`KtString.onWrite`'s `null` rendering.** Registered in Task 5, not fixed — see the reasoning in Task 4.
- **The `'parameter'` serializer path.** No corpus profile uses it, so nothing here shows the `ApiClient` base's
  parameter order is right or wrong. Task 2 fixes the subclass to match the base rather than reordering the base blind.
- **Whether Spring 7 needs the `Any` bound.** Task 1 makes the constraint unconditional, which is known to satisfy both
  lines as they stand. The gate cannot settle whether Boot 4 strictly requires it, and it does not matter: emitting it
  compiles on both.
- **Phase 6 itself.** The container drivers, the Gradle `run` protocol, the Spring Boot app with handwritten delegates,
  and `diffResponse` all belong to phase 6's own plan.

## Halt conditions

Report BLOCKED rather than working around any of these:

- A tier-2 snapshot changes outside the profile the task's mechanism predicts. That means the fix has a wider blast
  radius than the register's diagnosis, and the diagnosis needs revisiting before the fix lands.
- Any file under `test/wire/**` changes.
- `DateTimeFeature` does not resolve against the Jackson 3 jars on the classpath (Task 3, Step 7). Report the exact
  diagnostic.
- A diagnostic the task was supposed to eliminate survives. It is either a second defect the gate was masking or an
  incomplete fix; say which, and do not commit a partial fix as complete.
- A fix requires changing `test/harness` or any tier-4 code. All four defects are in `packages/`; needing to touch the
  harness means the mechanism has been misread.

## Self-review

**Coverage.** Four blocking defects, four fix tasks, one verification task. Each task names the register entry that is
its authority, the exact file and line to change, the unit test that pins the behaviour, the tier-2 blast radius to
expect, and the tier-3 diagnostic count to drive to zero. The commit shape the owner chose — fix plus regenerated
output together, one commit per defect — is enforced by each task's final step.

**Placeholder scan.** No TBDs. Three steps deliberately produce a measurement rather than transcribe one, and each
names its command and what either result means: Task 3 Step 7 is the authority on the Jackson 3 name and lists the two
plausible alternatives to report if it fails; Task 4 Step 4 says what to do if another fixture constructs an
`ApiResponse` (add the field, do not make it optional); Task 5 Step 1 asks for a before/after diagnostic count and
requires the difference to be accounted for. Task 4 Step 1 points at the existing tests it must sit beside and says to
match their construction style rather than inventing a second one, because those tests already build the specs this
behaviour needs.

**Type consistency.** `statusKey: string` is defined once in Task 4's `api-types.ts` change and consumed under that
exact name by `transform-endpoint.ts`, both test files, and `spring-controller-generator.ts`.
`getClientDelegateArguments(serializerAsParameter: boolean): string[]` is defined and consumed only within Task 2.
`dateTimeFeature: KtReferenceFactory` is defined in Task 3's `jackson.ts` change and consumed by its test and by
`okhttp3-clients-generator.ts`. `getApiInterfaceEndpointMethodAnnnotations` is spelled with three `n`s throughout,
matching the existing method name.
