# Tier 4, Phase 6a: Kotlin Client Targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the generated `okhttp3-clients` and `spring-reactive-web-clients` Kotlin code against the existing
reference server from inside the `kotlin` Docker container, recording every wire deviation as a committed artifact.

**Architecture:** The reference server stays in-process on the host but binds an interface a container can reach. A
synthesized Gradle build compiles the committed output tree together with one handwritten Kotlin driver per client
family and runs it; the driver prints one sentinel-prefixed JSON line per case, which the harness parses out of
Gradle's output and compares with `diffRequest`/`diffResult` exactly as tier 4's `fetch-clients` target already does.

**Tech Stack:** Deno, Docker, Kotlin 2.2 / Gradle 8.14 (JDK 21), okhttp3 4.12, Spring WebFlux (Boot 3.5.6 and 4.0.0
lines), Jackson 2 and 3.

## Why this phase is split

Phase 6 originally covered three targets. The server direction (`spring-controllers`) needs a running Spring Boot
application, host-reachable port mapping, health polling, a response-side diff the harness does not have, and
handwritten delegates in two shapes — entirely different machinery from the client direction. It is **phase 6b**, and
this plan deliberately precedes it: 6a proves the containerized driver protocol against targets that reuse the existing
`diffRequest`, so 6b builds the response side on machinery already validated. This is the same sequencing that made
phase 5 precede all container work, which paid off twice.

## What already exists, and what this plan must add

Tier 4 works today for one target: [`test/integration/fetch-clients/`](../../../test/integration/fetch-clients) drives a
generated TypeScript client in a Deno subprocess. `diffRequest`, `diffResult`, `formatDeviations`, `startRefServer`,
`verifyWireDeviations`, `wireSnapshotFile` and the case table are all in place and unchanged by this plan.

Four gaps stand between that and a Kotlin target. Each is verified, not assumed:

| Gap | Evidence | Task |
| --- | --- | --- |
| `startRefServer` binds loopback only, so no container can reach it | `test/harness/ref-server.ts:51` — `hostname: '127.0.0.1'` | 1 |
| `runContainer` cannot override the image entrypoint, which is hardcoded to `compileKotlin` | `test/docker/kotlin/Dockerfile` last line; `dockerRunArgs` has no `--entrypoint` | 2 |
| The warm dependency cache holds compile-time coordinates only; the image runs `--offline`, so a driver calling a `suspend fun` cannot start | `test/docker/kotlin/warmup/build.gradle.kts` warms no `kotlinx.*` — its own comment records removing `kotlinx-coroutines-reactor` as unused *for compilation* | 3 |
| The tier-4 orphan sweep hardcodes one profile | `test/integration-tests/orphans.test.ts` — `const PROFILE = 'fetch-clients'` | 7 |

## Global Constraints

- **Only Deno and Docker are prerequisites.** Everything Kotlin runs inside the `kotlin` image.
- **No production code under `packages/` may change.** Every generator defect this phase finds is registered and left;
  a fix would change generated output and break byte-exact tier-2 snapshots. Registering goes in
  `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`.
- **Tier 4 imports the committed generated tree, never a freshly generated one** — what runs must be byte-identical to
  what was reviewed. Mount `test/output` read-only, as tier 3 does.
- **The reference server may bind `0.0.0.0` only while a containerized run is in progress.** The owner authorised this
  specific relaxation of the previous "loopback only" rule. In-process callers keep the loopback default; nothing may
  make `0.0.0.0` the default.
- **A deviation artifact means "the generated client differs from the declared table", not "generator defect".** Word
  every artifact and report that way. The scope of what tier 4 proves is stated in
  `test/integration/oracles.test.ts`'s class doc comment — read it and stay consistent with it.
- `test/harness` is linted under JSR rules: **every exported symbol needs an explicit type annotation** or `deno lint`
  fails `no-slow-types`.
- One top-level `describe` per exported symbol, colocated as `<symbol-file>.test.ts`.
- `deno fmt --check` and `deno lint` must both pass before every commit.
- **Never run `git checkout -- <path>` to restore a file.** `core.autocrlf=true` here rewrites it CRLF, which still
  matches `git hash-object` but then fails `deno fmt --check`. This has bitten five agents across the last two phases.
  Use `git show HEAD:<path> > <path>` and verify with `grep -c $'\r' <path>` (expect 0).
- Do not end a verification command with `tail` and then report its exit code — run each in the foreground with a real
  timeout and propagate the exit code.
- **Any commit that changes a file cited by the defect register must re-audit those citations.** A line insertion
  silently rots them; this bit five times in phase 5b. The audit script is in Task 7.

## Commands

```
deno task test                    # tiers 1+2
deno task test:integration        # tier 4, write mode
deno task test:integration:check  # tier 4, check mode
deno task test:compile:check      # tier 3, Docker — must stay green; this plan must not disturb it
```

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `test/harness/ref-server.ts` | gains a `hostname` option and exposes `port` | 1 |
| `test/harness/docker.ts` | gains an `entrypoint` option | 2 |
| `test/docker/kotlin/warmup/build.gradle.kts` | warms the two coroutine coordinates a driver needs at runtime | 3 |
| `test/harness/kotlin/dependencies.ts` | **new** — the `DEPENDENCIES`/`BOM` tables, moved here so tiers 3 and 4 share one list | 4 |
| `test/compile-tests/runners/kotlin.ts` | imports the tables instead of declaring them | 4 |
| `test/integration/kotlin-clients/build.ts` | **new** — synthesizes the driver Gradle build | 5 |
| `test/integration/kotlin-clients/drivers/OkHttp3Driver.kt` | **new** — handwritten driver, okhttp3 family | 6 |
| `test/integration/kotlin-clients/drivers/ReactiveDriver.kt` | **new** — handwritten driver, spring-reactive-web family | 6 |
| `test/integration/kotlin-clients/integration.test.ts` | **new** — runs both families, records deviations | 6 |
| `test/wire/{okhttp3-clients,spring-reactive-web-clients}@*/…` | **new, generated** — committed deviation artifacts | 6 |
| `test/integration-tests/orphans.test.ts` | loops a target registry instead of one hardcoded profile | 7 |
| `test/README.md`, `deno.json`, `.gitattributes` | tier-4 docs, tasks, generated-file attributes | 7 |

---

### Task 1: Let the reference server bind a container-reachable interface

**Files:**

- Modify: `test/harness/ref-server.ts`
- Test: `test/harness/ref-server.test.ts`

**Interfaces:**

- Produces: `startRefServer(cases: ApiCase[], options?: { hostname?: string }): Promise<RefServer>`, and `RefServer`
  gains `port: number`. `baseUrl` keeps its current meaning — the loopback origin — so every existing caller is
  unaffected.

The server currently binds `hostname: '127.0.0.1'` (`ref-server.ts:51`). A container reaching
`host.docker.internal` arrives on the host's bridge address, which a loopback-only listener never accepts.

**The owner authorised binding `0.0.0.0`, but only for containerized runs.** Loopback stays the default. Expose `port`
so a containerized caller can build its own origin; do not add a second URL field, because a `hostname` of `0.0.0.0` is
not a usable origin and a field holding it would invite exactly that mistake.

- [ ] **Step 1: Write the failing tests**

Add to `test/harness/ref-server.test.ts`, inside the existing `describe('startRefServer', …)`:

```ts
  it('binds loopback by default', async () => {
    const server = await startRefServer([]);
    try {
      expect(server.baseUrl).toBe(`http://127.0.0.1:${server.port}`);
    } finally {
      await server.close();
    }
  });

  // Containerized drivers reach the host through `host.docker.internal`, which resolves to the bridge
  // address, not loopback — so a loopback-only listener refuses them. Binding every interface is scoped
  // to those runs and must never become the default.
  it('can bind every interface for a containerized driver', async () => {
    const server = await startRefServer([], { hostname: '0.0.0.0' });
    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/pets/unmatched`);
      await response.body?.cancel();

      // 418 is the server's "no case matched this route" answer, so reaching it at all proves the
      // listener accepted a connection that a loopback-only bind would also have accepted — what this
      // pins is that passing a hostname does not break serving.
      expect(response.status).toBe(418);
    } finally {
      await server.close();
    }
  });
```

- [ ] **Step 2: Run them and watch the first fail**

Run: `deno test -A test/harness/ref-server.test.ts`
Expected: the `port` test FAILS (`server.port` is `undefined`); the second fails to type-check on the options argument.

- [ ] **Step 3: Implement**

In `ref-server.ts`, add to the `RefServer` type:

```ts
  /** The bound port. A containerized driver builds its own origin from this. */
  port: number;
```

Change the signature and the `Deno.serve` call:

```ts
export function startRefServer(
  cases: ApiCase[],
  options: { hostname?: string } = {},
): Promise<RefServer> {
```

```ts
  const server = Deno.serve({ hostname: options.hostname ?? '127.0.0.1', port: 0, onListen: () => {} }, …
```

and in the returned object, beside `baseUrl`:

```ts
  const port = (server.addr as Deno.NetAddr).port;
```

then `port,` and `baseUrl: \`http://127.0.0.1:${port}\`,`.

**`baseUrl` stays loopback even when `hostname` is `0.0.0.0`.** That is deliberate: `0.0.0.0` is a bind address, not a
destination, and every in-process caller wants loopback. Add a one-sentence comment saying so.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `deno test -A test/harness/ref-server.test.ts`
Expected: PASS. Then `deno test -A test/harness test/integration` — expected PASS, proving no existing caller broke.

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint
git add test/harness/ref-server.ts test/harness/ref-server.test.ts
git commit -m "test(harness): let the reference server bind a container-reachable interface"
```

---

### Task 2: Let `runContainer` override the image entrypoint

**Files:**

- Modify: `test/harness/docker.ts`
- Test: `test/harness/docker.test.ts`

**Interfaces:**

- Produces: `RunContainerOptions` gains `entrypoint?: string`, emitted as `--entrypoint <value>` before the image name.

The `kotlin` image's last line is `ENTRYPOINT ["gradle", "--no-daemon", "--offline", "--parallel", "--continue",
"compileKotlin"]`. `options.args` are appended *after* the image, so they become arguments to that entrypoint — passing
`['run']` would run `compileKotlin run`, dragging `--continue` and `--parallel` into a task that must fail loudly and
run once. Overriding the entrypoint is the clean way in, and it leaves tier 3 untouched.

- [ ] **Step 1: Write the failing test**

`docker.test.ts` already tests `dockerRunArgs` without Docker present — read it and match its style. Add:

```ts
  it('overrides the image entrypoint when one is given', () => {
    const args = dockerRunArgs({ image: 'img', entrypoint: 'gradle', args: ['run'] });

    // Before the image name, or Docker reads it as a container argument.
    expect(args.slice(0, 3)).toEqual(['run', '--rm', '--entrypoint']);
    expect(args[3]).toBe('gradle');
    expect(args.slice(-2)).toEqual(['img', 'run']);
  });

  it('omits the flag when no entrypoint is given', () => {
    expect(dockerRunArgs({ image: 'img' })).not.toContain('--entrypoint');
  });
```

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/docker.test.ts`
Expected: FAIL — `entrypoint` is not a known option (type error), or the flag is absent.

- [ ] **Step 3: Implement**

Add to `RunContainerOptions`, beside `args`:

```ts
  /**
   * Replaces the image's `ENTRYPOINT`.
   *
   * The `kotlin` image pins `gradle … compileKotlin` for tier 3, so tier 4 — which needs a different
   * task and none of `--continue`/`--parallel` — has to replace it rather than append to it.
   */
  entrypoint?: string;
```

In `dockerRunArgs`, immediately after the `--name` block:

```ts
  if (options.entrypoint !== undefined) args.push('--entrypoint', options.entrypoint);
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `deno test -A test/harness/docker.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint
git add test/harness/docker.ts test/harness/docker.test.ts
git commit -m "test(harness): let runContainer override the image entrypoint"
```

---

### Task 3: Warm the coroutine coordinates a Kotlin driver needs at runtime

**Files:**

- Modify: `test/docker/kotlin/warmup/build.gradle.kts`

**Interfaces:**

- Consumes: nothing. Produces: a `kotlin` image whose warm cache covers `kotlinx-coroutines-core` and
  `kotlinx-coroutines-reactor` on both Spring Boot lines.

The image runs Gradle `--offline`, so anything missing from the warm cache fails at resolution rather than downloading.
The warmup currently holds compile-time coordinates only, and its own comment records that `kotlinx-coroutines-reactor`
was **removed** because compilation does not need it — `awaitBody`/`awaitExchange` are Spring WebFlux's own Kotlin
extensions, shipped inside `spring-webflux`.

**Runtime is different, and that is the whole point of this task.** A driver has to (a) enter a coroutine from `main`,
which needs `runBlocking` from `kotlinx-coroutines-core`, and (b) let WebFlux's `await*` extensions bridge a Reactor
publisher into a suspension, which needs `kotlinx-coroutines-reactor`. Neither is on the compile classpath today.

- [ ] **Step 1: Read the warmup file's header comment in full before editing**

It documents, at length, that this coordinate list is hand-maintained in parallel with `kotlin.ts`'s `DEPENDENCIES`
table and that drift has already caused a verified offline-resolution failure. Task 4 reduces that from three places to
two; this task must keep the two in step.

Note the structural rule the comment states: coordinates shared by both Spring Boot lines go in the `for
(configurationName in listOf("sb3", "sb4"))` loop; a coordinate that only one line's BOM manages must be added **after**
the loop, against that one configuration. Both coroutine artifacts are managed by neither BOM, so they need **explicit
versions** and belong in the loop.

- [ ] **Step 2: Add the two coordinates**

Inside the `for (configurationName in listOf("sb3", "sb4"))` loop, after the existing `add(...)` calls:

```kotlin
        // Runtime-only, and deliberately absent from the compile-time list above: a tier-4 driver enters
        // a coroutine from `main` via `runBlocking` (coroutines-core) and WebFlux's `awaitBody`/
        // `awaitExchange` bridge a Reactor publisher into a suspension at run time (coroutines-reactor).
        // Neither BOM manages these, so both carry an explicit version.
        add(configurationName, "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
        add(configurationName, "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")
```

- [ ] **Step 3: Rebuild the image and prove the cache covers them**

The image tag derives from a content hash of the Dockerfile and its context, so editing the warmup produces a new tag
and `buildImage` rebuilds automatically. Force it now rather than discovering a resolution failure inside Task 6:

```bash
deno task test:compile:check
```

Expected: PASS, 16 passed / 844 steps, with an image rebuild at the start (slower than the ~2 min warm run). Tier 3
does not use the new coordinates, so **its result must be unchanged** — that is what makes this a safe cache addition.
Report the rebuild time and the tier-3 result.

**If `RUN gradle warm` fails during the rebuild, report BLOCKED with the exact Gradle error.** The most likely cause is
a version that neither BOM manages and Maven Central does not have under that exact coordinate; do not try successive
version guesses — report what Gradle said.

- [ ] **Step 4: Commit**

```bash
git add test/docker/kotlin/warmup/build.gradle.kts
git commit -m "test(docker): warm the coroutine coordinates a tier-4 Kotlin driver needs"
```

---

### Task 4: Give tiers 3 and 4 one dependency table instead of two

**Files:**

- Create: `test/harness/kotlin/dependencies.ts`
- Create: `test/harness/kotlin/mod.ts`
- Modify: `test/harness/mod.ts`
- Modify: `test/compile-tests/runners/kotlin.ts`
- Test: `test/harness/kotlin/dependencies.test.ts`

**Interfaces:**

- Produces, exported from `@goast/test-harness`:
  - `type DependencySet = { shared: string[]; sb3?: string[]; sb4?: string[] }`
  - `const KOTLIN_DEPENDENCIES: Readonly<Record<string, DependencySet>>`
  - `const KOTLIN_BOM: Readonly<Record<'sb3' | 'sb4', string>>`
  - `function kotlinDependenciesFor(family: string, variant: 'sb3' | 'sb4'): string[]` — `shared` plus the variant
    slot, throwing a named error for an unknown family.

`DEPENDENCIES` and `BOM` currently live inside `test/compile-tests/runners/kotlin.ts` (`:144` and `:234`). Task 5 needs
the same coordinates for the driver build. Copying them would make the drift problem worse — the warmup's own comment
records this list being hand-maintained in three places, with a verified failure when it drifted. Move it instead, so
tier 3 and tier 4 read one table and only the warmup remains separate.

**Move the comments with the code.** They record measured facts — which profiles import `jakarta.validation`, why
`okhttp3-clients@sb4` is the only Jackson 3 profile, why `kotlinx-coroutines-reactor` is absent from the compile list.
Losing them would discard the evidence behind every coordinate.

- [ ] **Step 1: Write the failing test**

Create `test/harness/kotlin/dependencies.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { kotlinDependenciesFor, KOTLIN_BOM, KOTLIN_DEPENDENCIES } from './dependencies.ts';

describe('KOTLIN_DEPENDENCIES', () => {
  it('covers every Kotlin profile family the corpus generates', () => {
    expect(Object.keys(KOTLIN_DEPENDENCIES).sort()).toEqual(
      ['models', 'okhttp3-clients', 'spring-controllers', 'spring-reactive-web-clients'],
    );
  });
});

describe('KOTLIN_BOM', () => {
  it('pins one platform per Spring Boot line', () => {
    expect(KOTLIN_BOM.sb3).toContain('spring-boot-dependencies:3.5.6');
    expect(KOTLIN_BOM.sb4).toContain('spring-boot-dependencies:4.0.0');
  });
});

describe('kotlinDependenciesFor', () => {
  it('appends the variant slot to the shared list', () => {
    const sb3 = kotlinDependenciesFor('okhttp3-clients', 'sb3');
    const sb4 = kotlinDependenciesFor('okhttp3-clients', 'sb4');

    // The one profile in the corpus generated against Jackson 3 — the sole reason variant slots exist.
    expect(sb3.some((d) => d.includes('com.fasterxml.jackson.module:jackson-module-kotlin'))).toBe(true);
    expect(sb4.some((d) => d.includes('tools.jackson.module:jackson-module-kotlin'))).toBe(true);
    expect(sb3.length).toBe(sb4.length);
  });

  it('returns only the shared list for a family with no variant slots', () => {
    expect(kotlinDependenciesFor('models', 'sb3')).toEqual(kotlinDependenciesFor('models', 'sb4'));
  });

  it('names the unknown family and where to add it', () => {
    expect(() => kotlinDependenciesFor('nope', 'sb3')).toThrow('nope');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/kotlin/`
Expected: FAIL — `./dependencies.ts` does not exist.

- [ ] **Step 3: Move the tables**

Create `test/harness/kotlin/dependencies.ts`. Cut `DependencySet`, `DEPENDENCIES` and `BOM` out of
`test/compile-tests/runners/kotlin.ts` — **with every comment** — and export them under the names above. Add:

```ts
export function kotlinDependenciesFor(family: string, variant: 'sb3' | 'sb4'): string[] {
  const set = KOTLIN_DEPENDENCIES[family];
  if (set === undefined) {
    throw new Error(
      `No dependency set for Kotlin profile family "${family}". Add one to KOTLIN_DEPENDENCIES in ` +
        `test/harness/kotlin/dependencies.ts.`,
    );
  }
  return [...set.shared, ...(set[variant] ?? [])];
}
```

Every export needs an explicit type annotation — this package is linted under JSR rules. Create
`test/harness/kotlin/mod.ts` with `export * from './dependencies.ts';` and add `export * from './kotlin/mod.ts';` to
`test/harness/mod.ts`.

In `kotlin.ts`, import from `@goast/test-harness` and replace the two use sites (around `:417` and `:437`) with
`kotlinDependenciesFor(family, variant)` and `KOTLIN_BOM[variant]`. Keep its existing error behaviour for an unknown
family — the new function throws a message naming the family, which is what its old check did.

- [ ] **Step 4: Run the tests and prove tier 3 is unchanged**

```bash
deno test -A test/harness/kotlin/
deno task test
deno task test:compile:check
```

Expected: all PASS, tier 3 at 16 passed / 844 steps and **no change under `test/compile/`**. A refactor that alters one
generated diagnostic has changed a dependency, not just its location — confirm with `git status --short test/compile`
(expect no output) and report it.

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint
git add test/harness/kotlin test/harness/mod.ts test/compile-tests/runners/kotlin.ts
git commit -m "test(harness): share one Kotlin dependency table between tiers 3 and 4"
```

---

### Task 5: Synthesize the driver Gradle build

**Files:**

- Create: `test/integration/kotlin-clients/build.ts`
- Test: `test/integration/kotlin-clients/build.test.ts`

**Interfaces:**

- Consumes: `kotlinDependenciesFor`, `KOTLIN_BOM` from Task 4.
- Produces:
  - `type DriverUnit = { id: string; profile: string; family: string; variant: 'sb3' | 'sb4'; treePath: string; driver: string }`
  - `const DRIVER_UNITS: readonly DriverUnit[]` — the four units this phase drives.
  - `function synthesizeDriverBuild(unit: DriverUnit, treeMount: string, driverMount: string): { settings: string; build: string }`
  - `const CASE_LINE_PREFIX: string` — `'##GOAST-CASE##'`.
  - `function parseCaseLines(output: string): { caseId: string; result: unknown }[]`

One Gradle project per unit, run one at a time. Not one multi-project build as tier 3 uses: tier 3 wants every unit
compiled in a single invocation with `--continue`, whereas each driver here has to *run*, produce its own stdout, and
fail loudly on its own.

The four units:

```ts
export const DRIVER_UNITS: readonly DriverUnit[] = [
  {
    id: 'okhttp3-clients@sb3',
    profile: 'okhttp3-clients@sb3',
    family: 'okhttp3-clients',
    variant: 'sb3',
    treePath: 'kotlin/okhttp3-clients@sb3/integration/kitchen-sink',
    driver: 'OkHttp3Driver.kt',
  },
  {
    id: 'okhttp3-clients@sb4',
    profile: 'okhttp3-clients@sb4',
    family: 'okhttp3-clients',
    variant: 'sb4',
    treePath: 'kotlin/okhttp3-clients@sb4/integration/kitchen-sink',
    driver: 'OkHttp3Driver.kt',
  },
  {
    id: 'spring-reactive-web-clients@sb3',
    profile: 'spring-reactive-web-clients@sb3',
    family: 'spring-reactive-web-clients',
    variant: 'sb3',
    treePath: 'kotlin/spring-reactive-web-clients@sb3/integration/kitchen-sink',
    driver: 'ReactiveDriver.kt',
  },
  {
    id: 'spring-reactive-web-clients@sb4',
    profile: 'spring-reactive-web-clients@sb4',
    family: 'spring-reactive-web-clients',
    variant: 'sb4',
    treePath: 'kotlin/spring-reactive-web-clients@sb4/integration/kitchen-sink',
    driver: 'ReactiveDriver.kt',
  },
];
```

`treePath` is verified in Step 1 rather than trusted — a wrong path yields an empty source set and a driver that fails
to compile against nothing, which reads like a driver bug.

- [ ] **Step 1: Confirm every tree path exists before writing anything**

```bash
for p in kotlin/okhttp3-clients@sb3 kotlin/okhttp3-clients@sb4 \
         kotlin/spring-reactive-web-clients@sb3 kotlin/spring-reactive-web-clients@sb4; do
  ls -d "test/output/$p/integration/kitchen-sink" || echo "MISSING $p"
done
```

Expected: four directories, no `MISSING`. Report the generated client class names you find under each
`.../api/client/` — the drivers in Task 6 need them, and `okhttp3-clients` and `spring-reactive-web-clients` do **not**
use the same shape (the reactive family generates `…Requests.kt` extension functions on `WebClient`, not client
classes).

- [ ] **Step 2: Write the failing test**

Create `test/integration/kotlin-clients/build.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { CASE_LINE_PREFIX, DRIVER_UNITS, parseCaseLines, synthesizeDriverBuild } from './build.ts';

describe('DRIVER_UNITS', () => {
  it('drives both client families on both Spring Boot lines', () => {
    expect(DRIVER_UNITS.map((u) => u.id)).toEqual([
      'okhttp3-clients@sb3',
      'okhttp3-clients@sb4',
      'spring-reactive-web-clients@sb3',
      'spring-reactive-web-clients@sb4',
    ]);
  });
});

describe('synthesizeDriverBuild', () => {
  it('sources the committed tree and the driver, and nothing else', () => {
    const { build } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(build).toContain('/output/kotlin/okhttp3-clients@sb3/integration/kitchen-sink');
    expect(build).toContain('/drivers/OkHttp3Driver.kt');
  });

  it('applies the variant BOM and the family dependencies', () => {
    const sb4 = synthesizeDriverBuild(DRIVER_UNITS[1], '/output', '/drivers').build;

    expect(sb4).toContain('spring-boot-dependencies:4.0.0');
    // The Jackson 3 module, which only this variant uses.
    expect(sb4).toContain('tools.jackson.module:jackson-module-kotlin');
  });

  it('makes the driver runnable with a fixed main class', () => {
    const { build } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(build).toContain('application');
    expect(build).toContain('MainKt');
  });
});

describe('parseCaseLines', () => {
  it('takes only the sentinel-prefixed lines, ignoring Gradle noise', () => {
    const output = [
      '> Task :compileKotlin',
      `${CASE_LINE_PREFIX}{"caseId":"getPet/ok","result":{"id":"abc"}}`,
      'Downloading nothing, offline',
      `${CASE_LINE_PREFIX}{"caseId":"deletePet/noContent","result":{"status":204}}`,
      'BUILD SUCCESSFUL in 4s',
    ].join('\n');

    expect(parseCaseLines(output)).toEqual([
      { caseId: 'getPet/ok', result: { id: 'abc' } },
      { caseId: 'deletePet/noContent', result: { status: 204 } },
    ]);
  });

  it('throws on a sentinel line that is not valid JSON rather than dropping it', () => {
    expect(() => parseCaseLines(`${CASE_LINE_PREFIX}{oops`)).toThrow(CASE_LINE_PREFIX);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `deno test -A test/integration/kotlin-clients/`
Expected: FAIL — `./build.ts` does not exist.

- [ ] **Step 4: Implement**

Create `test/integration/kotlin-clients/build.ts`. The `settings.gradle.kts` is a single-line
`rootProject.name = "driver"`. The `build.gradle.kts` must:

- apply `kotlin("jvm") version "2.2.0"` and `application`;
- `repositories { mavenCentral() }` — never resolved, because the container runs `--offline`, but Gradle requires a
  repository to be declared;
- add `implementation(platform("<KOTLIN_BOM[variant]>"))` and every line from
  `kotlinDependenciesFor(unit.family, unit.variant)`;
- add the two runtime coroutine coordinates Task 3 warmed, with the same explicit versions;
- set `sourceSets["main"].kotlin.srcDirs(...)` to the mounted tree path **and** the driver file's directory;
- set `application { mainClass.set("MainKt") }`.

`CASE_LINE_PREFIX` is `'##GOAST-CASE##'`. `parseCaseLines` splits on newlines, keeps lines starting with the prefix,
`JSON.parse`es the remainder, and **throws** on a parse failure with the offending line in the message — a silently
dropped line would understate coverage, and the drift check in Task 6 would then fail with a confusing "case never
reported" instead of the real cause.

Because the driver source and the generated tree share one source set, the driver can call the generated API directly
with no import gymnastics — the generated code's own package is on the same classpath.

- [ ] **Step 5: Run the tests and watch them pass**

Run: `deno test -A test/integration/kotlin-clients/`
Expected: PASS, all six.

- [ ] **Step 6: Commit**

```bash
deno fmt --check && deno lint
git add test/integration/kotlin-clients
git commit -m "test: synthesize the tier-4 Kotlin driver build"
```

---

### Task 6: Write the drivers and record what they put on the wire

**Files:**

- Create: `test/integration/kotlin-clients/drivers/OkHttp3Driver.kt`
- Create: `test/integration/kotlin-clients/drivers/ReactiveDriver.kt`
- Create: `test/integration/kotlin-clients/integration.test.ts`
- Create (generated, by running the task): `test/wire/okhttp3-clients@sb3/*.txt` and the three sibling directories

**Interfaces:**

- Consumes: everything from Tasks 1-5, plus `casesFor`, `diffRequest`, `diffResult`, `formatDeviations`,
  `startRefServer`, `verifyWireDeviations`, `wireRootDir`, `wireSnapshotFile`.

Each driver is one Kotlin file with a `main` that reads the base URL from `System.getenv("GOAST_BASE_URL")`, calls each
operation with **hardcoded arguments in `casesFor(profile, 'client')` table order**, and prints one
`##GOAST-CASE##{"caseId":…,"result":…}` line per case.

**Table order is load-bearing.** The reference server queues cases per `(method, pathTemplate)` and consumes each queue
with `shift()`, so issuing out of order silently attributes a request to the wrong case. Two cases share `PUT /pets/{id}`.

**Arguments are hardcoded on purpose**, the same reasoning as the `fetch-clients` driver: writing
`client.getPet(id = "abc def")` in typed Kotlin *is* the assertion that the generated signature is usable. Reading
arguments from the table would need a reflection layer and would erase what is under test.

- [ ] **Step 1: Read the generated API before writing either driver**

The two families differ in shape, so do not assume one form:

```bash
sed -n '1,60p' test/output/kotlin/okhttp3-clients@sb3/integration/kitchen-sink/com/openapi/generated/api/client/PetsApiClient.kt
sed -n '1,60p' test/output/kotlin/spring-reactive-web-clients@sb3/integration/kitchen-sink/com/openapi/generated/api/client/PetsRequests.kt
```

Record in your report, for each family: the class or extension-function shape, the exact parameter lists, what a call
returns, and how a non-2xx surfaces (a thrown exception, or a value?). **Task 3 of phase 5 established that the case
table's `expectResult` values were written for the TypeScript client**, so they will very likely not match a Kotlin
return shape. Report what you find; do not silently reshape the table.

If `expectResult` genuinely cannot be satisfied for these targets, the resolution is a **per-case deviation artifact**,
not an edit to the shared table — the table is the contract three consumers read, and `fetch-clients` already agrees
with it. Say so in your report and let the deviation stand.

- [ ] **Step 2: Write the okhttp3 driver**

Create `test/integration/kotlin-clients/drivers/OkHttp3Driver.kt`. Structure:

```kotlin
// Drives the generated okhttp3 client against the reference server.
//
// Arguments are hardcoded rather than read from the case table: writing `getPet(id = "abc def")` in
// typed Kotlin *is* the assertion that the generated signature is usable. Emission order must match
// `casesFor('okhttp3-clients@…', 'client')`, because the reference server consumes one queue per
// (method, pathTemplate) in table order and two cases share `PUT /pets/{id}`.

import com.openapi.generated.api.client.PetsApiClient
// … the other generated clients

private const val PREFIX = "##GOAST-CASE##"

private fun emit(caseId: String, resultJson: String) = println("$PREFIX{\"caseId\":\"$caseId\",\"result\":$resultJson}")

fun main() {
    val baseUrl = System.getenv("GOAST_BASE_URL") ?: error("GOAST_BASE_URL is not set")
    val pets = PetsApiClient(basePath = baseUrl)
    // … one block per case, in table order
}
```

Build each `result` with the Jackson `ObjectMapper` the generated client already exposes, so the JSON shape matches what
`diffResult` compares. Wrap each call so a thrown exception becomes a reported result rather than killing the run — a
driver that dies at case 3 reports nothing for cases 4-19, which reads as nineteen deviations instead of one.

- [ ] **Step 3: Write the reactive driver**

Create `test/integration/kotlin-clients/drivers/ReactiveDriver.kt`, same contract. It differs in two ways: the
generated API is extension functions on `WebClient`, and every call is `suspend`, so `main` is

```kotlin
fun main() = runBlocking {
    // …
}
```

with `import kotlinx.coroutines.runBlocking` — the coordinate Task 3 warmed.

- [ ] **Step 4: Write the integration test**

Create `test/integration/kotlin-clients/integration.test.ts`. For each `DRIVER_UNITS` entry: start the reference server
with `{ hostname: '0.0.0.0' }`, write the synthesized build into a temp work dir, run the container with
`entrypoint: 'gradle'`, `args: ['--no-daemon', '--offline', 'run', '--quiet']`, `hostGateway: true`, and
`env: { GOAST_BASE_URL: \`http://host.docker.internal:${server.port}\` }`, mounting `test/output` read-only and the
drivers directory read-only. Then parse, diff, and write artifacts exactly as
`test/integration/fetch-clients/integration.test.ts` does — read that file and mirror its structure, including its
drift check (`reported` ids must equal the requested ids) and its surplus handling.

Guard the whole suite on Docker, the way tier 3 does: this must not run in the everyday `deno task test` loop. Use the
same env-var opt-in tier 3 uses (`GOAST_COMPILE` is tier 3's; introduce `GOAST_INTEGRATION` for tier 4 containers, which
phase 5's README already promised) and call `requireDocker()` before the first run.

- [ ] **Step 5: Run in write mode and read every artifact**

```bash
GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write deno test -A test/integration/kotlin-clients
```

Expected: PASS, with artifacts appearing under `test/wire/okhttp3-clients@sb3/` and its three siblings. **Read every
one.** For each, classify it in your report as (a) a real difference between the generated client and the declared table
— the expected outcome, and the thing this phase exists to find; (b) a mistake in your driver; or (c) a mistake in the
harness. Only (a) may be committed. Fix (b) and (c) and re-run.

Expect (a) to be common. Defect 45, registered in the previous phase, means both these families pick the success
response by declaration order — `getWidget` is safe, but its `default` response is why. Percent-encoding, `style` and
`explode` handling are untested territory for these generators.

- [ ] **Step 6: Confirm determinism**

```bash
GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check deno test -A test/integration/kotlin-clients
```

Run it twice. Expected: PASS both times, identical. A deviation set that changes between runs is a harness defect —
report it rather than committing a flaky artifact.

- [ ] **Step 7: Commit**

```bash
deno fmt --check && deno lint
git add test/integration/kotlin-clients test/wire
git commit -m "test: drive the generated Kotlin clients against the reference server"
```

---

### Task 7: Registry, sweep, tasks, docs, register

**Files:**

- Create: `test/integration/targets.ts`
- Modify: `test/integration-tests/orphans.test.ts`
- Modify: `deno.json`, `.gitattributes`, `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Interfaces:**

- Produces: `const WIRE_TARGETS: readonly { profile: string; direction: Direction }[]` in `test/integration/targets.ts`.

- [ ] **Step 1: Replace the hardcoded profile with a registry**

`test/integration-tests/orphans.test.ts` hardcodes `const PROFILE = 'fetch-clients'`, with a comment saying phases 6-7
turn it into a loop. It now must, because `findOrphanFiles` walks **all** of `test/wire/` against one profile's claims —
so the first `okhttp3-clients@sb3` artifact fails the sweep until this changes.

Create `test/integration/targets.ts` listing the five profiles tier 4 now covers (`fetch-clients` plus the four from
Task 5), each with its direction, and rewrite the sweep to build its expected set from every entry via
`casesFor(profile, direction)` and `wireSnapshotFile`. Keep filtering by `casesFor`, not the raw table — phase 5's
review established that mapping unfiltered `cases` lets a stale artifact survive for a case the driver never drives.

- [ ] **Step 2: Add the tasks**

In `deno.json`, beside the existing tier-4 entries:

```json
"test:integration:kotlin": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write deno test -A test/integration/kotlin-clients",
"test:integration:kotlin:check": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check deno test -A test/integration/kotlin-clients",
```

and extend `test:all` with `test:integration:kotlin:check`. Add `"test/wire/**"` to `fmt.exclude` and `lint.exclude` if
Task 8 of phase 5 did not already — check rather than assume.

- [ ] **Step 3: Mark the new artifacts as generated**

`.gitattributes` already carries `test/wire/** linguist-generated` and `test/wire/** -text` from phase 5, so the new
directories are covered. **Verify, do not assume** — phase 5's review proved this rule is load-bearing on Windows,
where without `-text` every artifact checks out CRLF and check mode fails:

```bash
git check-attr linguist-generated -text -- test/wire/okhttp3-clients@sb3/getPet__ok.txt
git ls-files --eol test/wire/ | grep -v "attr/-text" || echo "ALL -text"
```

- [ ] **Step 4: Document the tier-4 container targets**

In `test/README.md`'s tier-4 section: that `fetch-clients` needs no Docker and runs in the everyday loop, while the
Kotlin targets are container-based and gated behind `GOAST_INTEGRATION`; that the driver protocol is one
sentinel-prefixed JSON line per case parsed out of Gradle's output; why drivers hardcode their arguments; and that the
reference server binds `0.0.0.0` **only** for these runs, with the reason. Update the tier table and the layout block.

Keep the honesty section accurate: it already says an absent artifact means "no declared field deviated", not
"wire-correct". Add anything the Kotlin targets change about that.

- [ ] **Step 5: Register what tier 4 found**

Add a numbered entry for each confirmed generator defect from Task 6 Step 5, continuing from the register's highest
number (**44** at the time of writing — verify). Match the surrounding format, include a `**Tier 4:**` element citing
the committed artifact path, and **verify every citation by opening it**.

Then re-audit the register's citations, because Task 4 moved code out of `test/compile-tests/runners/kotlin.ts` and any
citation into it below the removal has shifted:

```bash
REG=docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git diff --name-only <this-plan's-base>..HEAD -- 'packages/**/*.ts' 'test/**/*.ts' | grep -v '\.test\.ts' | while read -r f; do
  b=$(basename "$f")
  grep -o "${b%.ts}\.ts:[0-9]\+\(-[0-9]\+\)\?" "$REG" | sort -u | while read -r cit; do
    n="${cit##*:}"; n="${n%%-*}"
    printf '%-44s %s\n' "$cit" "$(sed -n "${n}p" "$f" | sed 's/^[[:space:]]*//' | cut -c1-54)"
  done
done
```

Report the output and repair anything that no longer resolves to the construct its claim describes. Leave citations
inside diagnosis prose or code fences alone — those quote the pre-fix code deliberately.

- [ ] **Step 6: Full verification**

```bash
deno fmt --check
deno lint
deno task test
deno task test:output:check
deno task test:integration:check
deno task test:integration:kotlin:check
deno task test:compile:check
```

Expected: all pass. Report each with its counts. Baselines before this plan: `deno task test` 193 passed / 2306 steps;
tier 2 18 / 887; tier 4 (`fetch-clients`) 3 / 3; tier 3 16 / 844.

- [ ] **Step 7: Commit**

```bash
git add deno.json .gitattributes test/README.md test/integration/targets.ts test/integration-tests \
        docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: document the tier-4 Kotlin targets and register what they found"
```

---

## Out of scope, recorded rather than dropped

- **The server direction.** `spring-controllers` with handwritten delegates, `diffResponse`, container port mapping and
  health polling are **phase 6b**. Nothing here anticipates them beyond the target registry Task 7 introduces.
- **Fixing any generator defect this phase finds**, including defect 45, whose declaration-order-dependent response
  selection affects both families driven here. Registered and left; a fix changes generated output.
- **Response-header and response-body assertions.** The case table carries `response.headers`, but this phase compares
  the *request* plus the client's returned value, as `fetch-clients` does. A real response-side comparison arrives with
  `diffResponse` in 6b.
- **`wireSnapshotFile` has no direction segment.** Harmless here — all five profiles are client-direction, and
  `spring-controllers` appears only in the server direction — so a filename collision is impossible today. 6b should
  confirm that still holds before adding its own artifacts.
- **The three-place dependency list.** Task 4 reduces it to two (`dependencies.ts` and the warmup's
  `build.gradle.kts`). A genuinely machine-enforced single source needs Gradle's version-catalog mechanism, which the
  warmup's own comment explains is real infrastructure work, not a two-line fix.
- **Phases 7 and 8.** Angular, k6 and easy-network-stub targets; CI rework.

## Halt conditions

Report BLOCKED rather than working around any of these:

- `RUN gradle warm` fails while rebuilding the image (Task 3). Report the exact Gradle error; do not guess successive
  versions.
- A tier-3 diagnostic under `test/compile/` changes. Tasks 3 and 4 both touch shared Kotlin infrastructure and must
  leave tier 3 byte-identical; a changed diagnostic means a dependency changed, not just its location.
- The container cannot reach the reference server. Report what the driver's failure looked like and what
  `GOAST_BASE_URL` was set to — this is the one genuinely new piece of plumbing, and a wrong diagnosis here would send
  the next task chasing the wrong layer.
- A driver cannot call an operation because the generator emitted no method for it. Report which operation and what was
  emitted instead.
- A deviation set differs between two consecutive runs.
- Making a case pass requires changing production code under `packages/`, or editing the shared case table's
  `expectRequest`/`expectResult` to match a Kotlin return shape. The table is a contract three consumers read; a
  mismatch is a deviation artifact, not a table edit.

## Self-review

**Coverage.** Four verified gaps, four tasks that close them (1, 2, 3, 4), one that builds the driver machinery (5), one
that produces the actual evidence (6), and one that wires, documents and registers (7). Each task names the file and
line its claim rests on, and each ends with an independently reviewable deliverable.

**Placeholder scan.** No TBDs. Four steps deliberately produce a measurement rather than transcribe one, and each names
its command and what either result means: Task 5 Step 1 verifies the four tree paths exist and reports the generated
shapes, because the two families differ and the plan must not assume one; Task 6 Step 1 measures the Kotlin return
shape before the driver hardcodes it, and rules that a mismatch with `expectResult` becomes a deviation rather than a
table edit; Task 6 Step 5 classifies every artifact into difference, driver bug, or harness bug, and permits committing
only the first; Task 7 Step 5 re-audits register citations with the script that caught eight stale ones in the previous
phase.

**Type consistency.** `DriverUnit`, `DRIVER_UNITS`, `synthesizeDriverBuild`, `CASE_LINE_PREFIX` and `parseCaseLines` are
defined in Task 5 and consumed under those names by Task 6. `DependencySet`, `KOTLIN_DEPENDENCIES`, `KOTLIN_BOM` and
`kotlinDependenciesFor` are defined in Task 4 and consumed by Task 5 and by the existing tier-3 runner. `WIRE_TARGETS`
is defined in Task 7 and consumed only there. `startRefServer(cases, { hostname })` and `RefServer.port` come from
Task 1 and are used in Task 6; `entrypoint` comes from Task 2 and is used in Task 6.
