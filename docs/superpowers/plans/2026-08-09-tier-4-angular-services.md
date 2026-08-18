# Tier 4 `angular-services` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the generated `angular-services` client against the reference server inside the existing `node`
container, and commit one deviation artifact per case whose observable behaviour differs from the shared case table.

**Architecture:** This is phase 7a. Phase 7 in the spec covers three remaining TypeScript targets —
`angular-services`, `k6-clients`, `easy-network-stub` — and they share almost nothing beyond the case table, so each
gets its own plan. This one is the client direction again, structurally identical to phase 6a's Kotlin leg: a driver
with hardcoded call arguments runs in a container, reaches the in-process reference server on the host through
`host.docker.internal`, and prints one sentinel line per case. What is new is only the runtime — Angular services need
a dependency-injection context, and TypeScript needs compiling before Node can run it.

**Tech Stack:** Deno (harness, reference server, test driver), Docker (existing `node` image: `node:22-alpine` with
`typescript` 5.7.3, `@angular/core` and `@angular/common` 19.2.0, `rxjs`, `zone.js`), plus one added dependency.

## Global Constraints

- The repo may require **only Deno and Docker** as prerequisites. Every other toolchain lives in a container.
- **No production code under `packages/` may change.** Generated output is byte-snapshotted by tier 2. A generator
  defect found here is recorded in the register, never fixed here.
- **The committed tree is mounted read-only and never modified.** What runs must be compiled *from* byte-identical
  reviewed output. Emitting compiled JS to a separate writable directory is fine; rewriting anything under
  `test/output/` is not.
- **Tier 3 must keep exactly its current diagnostic count.** Verify before and after with
  `find test/compile -name "*.txt" | wc -l` (23 TypeScript + 44 Kotlin = **67** at the time of writing). Editing
  `test/docker/node/` changes the image content hash and so re-runs tier 3's TypeScript leg — that leg must stay green
  and its committed diagnostics byte-identical.
- **Deviations are committed as snapshots.** A case the generated client merely gets wrong produces a committed
  artifact under `test/wire/angular-services/`; it never becomes an `except` entry in `test/cases/cases.ts`. An
  **absent** artifact means "this case conforms", so anything that makes a case fail to be *measured* is a
  correctness bug in this phase, not a passing test.
- The reference server may bind `0.0.0.0` only while a containerized run is in progress (phase 6a's authorized
  relaxation, already implemented in `startRefServer`'s `hostname` option). Loopback stays the default.
- `test/harness` is JSR-published: every exported symbol needs an explicit type annotation or `deno lint` fails
  `no-slow-types`. This plan is not expected to add a harness export.
- `deno fmt --check` and `deno lint` must be clean at every commit.

---

## What the spike established, so no task has to rediscover it

Every statement below was measured against the real committed tree in the real `node` image before this plan was
written. A driver was compiled and run, reached a Deno server, and printed
`status: 200, body: {"id":"abc","name":"Rex"}`.

**1. The generated services need a real injection context.** `ApiBaseService`
(`test/output/typescript/angular-services/integration/kitchen-sink/utils/api-base-service.ts`) initializes fields with
`inject(ApiConfiguration)` and `inject(HttpClient)`, so a service cannot be constructed with `new`. `Injector.create`
is enough — no `TestBed`, no DOM, no `platform-browser-dynamic`. This provider set is proven to work:

```ts
Injector.create({
  providers: [
    { provide: ApiConfiguration, useFactory: () => { const c = new ApiConfiguration(); c.rootUrl = baseUrl; return c; }, deps: [] },
    { provide: NgZone, useFactory: () => new NgZone({}), deps: [] },
    { provide: FetchBackend, deps: [NgZone] },
    { provide: HttpHandler, useExisting: FetchBackend },
    { provide: HttpClient, deps: [HttpHandler] },
    { provide: PetsService, deps: [] },
    // …one entry per service the driver uses
  ],
})
```

The spec asked for `provideHttpClient(withFetch())`. That returns `EnvironmentProviders`, which `Injector.create` does
not accept, and reaching an `EnvironmentInjector` without a platform is the thing that would drag in a DOM. Providing
`FetchBackend` directly as the `HttpHandler` is the same backend `withFetch()` selects, minus the interceptor chain —
and no interceptor is under test here. **Document that deviation in `test/README.md`.**

**2. `NgZone` is required, and `zone.js` must be imported.** `FetchBackend` injects `NgZone`; `new NgZone({})` throws
unless `zone.js` has been loaded. `import 'zone.js';` as the driver's first import. `zone.js` is already in the image.

**3. `@angular/compiler` must be added to the image.** Without it the first injectable resolution fails with
`The injectable 'PlatformNavigation' needs to be compiled using the JIT compiler, but '@angular/compiler' is not
available.` Adding it to `test/docker/node/package.json` at `19.2.0` and `import '@angular/compiler';` in the driver
fixes it — measured. This is the *only* new dependency this plan needs.

**4. Compiled output needs explicit `.js` extensions, and that is not a generator defect.** The generated tree imports
`'../utils/api-base-service'` with no extension, which `tsc` resolves fine and Node's ESM loader does not. Every real
Angular consumer bundles, so extensionless specifiers are correct output for this target — unlike `k6-clients`, where
the runtime *is* the loader (see the note at the end of this plan). The build step therefore adds extensions to the
**emitted** JS in the writable out-dir, never to the source tree.

**5. The driver must import the tree by relative path, not absolute.** `tsc` maps `rootDirs` into the out-dir, so a
driver at `/spike/driver.ts` importing `'../tree/services/pets.service'` compiles from `/tree/...` and at runtime
resolves to `/out/tree/...`. An absolute `'/tree/...'` import compiles but then points the running JS back at the
read-only `.ts` source and fails with `ERR_MODULE_NOT_FOUND`.

**6. `rootUrl` must not end in a slash.** `ApiConfiguration.rootUrl` is concatenated with a leading-slash path, so
`http://host:8777/` produced `http://host:8777//pets/abc`. The reference server's `baseUrl` has no trailing slash, so
passing it through unchanged is correct — just do not append one.

**7. The result shape.** Service methods return `AbortablePromise<…ApiResponse>`, which is awaitable. The response type
is a union discriminated on `status`: the success arm is `HttpResponse<T>` with the payload in `.body`, and each error
arm is `HttpErrorResponse`-shaped with the payload in `.error`. `waitForResponse` *returns* the `HttpErrorResponse`
rather than throwing, and JSON-parses `.error` when the operation declares that status as JSON. So
`res.ok ? res.body : res.error` is the decoded payload in both directions — which is what `expectResult` in the case
table holds for bodied cases.

---

## File Structure

- `test/docker/node/package.json` (modify) — add `@angular/compiler`.
- `test/integration/angular-services/build.ts` (create) — the tsconfig the container compiles with, the emitted-import
  rewrite command, and the mount constants. Pure string generation, unit-tested.
- `test/integration/angular-services/build.test.ts` (create).
- `test/integration/angular-services/driver/driver.ts` (create) — the handwritten driver: 19 hardcoded calls.
- `test/integration/angular-services/smoke.test.ts` (create) — the risk gate: compile the tree, run one call, assert a
  200. Docker-gated.
- `test/integration/angular-services/integration.test.ts` (create) — the real leg: all 19 cases, deviation artifacts.
- `test/integration/targets.ts` (modify) — one `angular-services` entry, `direction: 'client'`.
- `deno.json` (modify) — `test:integration:angular` and `:check`; extend `test:all`.
- `test/wire/angular-services/*.txt` (generated, then committed).
- `test/README.md` and `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` (modify) — docs and register.

---

### Task 1: The build module

**Files:**

- Create: `test/integration/angular-services/build.ts`
- Test: `test/integration/angular-services/build.test.ts`

**Interfaces:**

- Consumes: `repoRootDir` from `@goast/test-harness`.
- Produces: `TREE_MOUNT`, `DRIVER_MOUNT`, `OUT_DIR`, `PROFILE`, `TREE_PATH`, `DRIVER_DIR`, `driverTsConfig(): string`,
  `buildCommand(): string`. Tasks 2 and 4 consume all of them.

**Context.** `test/integration/kotlin-clients/build.ts` is the model for how a tier-4 target's build module is shaped
and documented — read it first. This one is simpler: there is no dependency resolution, because the image already
carries every package.

- [ ] **Step 1: Write the failing tests**

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildCommand, DRIVER_MOUNT, driverTsConfig, OUT_DIR, PROFILE, TREE_MOUNT, TREE_PATH } from './build.ts';

describe('angular-services build module', () => {
  it('names the profile and its committed tree path consistently', () => {
    expect(PROFILE).toBe('angular-services');
    expect(TREE_PATH).toBe(`typescript/${PROFILE}/integration/kitchen-sink`);
  });

  it('compiles the tree and the driver into one program rooted at both mounts', () => {
    const config = JSON.parse(driverTsConfig()) as {
      compilerOptions: Record<string, unknown>;
      include: string[];
    };

    expect(config.compilerOptions.outDir).toBe(OUT_DIR);
    expect(config.compilerOptions.rootDirs).toEqual([TREE_MOUNT, DRIVER_MOUNT]);
    expect(config.include).toEqual([`${DRIVER_MOUNT}/driver.ts`, `${TREE_MOUNT}/**/*.ts`]);
  });

  // Emitting is the whole point: tier 3 type-checks with `noEmit`, this has to produce runnable JS.
  it('emits rather than only type-checking, and keeps decorators working', () => {
    const { compilerOptions } = JSON.parse(driverTsConfig()) as { compilerOptions: Record<string, unknown> };

    expect(compilerOptions.noEmit).toBe(false);
    expect(compilerOptions.experimentalDecorators).toBe(true);
    expect(compilerOptions.module).toBe('ESNext');
  });

  it('marks the out dir as an ES module and links the image node_modules into it', () => {
    const command = buildCommand();

    expect(command).toContain(`"type":"module"`);
    expect(command).toContain(`${OUT_DIR}/node_modules`);
  });

  // Node's ESM loader will not resolve an extensionless relative specifier. The rewrite is applied to the
  // *emitted* JS only; the committed tree is mounted read-only and must never be touched.
  it('adds .js extensions to emitted relative imports, idempotently', () => {
    const command = buildCommand();

    expect(command).toContain(OUT_DIR);
    expect(command).toMatch(/\.js\\?'/);
    // The second substitution is what makes a re-run safe rather than producing `.js.js`.
    expect(command).toContain('.js.js');
  });

  it('does not write anything into the mounted tree', () => {
    expect(buildCommand()).not.toContain(`${TREE_MOUNT} -name`);
    expect(buildCommand()).not.toMatch(new RegExp(`sed[^|;]*${TREE_MOUNT}`));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
deno test -A test/integration/angular-services/build.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Write `build.ts`**

```ts
/**
 * The container-side build for tier 4's `angular-services` leg: the tsconfig that compiles the committed
 * tree together with the handwritten driver, and the shell pipeline that makes the emitted JS runnable by
 * Node.
 *
 * Unlike the Kotlin legs' build modules (`test/integration/kotlin-clients/build.ts`) there is no dependency
 * declaration here at all: the `node` image installs every package at image-build time, so this module's
 * whole job is compilation and module-resolution plumbing.
 */
import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/** The generator profile this leg drives. */
export const PROFILE = 'angular-services';

/** Path under the committed `test/output/` tree holding the generated client. */
export const TREE_PATH = `typescript/${PROFILE}/integration/kitchen-sink`;

/** Container path the committed tree is mounted at, read-only. */
export const TREE_MOUNT = '/tree';
/** Container path the handwritten driver is mounted at, read-only. */
export const DRIVER_MOUNT = '/driver';
/** Container path the compiled JS is emitted to. Writable, and thrown away with the container. */
export const OUT_DIR = '/out';

/** Host path of the driver sources, mounted at {@link DRIVER_MOUNT}. */
export const DRIVER_DIR: string = join(repoRootDir, 'test', 'integration', 'angular-services', 'driver');

/**
 * Host path mounted at {@link TREE_MOUNT} — the *profile's kitchen-sink directory*, not `test/output/` as a
 * whole.
 *
 * That distinction is load-bearing. The driver imports `'../tree/services/pets.service'`, so `/tree` has to be
 * the directory that directly contains `services/`. Mounting `test/output/` instead would put the tree at
 * `/tree/typescript/angular-services/integration/kitchen-sink/services/…` and every driver import would fail
 * to resolve — and it would also drag the whole 8,000-file corpus into the `tsc` program via
 * `include: ['/tree/**\/*.ts']`, which is both slow and wrong.
 */
export const TREE_DIR: string = join(repoRootDir, 'test', 'output', ...TREE_PATH.split('/'));

/**
 * The tsconfig the container compiles with.
 *
 * Deliberately not the image's `tsconfig.base.json`: that one sets `noEmit` for tier 3's type-check-only
 * gate, and this leg has to produce runnable JavaScript. `rootDirs` is what makes `tsc` lay the two mounts
 * out side by side under `outDir`, so a driver importing `../tree/...` resolves at compile time against
 * `/tree` and at run time against `/out/tree` — see the plan's spike notes for why an absolute `/tree/...`
 * import compiles and then fails at run time.
 *
 * `experimentalDecorators` matters because the generated services carry `@Injectable()`. `emitDecoratorMetadata`
 * is not needed — the generated code injects through `inject()` calls rather than constructor parameters — but
 * it is harmless and matches the image's own base config, so it stays for consistency rather than being a
 * second thing to explain.
 */
export function driverTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM'],
        strict: true,
        skipLibCheck: true,
        allowJs: true,
        noEmit: false,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        outDir: OUT_DIR,
        rootDirs: [TREE_MOUNT, DRIVER_MOUNT],
        typeRoots: ['/opt/goast/node_modules/@types'],
        types: ['node'],
      },
      include: [`${DRIVER_MOUNT}/driver.ts`, `${TREE_MOUNT}/**/*.ts`],
    },
    null,
    2,
  );
}

/**
 * The shell pipeline that compiles and then makes the emitted tree loadable by Node.
 *
 * Three things Node's ESM loader needs that `tsc` does not provide:
 *
 *   * **Extensions.** `tsc` copies a relative specifier through verbatim, so `'../utils/api-base-service'`
 *     survives into the emitted JS and Node refuses to resolve it. The `sed` adds `.js`, then collapses any
 *     `.js.js` so the pass is idempotent. Applied to `OUT_DIR` **only** — the committed tree is mounted
 *     read-only, and rewriting it would mean the leg no longer runs byte-identical reviewed output.
 *   * **A module type.** Without `{"type":"module"}` Node reads the emitted `.js` as CommonJS and the first
 *     `import` is a syntax error.
 *   * **A reachable `node_modules`.** `/out` shares no ancestor with `/opt/goast`, and Node's resolver walks
 *     upward from the importing file, so the symlink is what makes `@angular/core` resolvable from `/out`.
 *     Same mechanism the image's Dockerfile already documents for `/tree`.
 *
 * `tsc`'s exit code is deliberately ignored (`|| true`): the corpus is expected to type-check clean, but a
 * *type* error must not stop the run, because what this leg measures is runtime behaviour and a driver that
 * runs is more informative than a build that refused to. A real compile failure surfaces as a missing emitted
 * file and then as a Node module-not-found, with `tsc`'s own output already in the captured log.
 */
export function buildCommand(): string {
  return [
    `/opt/goast/node_modules/.bin/tsc -p ${OUT_DIR}/tsconfig.json || true`,
    `find ${OUT_DIR} -name '*.js' -exec sed -i -E "s#(from '[./][^']*)(')#\\1.js\\2#g; s#\\.js\\.js'#.js'#g" {} +`,
    `printf '{"type":"module"}' > ${OUT_DIR}/package.json`,
    `ln -sfn /opt/goast/node_modules ${OUT_DIR}/node_modules`,
  ].join(' && ');
}
```

Note the tsconfig is written into `OUT_DIR` (writable), not into either read-only mount — the caller in Task 2 does
that, and `buildCommand` refers to it there.

- [ ] **Step 4: Run the tests**

```bash
deno test -A test/integration/angular-services && deno fmt --check && deno lint
```

- [ ] **Step 5: Commit**

```bash
git add test/integration/angular-services
git commit -m "test: add the angular-services container build module"
```

---

### Task 2: The risk gate — compile the tree and make one real call

**Files:**

- Modify: `test/docker/node/package.json`
- Create: `test/integration/angular-services/driver/driver.ts` (a *minimal* version; Task 3 fills it in)
- Create: `test/integration/angular-services/smoke.test.ts`

**Interfaces:**

- Consumes: everything Task 1 produced; `buildImage`, `runContainer`, `repoRootDir`, `requireDocker`,
  `startRefServer` from `@goast/test-harness`; `casesFor` from `test/cases/cases.ts`.
- Produces: a passing Docker-gated smoke test, and the injector recipe Task 3 builds on.

**Context — this is the plan's risk gate**, the same role Task 4 played in phase 6b. It proves the image, the build
pipeline, the DI recipe and host reachability in one cheap test, before any per-case driver code exists. The spike
already proved all of it by hand; this task makes it reproducible and committed.

**Adding `@angular/compiler` changes the `node` image's content hash**, so the image rebuilds and **tier 3's
TypeScript leg runs against a new image**. That leg must stay green with byte-identical diagnostics — verify it in this
task, not later.

- [ ] **Step 1: Add the dependency**

In `test/docker/node/package.json`, add to `dependencies`:

```json
    "@angular/compiler": "19.2.0",
```

with a comment in the Dockerfile is not possible (JSON), so record the reason in `test/README.md` in Task 5 instead:
Angular's JIT compiler is required because the generated services are consumed without the Angular build pipeline, and
`@angular/common`'s own injectables are shipped partially-compiled.

- [ ] **Step 2: Write the minimal driver**

`test/integration/angular-services/driver/driver.ts`:

```ts
// `zone.js` first and `@angular/compiler` second, both for their side effects and both load-order-sensitive:
// `NgZone` throws without a loaded Zone, and every injectable resolution fails with a JIT error without the
// compiler, because `@angular/common` ships partially-compiled and nothing here runs the Angular linker.
import 'zone.js';
import '@angular/compiler';

import { FetchBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { Injector, NgZone } from '@angular/core';

import { ApiConfiguration } from '../tree/utils/api-configuration';
import { PetsService } from '../tree/services/pets.service';

/** Prefix on every line of case output, so a driver line is distinguishable from Node's own noise. */
const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Builds the injector the generated services need.
 *
 * `Injector.create` rather than `TestBed`: the generated services inject through field initializers, so they
 * need an injection context, but they need nothing a platform provides. `TestBed` would require
 * `platform-browser-dynamic/testing` and therefore a DOM, which this leg has no reason to bring in.
 *
 * `FetchBackend` as the `HttpHandler` is the same backend `provideHttpClient(withFetch())` selects, without the
 * interceptor chain that wrapper also installs — nothing here has an interceptor under test. `provideHttpClient`
 * itself returns `EnvironmentProviders`, which `Injector.create` does not accept.
 */
function createInjector(baseUrl: string): Injector {
  return Injector.create({
    providers: [
      {
        provide: ApiConfiguration,
        useFactory: () => {
          const config = new ApiConfiguration();
          // No trailing slash: `rootUrl` is concatenated with a leading-slash path, and a trailing slash
          // produces `//pets/abc`, which the reference server's route pattern does not match.
          config.rootUrl = baseUrl.replace(/\/$/, '');
          return config;
        },
        deps: [],
      },
      { provide: NgZone, useFactory: () => new NgZone({}), deps: [] },
      { provide: FetchBackend, deps: [NgZone] },
      { provide: HttpHandler, useExisting: FetchBackend },
      { provide: HttpClient, deps: [HttpHandler] },
      { provide: PetsService, deps: [] },
    ],
  });
}

const baseUrl = process.argv[2];
const injector = createInjector(baseUrl);
const pets = injector.get(PetsService);

const response = await pets.getPet({ id: 'abc' });
console.log(
  CASE_LINE_PREFIX +
    JSON.stringify({ caseId: 'getPet/ok', result: response.ok ? response.body : (response as { error: unknown }).error }),
);
```

- [ ] **Step 3: Write the smoke test**

`test/integration/angular-services/smoke.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, runContainer, startRefServer } from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import { buildCommand, DRIVER_DIR, DRIVER_MOUNT, driverTsConfig, OUT_DIR, PROFILE, TREE_DIR, TREE_MOUNT } from './build.ts';

/** Same gate as tier 4's other Docker legs: `deno task test` must never start a container on its own. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

if (enabled) await requireDocker();

if (enabled) {
  describe(`integration/${PROFILE} smoke`, () => {
    it('compiles the generated tree and makes one real call through it', async () => {
      // Only the one case this driver drives: the reference server pops from a per-endpoint queue, and
      // handing it all 19 would leave 18 unconsumed and say nothing.
      const cases = casesFor(PROFILE, 'client').filter((c) => c.id === 'getPet/ok');
      expect(cases, 'getPet/ok is missing from the case table').toHaveLength(1);

      // `0.0.0.0`: the driver runs in a container and reaches the host through `host.docker.internal`, which
      // only routes to an interface the host actually bound.
      const server = await startRefServer(cases, { hostname: '0.0.0.0' });

      try {
        const image = await buildImage('node', CONTEXT_DIR);
        const result = await runContainer({
          image,
          // The image's ENTRYPOINT is tier 3's `check.mjs` type-checker; this leg needs a shell pipeline.
          entrypoint: 'sh',
          args: [
            '-c',
            `mkdir -p ${OUT_DIR} && printf '%s' '${driverTsConfig().replaceAll("'", "'\\''")}' > ${OUT_DIR}/tsconfig.json && ` +
              `${buildCommand()} && node ${OUT_DIR}/driver/driver.js http://host.docker.internal:${server.port}`,
          ],
          mounts: [
            { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
            { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
          ],
          hostGateway: true,
        });

        expect(result.timedOut, `the container timed out\n${result.stdout}${result.stderr}`).toBe(false);
        expect(result.code, `container exited ${result.code}\n${result.stdout}\n${result.stderr}`).toBe(0);
        expect(result.stdout, 'no case line was printed').toContain('##GOAST-CASE##');
        // The payload proves the whole chain: DI built the service, the service reached the host, and the
        // response was decoded. A weaker assertion here would let a driver that printed a line without
        // making a request pass.
        expect(result.stdout).toContain('"result":{"id":"abc","name":"Rex"}');

        expect([...server.recorded.keys()], 'the server never saw the request').toEqual(['getPet/ok']);
      } finally {
        await server.close();
      }
    });
  });
}
```

Note the mount source is `TREE_DIR` (the profile's kitchen-sink directory), not `test/output/` — see that constant's
doc comment in `build.ts` for why the driver's relative imports depend on it and what breaks otherwise.

- [ ] **Step 4: Run it**

```bash
deno test -A test/integration/angular-services && deno fmt --check && deno lint
GOAST_INTEGRATION=1 deno test -A test/integration/angular-services/smoke.test.ts
```

The first `buildImage` after the `package.json` edit rebuilds the image (a few minutes; the npm install layer is
invalidated). Report the measured wall-clock.

- [ ] **Step 5: Confirm tier 3 still passes against the new image**

```bash
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests --filter "typescript"
find test/compile -name "*.txt" | wc -l
```

Expected: green, and the count unchanged. If a diagnostic changed, stop and report — adding `@angular/compiler` to the
image should not change what tier 3 type-checks, and if it did, that needs understanding before anything else.

- [ ] **Step 6: Commit**

```bash
git add test/docker/node/package.json test/integration/angular-services
git commit -m "test: compile and run a generated Angular service in the node image"
```

---

### Task 3: The full driver

**Files:**

- Modify: `test/integration/angular-services/driver/driver.ts`

**Interfaces:**

- Consumes: the injector recipe from Task 2.
- Produces: a driver printing exactly one `##GOAST-CASE##` line per case in `casesFor('angular-services', 'client')`,
  in table order.

**Context.** `test/integration/fetch-clients/driver.ts` and
`test/integration/kotlin-clients/drivers/okhttp3/OkHttp3Driver.kt` are the two models — read both. The rules they
follow, which this driver follows too:

- **Hardcode the call arguments.** Writing `pets.createPet({ body: { id: 'new1', name: 'Fido' } })` in typed
  TypeScript *is* the assertion that the generated signature is usable. Reading arguments from the case table would
  need a dynamic dispatch layer that erases exactly what is under test.
- **Table order.** The reference server pops from a per-endpoint ordered queue, so cases sharing an endpoint
  (`updatePet/json` then `updatePet/form`; the five `getWidget` cases) must be issued in the order
  `test/cases/cases.ts` lists them.
- **One line per case, always.** Catch per case and report what happened; a driver that dies mid-run trips the
  integration test's drift check, which is the intended loud failure, but a case that *can* report should.
- **Report the decoded payload.** `res.ok ? res.body : res.error`, per the spike's finding 7. For a case whose
  declared response has no body (`deletePet/noContent`, `uploadPetPhoto/ok`, `allLocations/ok`, the three
  `styleMatrix` cases, `pathStyleSimple/ok`, `getEncoded/ok`) report `{ status: res.status }`, matching what
  `expectResult` holds for those cases and the same choice both Kotlin drivers made.

Read every argument value out of `test/cases/cases.ts`. **If a value in this plan disagrees with that table, the table
wins and the disagreement is a finding for your report.**

The 19 cases, their operations, and the service each lives on:

| Case | Service | Call |
| --- | --- | --- |
| `getPet/ok` | `PetsService` | `getPet({ id: 'abc' })` |
| `updatePet/json` | `PetsService` | `updatePet({ id: 'abc', body: { name: 'Rex', age: 4 } })` |
| `updatePet/form` | `PetsService` | `updatePet({ id: 'abc', body: { name: 'Rex', age: 4 } })` — same call; the table declares the same response, and the two cases exist to see whether the client can emit the *form* encoding at all |
| `addPetNote/text` | `PetsService` | `addPetNote({ id: 'abc', body: 'plain text body' })` |
| `deletePet/noContent` | `PetsService` | `deletePet({ id: 'abc' })` |
| `createPet/created` | `PetsService` | `createPet({ body: { id: 'new1', name: 'Fido' } })` — needs `authorization: Bearer secret-token`; see below |
| `uploadPetPhoto/ok` | `PetsService` | `uploadPetPhoto({ id: 'abc', body: { file: <File 'photo.png' image/png 'binarydata'>, caption: 'A good boy' } })` |
| `getWidget/ok` | `WidgetsService` | `getWidget({ id: 'w1' })` — needs `x-api-key: secret-key` |
| `getWidget/badRequest` | `WidgetsService` | `getWidget({ id: 'bad' })` |
| `getWidget/notFound` | `WidgetsService` | `getWidget({ id: 'missing' })` |
| `getWidget/serverError` | `WidgetsService` | `getWidget({ id: 'boom' })` |
| `getWidget/unexpectedError` | `WidgetsService` | `getWidget({ id: 'other' })` |
| `uploadBlob/ok` | `BlobsService` | `uploadBlob({ body: <binary 'hello'> })` |
| `allLocations/ok` | `ParamsService` | `allLocations({ pathParam: 'loc1', queryParam: 'q1', xHeaderParam: 'h1' })` |
| `styleMatrix/formExploded` | `ParamsService` | `styleMatrix({ formExploded: ['a', 'b'] })` |
| `styleMatrix/formUnexploded` | `ParamsService` | `styleMatrix({ formUnexploded: ['a', 'b'] })` |
| `styleMatrix/spaceDelimited` | `ParamsService` | `styleMatrix({ spaceDelimited: ['a', 'b'] })` |
| `pathStyleSimple/ok` | `ParamsService` | `pathStyleSimple({ values: ['a', 'b'] })` |
| `getEncoded/ok` | `ParamsService` | `getEncoded({ value: 'abc def/x', raw: 'a&b=c' })` |

**Open the four service files before writing any of these calls.** The exact parameter object shape per operation
(`body` vs named fields, and whether a multipart operation takes a `File` or something else) is in
`test/output/typescript/angular-services/integration/kitchen-sink/services/*.service.ts`, and the table above is a
map, not a substitute for reading them. Where a signature does not permit what a case needs, that is a finding: report
it, and drive the closest thing the signature *does* permit so the deviation gets recorded rather than the case going
undriven.

**The two auth cases.** `createPet/created` declares an `authorization` header and the `getWidget/*` cases declare
`x-api-key`, and phase 5 established that `fetch-clients` generates no security-scheme code, so the driver supplies
them by construction. Check whether `angular-services` offers a per-call `HttpContext`/header mechanism or an
`ApiConfiguration` field for this; if the only way is a custom `HttpHandler` that adds the header, do that in the
injector and document it. If there is genuinely no way for a caller to supply the header, that is a finding and the
case will produce a header deviation artifact.

- [ ] **Step 1: Write the driver**

Follow the models named above. Structure it as a `runCase(id, fn)` helper that awaits, catches, and prints exactly one
line, then 19 sequential calls in table order.

- [ ] **Step 2: Verify it compiles and runs standalone**

Temporarily point `smoke.test.ts` at all 19 cases (`casesFor(PROFILE, 'client')` without the filter) and run:

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/angular-services/smoke.test.ts
```

Read the captured stdout and confirm 19 distinct `##GOAST-CASE##` lines. The smoke test's payload assertion will fail
once more than one case runs — that is expected at this step. **Revert the smoke test to the single-case filter before
committing**; Task 4's `integration.test.ts` is what drives all 19.

- [ ] **Step 3: Commit**

```bash
git add test/integration/angular-services/driver/driver.ts
git commit -m "test: drive every angular-services case from a typed driver"
```

---

### Task 4: The integration test, the artifacts, and the registry

**Files:**

- Create: `test/integration/angular-services/integration.test.ts`
- Modify: `test/integration/targets.ts`
- Modify: `deno.json`
- Create: `test/wire/angular-services/*.txt`

**Interfaces:**

- Consumes: everything above; `diffRequest`, `diffResult`, `formatDeviations`, `verifyWireDeviations`,
  `wireSnapshotFile`, `wireRootDir`, `startRefServer`, `runContainer`, `buildImage`.
- Produces: the committed artifacts and one `WIRE_TARGETS` entry.

**Context.** `test/integration/kotlin-clients/integration.test.ts` is the direct model, including its
`attributeSurplus` machinery for a request that matches no route — read it, and reuse the approach rather than
reinventing it. Note it now runs the full `diffRequest` over an attributed surplus request; do the same here.

**Register the target in this task.** `test/integration-tests/orphans.test.ts` builds its expected set from
`WIRE_TARGETS` and sweeps all of `test/wire/`, so artifacts landing under a directory `WIRE_TARGETS` does not name make
that sweep fail. Phase 6a pushed a red branch on exactly this sequencing mistake. The artifacts and the registry entry
belong in the same commit.

- [ ] **Step 1: Add the target**

In `test/integration/targets.ts`, add to `WIRE_TARGETS`:

```ts
  { profile: 'angular-services', direction: 'client' },
```

- [ ] **Step 2: Write `integration.test.ts`**

Model it on the Kotlin client leg: start the reference server on `0.0.0.0` with `casesFor(PROFILE, 'client')`, run the
container once, parse the sentinel lines, assert the reported id set equals the expected id set (drift protection),
attribute any surplus requests by route shape, then per case emit
`[...diffRequest(expectRequest, recorded), ...diffResult(expectResult, reported)]` and call `verifyWireDeviations`.

Pass an explicit `{ updateCommand: 'deno task test:integration:angular' }` — the default names a task that does not set
`GOAST_INTEGRATION` and therefore cannot regenerate these artifacts.

- [ ] **Step 3: Add the tasks to `deno.json`**

```json
    "test:integration:angular": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write deno test -A test/integration/angular-services",
    "test:integration:angular:check": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check deno test -A test/integration/angular-services",
```

and extend `test:all` with ` && deno task test:integration:angular:check`.

- [ ] **Step 4: Generate the artifacts, then read every one of them**

```bash
deno task test:integration:angular
```

This step decides whether the leg is honest, so do not skim it. For each artifact, is the deviation plausible for the
mechanism it describes? For each case with **no** artifact, satisfy yourself it really was driven and really conforms —
an absent file is a positive claim. Compare against `test/wire/fetch-clients/`: both are TypeScript clients from the
same generator family, so a case where `angular-services` conforms and `fetch-clients` deviates (or vice versa) needs
a mechanical explanation you can name. Record per-case counts and one line per deviation class in your report; Task 5
depends on it.

- [ ] **Step 5: Prove determinism and the sweep**

```bash
deno task test:integration:angular:check
deno task test:integration:check
```

Then plant an orphan, confirm check mode fails naming it, and remove it:

```bash
touch "test/wire/angular-services/zzz__x.txt"
deno task test:integration:check
rm "test/wire/angular-services/zzz__x.txt"
```

- [ ] **Step 6: Commit**

```bash
git add test/integration/angular-services test/integration/targets.ts deno.json test/wire
git commit -m "test: record the angular-services wire deviations"
```

---

### Task 5: Document the leg and register what it found

**Files:**

- Modify: `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Context.** Match both files' existing voice; read a recent register entry (Defect 51, 52 or 53) for the house style —
mechanism first with a cited generator source line, then a `**Tier 4:**` element quoting the artifact, then what a fix
would involve and the note that this phase records rather than fixes.

- [ ] **Step 1: `test/README.md`**

Cover: what the `angular-services` leg is; that the services are instantiated with `Injector.create` rather than
`TestBed`, and that `FetchBackend` stands in for `provideHttpClient(withFetch())` with the interceptor chain omitted
(the spec named the latter — say so, and why the substitution is equivalent for what is measured); why
`@angular/compiler` and `zone.js` are needed; that the emitted JS gets `.js` extensions added while the committed tree
is never touched, and why that is correct output for a bundled target rather than a defect; the two new task names; and
the update to the artifact-count sentence and the tier table.

- [ ] **Step 2: Register entries**

One entry per distinct mechanism the artifacts show. Before writing a new `### Defect N`, grep the register — several
mechanisms are already recorded from `fetch-clients` (defect 20's missing `content-type`, defect 41's unencoded path
and query, defect 44's `content[0]` collapse) and want a `**Tier 4 (angular):**` element on the existing entry rather
than a duplicate. Say plainly, for each, whether it is a generator defect or a framework behaviour the generator
should have accounted for.

- [ ] **Step 3: Audit the register's citations**

Write a throwaway script that extracts every `path:NN` and `path:NN-MM` citation, opens each at that line, and prints
what is there. Read the output against the claims and repair what is wrong. Report how many you checked and how many
you repaired — including zero, and if zero, why that is the right answer rather than a broken script.

- [ ] **Step 4: Full gate**

```bash
deno fmt --check && deno lint && deno task test
deno task test:output:check
deno task test:integration:check
deno task test:integration:kotlin:check
deno task test:integration:controllers:check
deno task test:integration:angular:check
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests test/harness/docker.test.ts
find test/compile -name "*.txt" | wc -l
```

The last must still be 67.

- [ ] **Step 5: Commit**

```bash
git add test/README.md docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: document the angular-services tier-4 leg and register its defects"
```

---

## Carried forward to phase 7b (`k6-clients`), measured during this plan's spike

Two blockers were confirmed empirically against `grafana/k6:latest` and the committed
`test/output/typescript/k6-clients/integration/kitchen-sink` tree. **Neither is a per-case deviation — both stop the
generated code from loading at all**, so 7b needs a design decision before it needs code.

1. **k6 cannot resolve the generated client's relative imports.** They are extensionless
   (`import { RequestBuilder } from '../utils/request-builder';`), and k6 answers:
   `The moduleSpecifier "../utils/request-builder" couldn't be found on local disk`. Adding `.js` in a scratch copy
   made the module load, so the extension is the whole cause. Unlike the Angular target, this is a genuine generator
   defect: k6 *is* the loader, there is no bundling step in a k6 workflow, so the generated output cannot be run by
   its own target runtime.
2. **`request-builder.js` imports a third-party CDN at runtime.**
   `import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';` — with network the module loads
   (`LOADED typeof PetsClient=function`); with `--network none` it fails with
   `The moduleSpecifier "https://jslib.k6.io/formdata/0.0.2/index.js" couldn't be r…`. So the generated client cannot
   run air-gapped and takes a runtime dependency on a CDN.

The design question 7b must answer first: **the spec says the mounted tree is what runs, byte-identical to what was
reviewed.** Under that rule the k6 leg can only record a target-level load failure, and its 19 cases stay undriven —
which must NOT be recorded as 19 absent (= conforming) artifacts. A target-level artifact plus a harness state that
suppresses the per-case conformance claim is the honest shape, and tier 3's per-unit diagnostics file is the precedent.
The alternative — a build step that rewrites the imports so the cases *can* be driven — tests patched output and needs
to be argued for explicitly, not slipped in.

`easy-network-stub` (7c) is untouched by this plan and is the inverted target: the generated stubs *are* the API, so it
needs the `playwright` image and a different harness shape entirely. Note that `wireSnapshotFile` has no direction
segment, which is harmless only while every profile appears in one direction — check that before assuming it for 7c.
