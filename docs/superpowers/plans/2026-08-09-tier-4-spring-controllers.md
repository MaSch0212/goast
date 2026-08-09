# Tier 4 Server Direction (`spring-controllers`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the four generated `spring-controllers` profiles as real Spring Boot applications inside the `kotlin`
container, issue every case in the shared table against them with the handwritten reference client, and commit one
deviation artifact per non-conforming case.

**Architecture:** This is phase 6b of the testing-strategy rebuild, and it inverts phase 6a. In 6a a generated *client*
ran in a container and reached a reference *server* on the host. Here a generated *server* runs in a container on a
published port and the reference *client* — `test/harness/ref-client.ts`, already written and already the oracle for
6a's own oracle tests — drives it from the host. The generated code ships `501`-returning default delegate methods, so
the only glue needed is a handwritten delegate per generated `*ApiDelegate` interface plus a `@SpringBootApplication`
class. Each delegate method asserts the parameters Spring bound for it against the values the case table says the
request carried, and returns the case's declared response; a parameter that mis-binds therefore surfaces as a
distinguishable HTTP response rather than being silently ignored.

**Tech Stack:** Deno (harness, test driver, reference client), Docker (`kotlin` image: `gradle:8.14-jdk21`), Gradle
`--offline` against the image's warm cache, Kotlin 2.2.0, Spring Boot 3.5.6 (`sb3`) and 4.0.0 (`sb4`) WebFlux.

## Global Constraints

- The repo may require **only Deno and Docker** as prerequisites. Every other toolchain (JDK, Gradle, Kotlin, Spring)
  lives inside a Docker container. No task may add a host-side prerequisite.
- **No production code under `packages/` may change.** Generated output is byte-snapshotted by tier 2 and a generator
  change would break those snapshots. A generator defect found here is recorded in the register, never fixed here.
- **Tier 3 must stay at exactly 67 committed diagnostic files.** In particular
  `test/harness/kotlin/dependencies.ts` is tier 3's classpath table: adding a coordinate there changes what tier 3
  resolves and can change its diagnostics. Server-runtime-only coordinates belong in this phase's own build module,
  the way `RUNTIME_COROUTINE_DEPENDENCIES` already lives in `test/integration/kotlin-clients/build.ts`.
- **Deviations are committed as snapshots.** A case the generated code merely gets *wrong* produces a committed
  artifact under `test/wire/<profile>/`; it never becomes an `except` entry in the case table. An **absent** artifact
  file means "this case conforms", so anything that makes a case fail to be *measured* is a correctness bug in this
  phase, not a passing test.
- **The host-side published port binds `127.0.0.1` only.** The container is the server here, so nothing needs to listen
  on a non-loopback host interface. (6a's authorized `0.0.0.0` relaxation applies to `startRefServer` and is not needed
  by this phase.)
- Gradle runs `--offline`. Every dependency coordinate any synthesized build declares must resolve from the warm cache
  baked into the image at build time by `test/docker/kotlin/warmup/build.gradle.kts`, or the build fails with
  `No cached version available for offline mode`.
- `test/harness` is JSR-published. **Every exported symbol needs an explicit type annotation** or `deno lint` fails
  `no-slow-types`.
- The full gate is `deno task test:all`. `deno fmt --check` and `deno lint` must both be clean at every commit.

---

## Reference material an implementer will need

**The four units.** Profile names are exactly the committed tree directory names:

| Unit id | Tree path under `test/output/` | Boot line | Delegate flavour |
| --- | --- | --- | --- |
| `spring-controllers@sb3` | `kotlin/spring-controllers@sb3/integration/kitchen-sink` | `sb3` | lenient |
| `spring-controllers@sb4` | `kotlin/spring-controllers@sb4/integration/kitchen-sink` | `sb4` | lenient |
| `spring-controllers@sb3-strict` | `kotlin/spring-controllers@sb3-strict/integration/kitchen-sink` | `sb3` | strict |
| `spring-controllers@sb4-strict` | `kotlin/spring-controllers@sb4-strict/integration/kitchen-sink` | `sb4` | strict |

**What differs between the four generated trees** — measured, not assumed, with `diff -rq`:

- `@sb3-strict` and `@sb4-strict` have **byte-identical `*ApiDelegate.kt` files**. Only the `*Api.kt` files differ
  (`<T>`/`body: T` vs `<T : Any>`/`body: T?`, and `Unit?` vs `Unit` in the no-body factories). The factory *names and
  argument lists a delegate calls* are identical, so **one strict delegate source set compiles against both**.
- `@sb3` and `@sb4` differ in **exactly one line of one file**: `WidgetsApiDelegate.getWidget` returns
  `ResponseEntity<Any?>` under `@sb3` and `ResponseEntity<Any>` under `@sb4`. `ResponseEntity<T>` is invariant in `T`,
  so one override cannot satisfy both. That single method is why the lenient flavour needs a per-variant source
  directory, and it is the *only* reason.

**All four trees compile clean under tier 3** — `test/compile/kotlin/spring-controllers@*/integration/` are empty
directories. Any compile failure this phase hits is therefore in handwritten delegate code or in the synthesized
build, never in the generated tree.

**The generated delegate signatures** (lenient `@sb3`; the strict flavour has the same parameter lists and returns
`<Operation>ResponseEntity<*>` instead):

```kotlin
// PetsApiDelegate
suspend fun getPet(id: String): ResponseEntity<Pet>
suspend fun updatePet(id: String, petUpdate: PetUpdate): ResponseEntity<Pet>
suspend fun deletePet(id: String): ResponseEntity<Unit>
suspend fun createPet(pet: Pet): ResponseEntity<Pet>
suspend fun uploadPetPhoto(id: String, file: FilePart, caption: String?): ResponseEntity<Unit>
suspend fun addPetNote(id: String, string: String): ResponseEntity<Pet>

// ParamsApiDelegate
suspend fun allLocations(pathParam: String, queryParam: String?, xHeaderParam: String?): ResponseEntity<Unit>
suspend fun styleMatrix(formExploded: List<String>?, formUnexploded: List<String>?, spaceDelimited: List<String>?): ResponseEntity<Unit>
suspend fun pathStyleSimple(values: List<String>): ResponseEntity<Unit>
suspend fun getEncoded(value: String, raw: String?): ResponseEntity<Unit>

// WidgetsApiDelegate
suspend fun getWidget(id: String): ResponseEntity<Any?>   // ResponseEntity<Any> under @sb4

// BlobsApiDelegate
suspend fun uploadBlob(string: String): ResponseEntity<BlobRef>
```

**The strict response-entity factories that exist** (verified by grepping every `companion object` in the
`@sb3-strict` tree). A delegate may only construct a response through one of these — the primary constructor is
`private`:

| Operation | Available factories |
| --- | --- |
| `getPet` | `ok(Pet)`, `badRequest()`, `unauthorized()`, `forbidden()`, `internalServerError()`, `notImplemented()` |
| `updatePet` | `ok(Pet)`, + the same five no-body ones |
| `deletePet` | `noContent()`, + the same five |
| `createPet` | `created(Pet)`, + the same five |
| `uploadPetPhoto` | `ok()`, + the same five |
| `addPetNote` | `ok(Pet)`, + the same five |
| `allLocations`, `styleMatrix`, `pathStyleSimple`, `getEncoded` | `ok()`, + the same five |
| `uploadBlob` | `created(BlobRef)`, + the same five |
| `getWidget` | `ok(Widget)`, `badRequest(Error)`, `notFound(Error)`, `internalServerError(Error)`, `unauthorized()`, `forbidden()`, `notImplemented()` |

**There is no factory for an arbitrary status**, and in particular **none for `getWidget`'s `default` response.** The
case `getWidget/unexpectedError` declares status `503`, which only the spec's `default` response can serve, so the
strict delegate literally cannot express it. That is a generator gap, and Task 8 registers it. The delegate must say so
out loud (see `GoastUnexpressible` in Task 4) rather than substituting some other status and quietly recording a
smaller deviation.

**Generated model constructors** (`com.openapi.generated.model`):

```kotlin
data class Pet(val id: String, val name: String, val nickname: String? = null, val age: Int? = null,
               val status: PetStatus? = null, val birthDate: LocalDate? = null, val createdAt: OffsetDateTime? = null,
               val photo: String? = null, val owner: Owner? = null, val friend: Pet? = null, val toys: List<Toy>? = null)
data class PetUpdate(val name: String? = null, val age: Int? = null)
data class Widget(val id: String, val name: String, val price: Double? = null)
data class Error(val message: String, val code: Int? = null)
data class BlobRef(val id: String)
```

`com.openapi.generated.model.Error` shadows `kotlin.Error`; it must be imported explicitly wherever it is used.

**The 19 cases.** All of them carry `directions: ['client', 'server']`, so `casesFor(profile, 'server')` returns all
19 for every profile (no `except` entry names a `spring-controllers` profile). Read `test/cases/cases.ts` for the
authoritative values. The delegate assertions in Tasks 5 and 6 encode them; **if a value in this plan disagrees with
`test/cases/cases.ts`, the table wins and the discrepancy is a finding to report, not a value to silently follow.**

**Two things the server direction structurally cannot observe**, both to be documented rather than worked around:

- `allLocations/ok` sends `cookie: session=abc123`, but the generated `allLocations` signature has **no** parameter for
  the spec's `session` cookie parameter — the generator drops cookie parameters on the server side exactly as it does
  on the client side. The delegate has nothing to assert against, and an ignored cookie changes no response, so this
  case can conform on the wire while the parameter is still dropped.
- `createPet/created` sends `authorization: Bearer secret-token` and the `getWidget/*` cases send `x-api-key`; the
  generated interfaces declare no security parameters, so those headers are likewise unobservable from a delegate.

---

## File Structure

**Harness — new and changed:**

- `test/cases/types.ts` (modify) — add `RecordedResponse`.
- `test/harness/wire.ts` (modify) — `readBody` accepts a `Response` as well as a `Request`; add `readResponse` and
  `diffResponse`.
- `test/harness/wire.test.ts` (modify) — cover both.
- `test/harness/docker.ts` (modify) — `publish` option on `RunContainerOptions`, emitted by `dockerRunArgs`; add
  `startContainer`, returning a `RunningContainer` handle for a process that must stay up while the test drives it.
- `test/harness/docker.test.ts` (modify) — argv assertions (no Docker) plus one Docker-gated end-to-end.
- `test/harness/integration/health.ts` (create) — `waitForHttpReady`, an HTTP readiness poll that aborts as soon as the
  container it is waiting for dies.
- `test/harness/integration/health.test.ts` (create).
- `test/harness/integration/mod.ts` (modify) — re-export `health.ts`.

**The new target — `test/integration/spring-controllers/`:**

- `build.ts` — `SERVER_UNITS`, `synthesizeServerBuild`, `SERVER_RUNTIME_DEPENDENCIES`.
- `build.test.ts`.
- `boot.test.ts` — the Docker-gated infrastructure gate: one unit boots, is reachable, and routes.
- `integration.test.ts` — the real driver: 19 cases x 4 units, artifacts.
- `delegates/common/GoastApplication.kt`, `GoastExceptionHandler.kt`, `Expectations.kt`, `CaseData.kt`.
- `delegates/lenient/PetsDelegate.kt`, `ParamsDelegate.kt`, `BlobsDelegate.kt`.
- `delegates/lenient-sb3/WidgetsDelegate.kt`, `delegates/lenient-sb4/WidgetsDelegate.kt`.
- `delegates/strict/PetsDelegate.kt`, `ParamsDelegate.kt`, `BlobsDelegate.kt`, `WidgetsDelegate.kt`.

**Registries and docs:**

- `test/integration/targets.ts` (modify) — four `direction: 'server'` entries.
- `test/docker/kotlin/warmup/build.gradle.kts` (modify) — warm the Spring Boot server runtime.
- `deno.json` (modify) — `test:integration:controllers` and `:check`, and extend `test:all`.
- `test/README.md` (modify) — document the server direction.
- `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` (modify) — the defect register.

Delegate sources are split by *what forces a split*, nothing more: `common/` is shared by all four units, `lenient/`
and `strict/` by two each, and `lenient-sb3/`/`lenient-sb4/` hold the one method whose return type differs between the
Boot lines. Each unit's Gradle `main` source set is the generated tree plus exactly the directories that apply to it,
so no unit ever compiles another flavour's delegate — the same rule 6a's `driverDir` enforces, and for the same
reason.

---

### Task 1: `diffResponse` — the response-side oracle

**Files:**

- Modify: `test/cases/types.ts`
- Modify: `test/harness/wire.ts`
- Test: `test/harness/wire.test.ts`

**Interfaces:**

- Consumes: `RecordedBody`, `ApiCase`, and the existing private `compare`/`stable` helpers in `wire.ts`.
- Produces: `RecordedResponse` (type), `readResponse(response: Response): Promise<RecordedResponse>`,
  `diffResponse(expected: ApiCase['response'], actual: RecordedResponse): Deviation[]`. Task 7 calls both.

**Context.** `wire.ts` already has `diffRequest` (used by the client direction) and `diffResult`. The server direction
needs the mirror image: given the `Response` the generated server produced, compare it against the case's declared
`response`. The comparison rules must follow `diffRequest`'s hard-won ones — read its doc comment before writing this.
Status and body are compared **unconditionally**; headers are compared **only where the case declares them**, because
a response carries `date`, `content-length`, `transfer-encoding` and friends that no case names and a case-declared
contract cannot punish a header it never asked about.

- [ ] **Step 1: Write the failing tests**

Add to `test/harness/wire.test.ts`:

```ts
describe('readResponse', () => {
  it('parses a json body and lower-cases headers', async () => {
    const response = new Response(JSON.stringify({ id: 'abc' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Rate-Limit': '42' },
    });

    expect(await readResponse(response)).toEqual({
      status: 200,
      headers: { 'content-type': 'application/json', 'x-rate-limit': '42' },
      body: { kind: 'json', value: { id: 'abc' } },
    });
  });

  it('reports a bodyless response as kind none', async () => {
    expect((await readResponse(new Response(null, { status: 204 }))).body).toEqual({ kind: 'none' });
  });

  it('reports a text body as kind text', async () => {
    const response = new Response('MISMATCH getPet.id expected <abc> but was <xyz>', {
      status: 599,
      headers: { 'content-type': 'text/plain' },
    });

    expect((await readResponse(response)).body).toEqual({
      kind: 'text',
      value: 'MISMATCH getPet.id expected <abc> but was <xyz>',
    });
  });
});

describe('diffResponse', () => {
  const recorded = (over: Partial<RecordedResponse> = {}): RecordedResponse => ({
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: { kind: 'json', value: { id: 'abc' } },
    ...over,
  });

  it('finds nothing when status, declared headers and body all match', () => {
    const expected = { status: 200, headers: { 'content-type': 'application/json' }, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded())).toEqual([]);
  });

  it('reports a status deviation', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded({ status: 599 }))).toEqual([
      { field: 'status', expected: '200', actual: '599' },
    ]);
  });

  it('reports a declared header that is absent', () => {
    const expected = { status: 200, headers: { 'x-rate-limit': '42' }, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded())).toEqual([
      { field: 'header.x-rate-limit', expected: '42', actual: '<absent>' },
    ]);
  });

  it('ignores an undeclared header the runtime added', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    expect(diffResponse(expected, recorded({ headers: { date: 'Sat, 09 Aug 2026 00:00:00 GMT' } }))).toEqual([]);
  });

  // The whole point of comparing the body unconditionally: an extra property in the response is a
  // deviation even though the case's `response` never mentions it. This is the shape the generated
  // server is expected to produce for every `Pet`-bodied case (every unset optional field as an
  // explicit `null`), so a conditional comparison would make this phase blind to its own main finding.
  it('reports an extra property in the body', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    const deviations = diffResponse(expected, recorded({ body: { kind: 'json', value: { id: 'abc', age: null } } }));
    expect(deviations).toEqual([
      { field: 'body', expected: '{"kind":"json","value":{"id":"abc"}}', actual: '{"kind":"json","value":{"age":null,"id":"abc"}}' },
    ]);
  });

  it('reports a body on a response the case declares none for', () => {
    const expected = { status: 204 };
    const deviations = diffResponse(expected, recorded({ status: 204, body: { kind: 'json', value: {} } }));
    expect(deviations).toEqual([
      { field: 'body', expected: '{"kind":"none"}', actual: '{"kind":"json","value":{}}' },
    ]);
  });

  it('reports a body that arrived as text where json was declared', () => {
    const expected = { status: 200, body: { id: 'abc' } };
    const deviations = diffResponse(expected, recorded({ body: { kind: 'text', value: 'nope' } }));
    expect(deviations).toEqual([
      { field: 'body', expected: '{"kind":"json","value":{"id":"abc"}}', actual: '{"kind":"text","value":"nope"}' },
    ]);
  });
});
```

Add `readResponse`, `diffResponse` to the existing import from `./wire.ts` and `RecordedResponse` to the import from
`../cases/types.ts` (or `../cases/cases.ts`, matching whatever that file already does).

- [ ] **Step 2: Run the tests to verify they fail**

```bash
deno test -A test/harness/wire.test.ts
```

Expected: failures naming `readResponse` and `diffResponse` as undefined.

- [ ] **Step 3: Add `RecordedResponse` to `test/cases/types.ts`**

Place it directly after `RecordedRequest`:

```ts
/**
 * A response as the reference client actually received it, after parsing.
 *
 * Body reuses {@link RecordedBody} for the same structural reason `RecordedRequest` does: `wire.ts`'s
 * `diffResponse` puts a body built from the case table's `response.body` beside this one and compares
 * them with one `compare` call, which is only sound while every variant of one is a variant of the
 * other.
 */
export type RecordedResponse = {
  status: number;
  /** Lower-cased names, allowlist-filtered. See `wire.ts`. */
  headers: Record<string, string>;
  body: RecordedBody;
};
```

- [ ] **Step 4: Widen `readBody` and add the two new functions in `test/harness/wire.ts`**

`readBody` currently takes `Request`. `Response` exposes the identical members it uses (`headers`, `body`, `text`,
`formData`, `arrayBuffer`), so widen the parameter rather than duplicating the function — a second copy would be a
second place for a content type to be handled differently, and `RecordedBody`'s doc comment in `types.ts` explains why
one parse path matters. Change the signature to:

```ts
export async function readBody(source: Request | Response): Promise<RecordedBody> {
```

and rename the local uses of `request` to `source` inside it. Nothing else in the body changes.

Then append, after `diffRequest`:

```ts
/** Parses one response into the shape {@link diffResponse} compares. */
export async function readResponse(response: Response): Promise<RecordedResponse> {
  return {
    status: response.status,
    headers: normalizeHeaders(response.headers),
    body: await readBody(response),
  };
}

/**
 * Compares one recorded response against the case's declared `response`.
 *
 * The mirror of {@link diffRequest}, and it follows that function's rules deliberately: status and body
 * are compared unconditionally, headers only where the case declares them. The asymmetry has the same
 * justification in this direction — the runtime supplies `date`, `content-length` and
 * `transfer-encoding` that no case names, but it never invents a status or a response body.
 *
 * The case table types `response.body` as `unknown` rather than as a `BodyExpectation`, because a
 * declared response body is always JSON in this corpus (or absent). It is lifted into
 * `{ kind: 'json' }` here so that one `compare` call can put it beside a `RecordedBody` — which also
 * means a response that arrives as `text/plain` reports as a `kind` mismatch rather than as a silently
 * unequal value, and that is exactly how a delegate's plain-text failure report becomes readable in the
 * committed artifact.
 */
export function diffResponse(expected: ApiCase['response'], actual: RecordedResponse): Deviation[] {
  const deviations: Deviation[] = [];

  if (expected.status !== actual.status) {
    deviations.push({ field: 'status', expected: String(expected.status), actual: String(actual.status) });
  }

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const lower = name.toLowerCase();
    if (actual.headers[lower] !== value) {
      deviations.push({ field: `header.${lower}`, expected: value, actual: actual.headers[lower] ?? '<absent>' });
    }
  }

  const expectedBody: RecordedBody = expected.body === undefined
    ? { kind: 'none' }
    : { kind: 'json', value: expected.body };
  compare('body', expectedBody, actual.body, deviations);

  return deviations;
}
```

Add `RecordedResponse` to the existing `import type { ... } from '../cases/types.ts';` line.

- [ ] **Step 5: Run the tests and the whole harness suite**

```bash
deno test -A test/harness && deno fmt --check && deno lint
```

Expected: all pass. The pre-existing `readBody` tests must still pass — the widening is source-compatible.

- [ ] **Step 6: Commit**

```bash
git add test/cases/types.ts test/harness/wire.ts test/harness/wire.test.ts
git commit -m "test: add the response-side wire oracle for tier 4's server direction"
```

---

### Task 2: A container that stays up, on a published port

**Files:**

- Modify: `test/harness/docker.ts`
- Modify: `test/harness/docker.test.ts`
- Create: `test/harness/integration/health.ts`
- Create: `test/harness/integration/health.test.ts`
- Modify: `test/harness/integration/mod.ts`

**Interfaces:**

- Consumes: the existing `dockerRunArgs`, `requireDocker`, `RunContainerOptions` in `docker.ts`.
- Produces:
  - `publish?: PublishedPort[]` on `RunContainerOptions`, where
    `type PublishedPort = { containerPort: number; hostIp?: string }`.
  - `startContainer(options: RunContainerOptions): Promise<RunningContainer>` where
    ```ts
    export type RunningContainer = {
      name: string;
      /** Host port the daemon mapped `containerPort` to, on 127.0.0.1. */
      hostPort(containerPort: number): Promise<number>;
      /** Everything the container has written so far, stdout and stderr interleaved. */
      output(): string;
      /** Resolves when the container process exits on its own. Never rejects. */
      exited: Promise<number>;
      /** True until `exited` resolves. */
      running(): boolean;
      /** Kills and reaps the container. Safe to call twice. */
      stop(): Promise<void>;
    };
    ```
  - `waitForHttpReady(url: string, options: { timeoutMs: number; isAlive: () => boolean; describeDeath: () => string }): Promise<void>`.

Task 4 and Task 7 use all of these.

**Context.** `runContainer` runs a container to completion and returns its output. The server direction cannot use it:
the Spring Boot app runs until it is told to stop, and the test has to talk to it *while* it runs. So this task adds a
second entry point beside `runContainer` rather than reshaping it — tier 3 and 6a depend on `runContainer`'s exact
behaviour and neither should change.

Port discovery must not guess. Passing `--publish 127.0.0.1::8080` lets the daemon pick a free host port, and
`docker port <name> 8080/tcp` reads back which one — no bind-then-close race on the host, which is the failure mode of
picking a port in Deno first.

`stop()` uses `docker kill`, not `docker stop`. `docker stop` waits out a 10-second SIGTERM grace period per container,
and four units means forty seconds spent shutting down a Spring context whose orderly teardown this phase never
observes.

- [ ] **Step 1: Write the failing argv tests**

Add to `test/harness/docker.test.ts`, alongside the existing `dockerRunArgs` tests:

```ts
it('publishes a container port on loopback with a daemon-chosen host port', () => {
  const args = dockerRunArgs({ image: 'img', name: 'c', publish: [{ containerPort: 8080 }] });

  expect(args).toEqual(['run', '--rm', '--name', 'c', '--publish', '127.0.0.1::8080', 'img']);
});

it('honours an explicit host ip', () => {
  const args = dockerRunArgs({ image: 'img', name: 'c', publish: [{ containerPort: 8080, hostIp: '0.0.0.0' }] });

  expect(args).toContain('0.0.0.0::8080');
});

it('publishes every requested port', () => {
  const args = dockerRunArgs({
    image: 'img',
    name: 'c',
    publish: [{ containerPort: 8080 }, { containerPort: 9090 }],
  });

  expect(args.filter((a) => a.includes('::'))).toEqual(['127.0.0.1::8080', '127.0.0.1::9090']);
});
```

- [ ] **Step 2: Write the failing health-poll tests**

Create `test/harness/integration/health.test.ts`. These need no Docker — `isAlive` is a plain callback:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { waitForHttpReady } from './health.ts';

describe('waitForHttpReady', () => {
  it('returns as soon as the url answers, whatever the status', async () => {
    const server = Deno.serve({ port: 0, onListen: () => {} }, () => new Response('nope', { status: 404 }));
    try {
      await waitForHttpReady(`http://127.0.0.1:${server.addr.port}/__health`, {
        timeoutMs: 5_000,
        isAlive: () => true,
        describeDeath: () => 'unused',
      });
    } finally {
      await server.shutdown();
    }
  });

  // The failure this exists to prevent: a container that crashed on startup would otherwise be waited
  // on for the whole timeout and then reported as "timed out", hiding the compile error in its log.
  it('fails immediately with the death description once isAlive goes false', async () => {
    let alive = true;
    setTimeout(() => alive = false, 50);

    await expect(
      waitForHttpReady('http://127.0.0.1:1/never', {
        timeoutMs: 60_000,
        isAlive: () => alive,
        describeDeath: () => 'exit 1\nUnresolved reference: Widget',
      }),
    ).rejects.toThrow('Unresolved reference: Widget');
  });

  it('fails with the url and the timeout when nothing ever answers', async () => {
    await expect(
      waitForHttpReady('http://127.0.0.1:1/never', {
        timeoutMs: 300,
        isAlive: () => true,
        describeDeath: () => 'still running',
      }),
    ).rejects.toThrow('did not become ready within 300ms');
  });
});
```

- [ ] **Step 3: Run both to verify they fail**

```bash
deno test -A test/harness/docker.test.ts test/harness/integration/health.test.ts
```

Expected: the argv tests fail on an unexpected argv (no `--publish`), the health tests fail on a missing module.

- [ ] **Step 4: Add `publish` to `docker.ts`**

```ts
/**
 * One published container port.
 *
 * No `hostPort`: the daemon picks a free one and {@link RunningContainer.hostPort} reads it back. Letting
 * the caller choose would mean finding a free port on the host first, and the only way to do that is to
 * bind one and release it — after which nothing stops another process from taking it before the daemon
 * binds.
 */
export type PublishedPort = { containerPort: number; hostIp?: string };
```

Add to `RunContainerOptions`:

```ts
  /** Ports to publish to the host. See {@link PublishedPort}. */
  publish?: PublishedPort[];
```

In `dockerRunArgs`, after the `env` loop and before `workdir`:

```ts
  for (const port of options.publish ?? []) {
    // `<ip>::<containerPort>` — the empty middle field is what asks the daemon for an ephemeral host
    // port. Loopback by default: the container is the server in the tier-4 server direction, so nothing
    // needs to be reachable from off the host.
    args.push('--publish', `${port.hostIp ?? '127.0.0.1'}::${port.containerPort}`);
  }
```

- [ ] **Step 5: Add `startContainer`**

Append to `docker.ts`:

```ts
/** A container that keeps running while the test drives it. See {@link startContainer}. */
export type RunningContainer = {
  name: string;
  hostPort(containerPort: number): Promise<number>;
  output(): string;
  exited: Promise<number>;
  running(): boolean;
  stop(): Promise<void>;
};

/**
 * Starts a container and returns while it is still running.
 *
 * The counterpart to {@link runContainer}, which waits for the container to finish and is therefore
 * useless for a server: tier 4's server direction has to reach the container *while* it runs. Kept as a
 * separate entry point rather than a flag on `runContainer`, because tier 3 and the client direction
 * depend on that function's exact behaviour.
 *
 * Output is drained continuously into a buffer rather than left in the pipe. A Spring Boot startup log
 * is large enough to fill the OS pipe buffer, and a container blocked writing to a full pipe stops
 * making progress — it would never become ready, and the log explaining why would be the thing that was
 * stuck.
 */
export async function startContainer(options: RunContainerOptions): Promise<RunningContainer> {
  await requireDocker();

  const name = options.name ?? `goast-test-${crypto.randomUUID()}`;
  const process = new Deno.Command('docker', {
    args: dockerRunArgs({ ...options, name }),
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  let buffer = '';
  const decoder = new TextDecoder();
  const drain = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
    for await (const chunk of stream) buffer += decoder.decode(chunk, { stream: true });
  };
  const drained = Promise.all([drain(process.stdout), drain(process.stderr)]);

  let alive = true;
  const exited = process.status.then(({ code }) => {
    alive = false;
    return code;
  });

  return {
    name,
    output: () => buffer,
    exited,
    running: () => alive,
    async hostPort(containerPort: number): Promise<number> {
      const { code, stdout, stderr } = await new Deno.Command('docker', {
        args: ['port', name, `${containerPort}/tcp`],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const text = new TextDecoder().decode(stdout).trim();
      if (code !== 0 || text === '') {
        throw new Error(
          `Could not read the host port ${name} mapped ${containerPort}/tcp to. ` +
            `Is the container still running?\n${new TextDecoder().decode(stderr)}\n${buffer}`,
        );
      }
      // `docker port` prints one `<ip>:<port>` line per mapping; a container published on both IPv4 and
      // IPv6 prints two. The first is enough — they are the same container port.
      const match = /:(\d+)\s*$/.exec(text.split('\n')[0]);
      if (match === null) throw new Error(`Could not parse a host port out of \`docker port\` output: ${text}`);
      return Number(match[1]);
    },
    async stop(): Promise<void> {
      if (alive) {
        // `kill`, not `stop`: `stop` spends a 10-second SIGTERM grace period per container waiting for a
        // shutdown nothing here observes. Errors are swallowed because the container may have exited
        // between `alive` and this call.
        await new Deno.Command('docker', { args: ['kill', name], stdout: 'null', stderr: 'null' })
          .output().catch(() => {});
      }
      await exited;
      await drained;
    },
  };
}
```

- [ ] **Step 6: Add `waitForHttpReady`**

Create `test/harness/integration/health.ts`:

```ts
/** Options for {@link waitForHttpReady}. */
export type WaitForHttpReadyOptions = {
  timeoutMs: number;
  /** False once the process being waited on has died. Polling stops immediately when it does. */
  isAlive: () => boolean;
  /** Called only on death, to build the error message. Should return the process's output. */
  describeDeath: () => string;
};

/**
 * Polls `url` until it answers with any HTTP status.
 *
 * *Any* status, deliberately: a Spring Boot app with no actuator and no route for this path answers
 * `404`, and `404` is proof the server is listening and routing. Requiring `2xx` would mean either
 * adding a health endpoint to the app under test — changing what is being measured — or depending on a
 * generated route, which is one of the things this phase is measuring and therefore cannot rely on.
 *
 * `isAlive` is checked every iteration so a container that died during startup fails here with its own
 * log instead of being waited out for the full timeout and reported as a timeout — which would bury a
 * compile error under a misleading symptom.
 */
export async function waitForHttpReady(url: string, options: WaitForHttpReadyOptions): Promise<void> {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() < deadline) {
    if (!options.isAlive()) {
      throw new Error(`The process serving ${url} exited before becoming ready.\n\n${options.describeDeath()}`);
    }
    try {
      // The response body must be consumed or Deno leaks the connection and the test runner reports a
      // leaked resource, which reads like a bug in whatever test happened to run next.
      const response = await fetch(url);
      await response.body?.cancel();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`${url} did not become ready within ${options.timeoutMs}ms.\n\n${options.describeDeath()}`);
}
```

Add `export * from './health.ts';` to `test/harness/integration/mod.ts`.

- [ ] **Step 7: Add the Docker-gated end-to-end test**

In `test/harness/docker.test.ts`, inside whatever `GOAST_COMPILE`/Docker gate that file already uses for its live
tests (match the existing pattern exactly; read the top of the file first):

```ts
it('starts a container, reports its published port, and stops it', async () => {
  const image = await buildImage('kotlin', join(repoRootDir, 'test', 'docker', 'kotlin'));
  // `jwebserver` ships with the JDK the `kotlin` image already has, so this needs no new image and no
  // new dependency. It serves a directory over HTTP and stays up, which is exactly the shape
  // `startContainer` exists for.
  const container = await startContainer({
    image,
    entrypoint: 'jwebserver',
    args: ['-b', '0.0.0.0', '-p', '8080', '-d', '/tmp'],
    publish: [{ containerPort: 8080 }],
  });

  try {
    const port = await container.hostPort(8080);
    expect(port).toBeGreaterThan(0);

    await waitForHttpReady(`http://127.0.0.1:${port}/`, {
      timeoutMs: 60_000,
      isAlive: () => container.running(),
      describeDeath: () => container.output(),
    });

    const response = await fetch(`http://127.0.0.1:${port}/`);
    await response.body?.cancel();
    expect(response.status).toBe(200);
  } finally {
    await container.stop();
  }

  expect(container.running()).toBe(false);
});
```

- [ ] **Step 8: Run everything**

```bash
deno test -A test/harness/docker.test.ts test/harness/integration && deno fmt --check && deno lint
```

Then the Docker-gated leg (this builds the `kotlin` image if it is not cached — several minutes on a cold cache):

```bash
GOAST_COMPILE=1 deno test -A test/harness/docker.test.ts
```

Expected: all pass. If `jwebserver` is absent from the image, report that in the task report and use
`sh -c "while :; do printf 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok' | nc -l -p 8080 -q 1; done"` only if `nc`
is present; do not add a package install to the Dockerfile for a harness test.

- [ ] **Step 9: Commit**

```bash
git add test/harness/docker.ts test/harness/docker.test.ts test/harness/integration
git commit -m "test: run a container that stays up on a published port"
```

---

### Task 3: The synthesized server build

**Files:**

- Create: `test/integration/spring-controllers/build.ts`
- Test: `test/integration/spring-controllers/build.test.ts`

**Interfaces:**

- Consumes: `KOTLIN_BOM`, `kotlinDependenciesFor` from `@goast/test-harness` (see
  `test/harness/kotlin/dependencies.ts`).
- Produces: `ServerUnit` (type), `SERVER_UNITS: readonly ServerUnit[]`, `SERVER_RUNTIME_DEPENDENCIES`,
  `synthesizeServerBuild(unit: ServerUnit, treeMount: string, delegateMount: string): { settings: string; build: string }`,
  `MAIN_CLASS: string`, and the five container-path constants `TREE_MOUNT`, `DELEGATE_MOUNT`, `WORK_MOUNT`,
  `SERVER_PORT`, `DELEGATES_DIR`. Tasks 4 and 7 consume all of them.

**Context.** `test/integration/kotlin-clients/build.ts` is the model for this file — read it first, including its
doc comments, and follow its structure and its reasoning. Same shape: one single-project Gradle build per unit,
`application` plugin, `sourceSets["main"].kotlin.srcDirs(...)` listing the generated tree plus the delegate
directories, no Spring Boot Gradle plugin.

**No Spring Boot Gradle plugin, deliberately.** `id("org.springframework.boot")` would have to resolve a plugin marker
from the plugin portal, and the image builds `--offline`. Nothing here needs a fat jar or `bootRun`: `application`'s
`run` task with a `main` that calls `runApplication` starts the same app. The Kotlin `plugin.spring` (all-open) plugin
is likewise not used — see Task 4 for why `proxyBeanMethods = false` removes the need.

- [ ] **Step 1: Write the failing tests**

Create `test/integration/spring-controllers/build.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { MAIN_CLASS, SERVER_UNITS, synthesizeServerBuild } from './build.ts';

describe('SERVER_UNITS', () => {
  it('covers both Boot lines crossed with both strictness flavours', () => {
    expect(SERVER_UNITS.map((u) => u.id)).toEqual([
      'spring-controllers@sb3',
      'spring-controllers@sb4',
      'spring-controllers@sb3-strict',
      'spring-controllers@sb4-strict',
    ]);
  });

  it('points every unit at a tree path that matches its profile', () => {
    for (const unit of SERVER_UNITS) {
      expect(unit.treePath).toBe(`kotlin/${unit.profile}/integration/kitchen-sink`);
    }
  });
});

describe('synthesizeServerBuild', () => {
  const lenientSb3 = SERVER_UNITS.find((u) => u.id === 'spring-controllers@sb3')!;
  const strictSb4 = SERVER_UNITS.find((u) => u.id === 'spring-controllers@sb4-strict')!;

  it('names the project and the main class', () => {
    const { settings, build } = synthesizeServerBuild(lenientSb3, '/output', '/delegates');

    expect(settings).toContain('rootProject.name = "server"');
    expect(build).toContain(`mainClass.set("${MAIN_CLASS}")`);
  });

  it('puts the generated tree and only this unit\'s delegate dirs on the source path', () => {
    const { build } = synthesizeServerBuild(lenientSb3, '/output', '/delegates');
    const srcDirs = /srcDirs\((.*)\)/.exec(build)![1];

    expect(srcDirs).toContain('/output/kotlin/spring-controllers@sb3/integration/kitchen-sink');
    expect(srcDirs).toContain('/delegates/common');
    expect(srcDirs).toContain('/delegates/lenient');
    expect(srcDirs).toContain('/delegates/lenient-sb3');
    // The one method whose return type differs between the Boot lines lives in these two directories;
    // compiling both would declare `WidgetsDelegate` twice.
    expect(srcDirs).not.toContain('lenient-sb4');
    expect(srcDirs).not.toContain('/delegates/strict');
  });

  it('gives a strict unit the strict delegates and no lenient ones', () => {
    const srcDirs = /srcDirs\((.*)\)/.exec(synthesizeServerBuild(strictSb4, '/output', '/delegates').build)![1];

    expect(srcDirs).toContain('/delegates/common');
    expect(srcDirs).toContain('/delegates/strict');
    expect(srcDirs).not.toContain('lenient');
  });

  it('resolves the right Boot platform per variant', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build).toContain('spring-boot-dependencies:3.5.6');
    expect(synthesizeServerBuild(strictSb4, '/o', '/d').build).toContain('spring-boot-dependencies:4.0.0');
  });

  it('declares the compile dependencies tier 3 uses for this family plus the server runtime', () => {
    const { build } = synthesizeServerBuild(lenientSb3, '/o', '/d');

    // From `kotlinDependenciesFor('spring-controllers', 'sb3')` — the same table tier 3 compiles with.
    expect(build).toContain('org.springframework:spring-web');
    expect(build).toContain('jakarta.validation:jakarta.validation-api');
    // Server-runtime-only, and absent from that table on purpose.
    expect(build).toContain('org.springframework.boot:spring-boot-starter-webflux');
  });

  it('picks the Jackson line that matches the variant', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build)
      .toContain('com.fasterxml.jackson.module:jackson-module-kotlin');
    expect(synthesizeServerBuild(strictSb4, '/o', '/d').build)
      .toContain('tools.jackson.module:jackson-module-kotlin');
  });

  it('declares a repository so resolution configures at all', () => {
    expect(synthesizeServerBuild(lenientSb3, '/o', '/d').build).toContain('mavenCentral()');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
deno test -A test/integration/spring-controllers/build.test.ts
```

Expected: FAIL, module not found.

- [ ] **Step 3: Write `build.ts`**

```ts
/**
 * Synthesizes the single-project Gradle build that runs one generated `spring-controllers` tree as a
 * real Spring Boot application, with handwritten delegates supplying the behaviour the case table
 * declares.
 *
 * Mirrors `test/integration/kotlin-clients/build.ts` (tier 4's client direction) rather than tier 3's
 * `synthesizeGradleBuild`: tier 3 compiles the whole corpus in one multi-project build with
 * `--continue`, whereas a unit here has to *run*, hold a port, and be driven over HTTP, so it needs its
 * own process and its own failure.
 */
import { join } from 'node:path';

import { KOTLIN_BOM, kotlinDependenciesFor, repoRootDir } from '@goast/test-harness';

/** One (strictness flavour, Spring Boot variant) pair this phase runs as a server. */
export type ServerUnit = {
  /** `spring-controllers@<variant>[-strict]`, matching the committed tree directory name. */
  id: string;
  /** The generator profile name; identical to `id`. */
  profile: string;
  /** Which Spring Boot line the tree is generated against. */
  variant: 'sb3' | 'sb4';
  /** Path under the committed `test/output/` tree holding this unit's generated server code. */
  treePath: string;
  /**
   * Directories under the mounted delegates root that make up this unit's handwritten glue, in source
   * order. Split by what actually forces a split and nothing else — see the plan's File Structure — so
   * `common` appears in all four units, `lenient`/`strict` in two each, and `lenient-sb3`/`lenient-sb4`
   * hold the single method (`getWidget`) whose return type differs between the Boot lines.
   */
  delegateDirs: readonly string[];
};

/** The four units: both strictness flavours crossed with both Spring Boot lines. */
export const SERVER_UNITS: readonly ServerUnit[] = [
  {
    id: 'spring-controllers@sb3',
    profile: 'spring-controllers@sb3',
    variant: 'sb3',
    treePath: 'kotlin/spring-controllers@sb3/integration/kitchen-sink',
    delegateDirs: ['common', 'lenient', 'lenient-sb3'],
  },
  {
    id: 'spring-controllers@sb4',
    profile: 'spring-controllers@sb4',
    variant: 'sb4',
    treePath: 'kotlin/spring-controllers@sb4/integration/kitchen-sink',
    delegateDirs: ['common', 'lenient', 'lenient-sb4'],
  },
  {
    id: 'spring-controllers@sb3-strict',
    profile: 'spring-controllers@sb3-strict',
    variant: 'sb3',
    treePath: 'kotlin/spring-controllers@sb3-strict/integration/kitchen-sink',
    delegateDirs: ['common', 'strict'],
  },
  {
    id: 'spring-controllers@sb4-strict',
    profile: 'spring-controllers@sb4-strict',
    variant: 'sb4',
    treePath: 'kotlin/spring-controllers@sb4-strict/integration/kitchen-sink',
    delegateDirs: ['common', 'strict'],
  },
];

/**
 * The class Gradle's `application` plugin runs.
 *
 * Kotlin names a file's top-level declarations class after the file, so `GoastApplication.kt`'s `main`
 * lands in `goast.server.GoastApplicationKt`. A constant rather than a literal in the template, so the
 * build script and Task 4's file name cannot drift apart into a build that compiles and then fails at
 * `run` with a class-not-found.
 */
export const MAIN_CLASS = 'goast.server.GoastApplicationKt';

/** Container path the committed `test/output/` tree is mounted at, read-only. */
export const TREE_MOUNT = '/output';
/** Container path the handwritten delegate sources are mounted at, read-only. */
export const DELEGATE_MOUNT = '/delegates';
/** Container path the synthesized Gradle project is mounted at, writable. */
export const WORK_MOUNT = '/work';
/** Port the Spring Boot app listens on inside the container. Boot's default; nothing overrides it. */
export const SERVER_PORT = 8080;
/** Host path of the delegate sources, mounted at {@link DELEGATE_MOUNT}. */
export const DELEGATES_DIR: string = join(repoRootDir, 'test', 'integration', 'spring-controllers', 'delegates');

/**
 * Runtime coordinates the generated tree never imports but the application cannot start without.
 *
 * Deliberately not added to `kotlinDependenciesFor`'s `spring-controllers` entry: that table is tier
 * 3's compile classpath, its diagnostics are committed snapshots, and widening it would change what
 * tier 3 resolves for a reason that has nothing to do with compiling. This is the same split
 * `RUNTIME_COROUTINE_DEPENDENCIES` makes in the client direction's build module.
 *
 * - `spring-boot-starter-webflux` brings `spring-boot`, `spring-boot-autoconfigure`, Netty and Reactor
 *   Netty. WebFlux and not MVC because the generated code is reactive by construction: every handler is
 *   a `suspend fun` and `uploadPetPhoto` takes `org.springframework.http.codec.multipart.FilePart`.
 * - `jackson-module-kotlin` is what lets Jackson construct a generated `data class` that has no
 *   no-argument constructor. Boot's own starters do not include it. The coordinate moved groups for
 *   Jackson 3, which is why this is per-variant — the same split `kotlinDependenciesFor`'s
 *   `okhttp3-clients` entry documents.
 * - `kotlinx-coroutines-reactor` is what bridges a Reactor publisher into a suspension, which the
 *   delegates need to read a `FilePart`'s content, and what Spring uses to invoke a `suspend` handler.
 */
export const SERVER_RUNTIME_DEPENDENCIES: Readonly<Record<'sb3' | 'sb4', readonly string[]>> = {
  sb3: [
    'add("implementation", "org.springframework.boot:spring-boot-starter-webflux")',
    'add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")',
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")',
  ],
  sb4: [
    'add("implementation", "org.springframework.boot:spring-boot-starter-webflux")',
    'add("implementation", "tools.jackson.module:jackson-module-kotlin")',
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")',
  ],
};

/**
 * Generates the settings and build scripts for one unit's single-project Gradle build.
 *
 * `treeMount` and `delegateMount` are *container* paths: the caller bind-mounts the committed
 * `test/output/` tree and the delegate sources and passes their in-container mount points here.
 *
 * The generated tree and the delegate directories go into the *same* source set, so a delegate's
 * `import com.openapi.generated.api.PetsApiDelegate` resolves with no dependency edge between them —
 * they are one compilation unit.
 */
export function synthesizeServerBuild(
  unit: ServerUnit,
  treeMount: string,
  delegateMount: string,
): { settings: string; build: string } {
  const settings = 'rootProject.name = "server"\n';

  const srcDirs = [
    `${treeMount}/${unit.treePath}`,
    ...unit.delegateDirs.map((dir) => `${delegateMount}/${dir}`),
  ];

  const build = [
    'plugins {',
    '    kotlin("jvm") version "2.2.0"',
    '    application',
    '}',
    '',
    // Never resolved — the image runs `--offline` — but Gradle refuses to configure dependency
    // resolution at all without one, and the resulting "no repositories defined" failure reads exactly
    // like the missing-dependency failure this build must never be confused with.
    'repositories { mavenCentral() }',
    '',
    'dependencies {',
    `    add("implementation", platform("${KOTLIN_BOM[unit.variant]}"))`,
    ...kotlinDependenciesFor('spring-controllers', unit.variant).map((line) => `    ${line}`),
    ...SERVER_RUNTIME_DEPENDENCIES[unit.variant].map((line) => `    ${line}`),
    '}',
    '',
    `sourceSets["main"].kotlin.srcDirs(${srcDirs.map((dir) => `"${dir}"`).join(', ')})`,
    '',
    'application {',
    `    mainClass.set("${MAIN_CLASS}")`,
    '}',
  ].join('\n') + '\n';

  return { settings, build };
}
```

- [ ] **Step 4: Run the tests**

```bash
deno test -A test/integration/spring-controllers/build.test.ts && deno fmt --check && deno lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add test/integration/spring-controllers/build.ts test/integration/spring-controllers/build.test.ts
git commit -m "test: synthesize the Gradle build that runs a generated Kotlin server"
```

---

### Task 4: The application, the exception handler, and a boot that proves the plumbing

**Files:**

- Create: `test/integration/spring-controllers/delegates/common/GoastApplication.kt`
- Create: `test/integration/spring-controllers/delegates/common/Expectations.kt`
- Create: `test/integration/spring-controllers/delegates/common/GoastExceptionHandler.kt`
- Create: `test/integration/spring-controllers/boot.test.ts`
- Modify: `test/docker/kotlin/warmup/build.gradle.kts`

**Interfaces:**

- Consumes: `SERVER_UNITS`, `synthesizeServerBuild` (Task 3); `startContainer`, `waitForHttpReady` (Task 2);
  `buildImage`, `repoRootDir`, `requireDocker` from `@goast/test-harness`.
- Produces: the Kotlin symbols Tasks 5 and 6 use — `GoastMismatch`, `GoastUnexpressible`, `expectParam`, `json`,
  `readPart` — and a passing `boot.test.ts`.

**Context — this is the risk gate for the whole phase.** Everything downstream assumes a generated
`spring-controllers` tree can be compiled and booted offline inside the `kotlin` image and reached from the host. This
task proves exactly that and nothing more: no per-operation delegates, no cases, no artifacts. If it fails, it fails
cheaply and with the failure isolated to infrastructure.

**Warming the cache.** Adding a coordinate to `test/docker/kotlin/warmup/build.gradle.kts` changes the build context
hash, so `buildImage` derives a new tag and rebuilds the image from scratch. That is correct and intended, and it is
slow (the `RUN gradle warm` layer downloads the Spring Boot runtime for both lines). Read that file's long comment
block before editing — especially the stated superset invariant and the rule that a variant-specific coordinate goes
*after* the `for` loop, never inside it. `spring-boot-starter-webflux` is managed by both BOMs, so it goes in the loop;
the two `jackson-module-kotlin` coordinates are already warmed per-variant below the loop and need no change.

**Why no `kotlin("plugin.spring")`.** Spring needs to subclass a `@Configuration` class to intercept its `@Bean`
methods, and Kotlin classes are final. `@SpringBootApplication(proxyBeanMethods = false)` turns that interception off,
so nothing needs to be open. The delegates are `@Component`s, which are never proxied, and `@Validated` on the
generated interfaces is inert because Boot only auto-configures method validation when a JSR-303 *provider* is on the
classpath and this build has only the API.

- [ ] **Step 1: Write `Expectations.kt`**

```kotlin
package goast.server

import kotlinx.coroutines.reactive.awaitSingle
import org.springframework.core.io.buffer.DataBufferUtils
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart

/**
 * Thrown when a parameter Spring bound is not what the case table says the request carried.
 *
 * The delegates are the server direction's assertion, the way a typed `client.createPet(Pet(name = "x"))`
 * call is the client direction's: the only channel a test on the host can observe is the HTTP response,
 * so a mis-bound parameter has to become a *distinguishable response* or it is not observable at all.
 * `GoastExceptionHandler` renders this as `599` with the detail as a plain-text body, which lands
 * verbatim in the committed deviation artifact.
 */
class GoastMismatch(val detail: String) : RuntimeException(detail)

/**
 * Thrown when the generated return type cannot express the response the case table declares.
 *
 * One real case: `spring-controllers@sb3-strict`/`@sb4-strict` generate no response-entity factory for
 * `getWidget`'s `default` response, and the primary constructor is `private`, so the `503` that
 * `getWidget/unexpectedError` declares is unreachable from a strict delegate. Signalling it explicitly
 * keeps the artifact honest: substituting some other available status would record a smaller, wrong
 * deviation and hide the actual gap.
 */
class GoastUnexpressible(val detail: String) : RuntimeException(detail)

/** Asserts one bound parameter against the case table, and returns it so callers can chain. */
fun <T> expectParam(name: String, expected: T, actual: T): T {
    if (expected != actual) throw GoastMismatch("$name expected <$expected> but was <$actual>")
    return actual
}

/** A JSON response with an explicit status, for the lenient flavour. */
fun <T : Any> json(status: Int, body: T): ResponseEntity<T> =
    ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body)

/** Reads a multipart file part's bytes as a UTF-8 string, so its content can be asserted. */
suspend fun readPart(part: FilePart): String {
    val buffer = DataBufferUtils.join(part.content()).awaitSingle()
    try {
        val bytes = ByteArray(buffer.readableByteCount())
        buffer.read(bytes)
        return String(bytes, Charsets.UTF_8)
    } finally {
        DataBufferUtils.release(buffer)
    }
}
```

- [ ] **Step 2: Write `GoastExceptionHandler.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.ApiExceptionHandler
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * Turns a delegate's own failure into a deterministic response.
 *
 * Every generated controller method wraps its delegate call in
 * `catch (e: Throwable) { return getExceptionHandler()?.handleApiException(e) ?: throw e }`, and every
 * generated `*ApiController` takes an `@Autowired(required = false) ApiExceptionHandler?`, so a single
 * bean here is wired into all of them.
 *
 * Without it the rethrow reaches WebFlux's default error handling, whose body carries a `timestamp` and
 * a `requestId` — nondeterministic values that would make every deviation artifact churn on each run.
 *
 * `handleApiException` returns an unconstrained `ResponseEntity<*>` in the strict flavour as well as the
 * lenient one (the generated `ApiExceptionHandler.kt` is byte-identical across all four profiles), which
 * is what makes one handler enough. That freedom is deliberately *not* used to work around the strict
 * flavour's missing factories: see `GoastUnexpressible`.
 */
@Component
class GoastExceptionHandler : ApiExceptionHandler {
    override suspend fun handleApiException(exception: Throwable): ResponseEntity<*> = when (exception) {
        is GoastMismatch -> plain(599, "MISMATCH ${exception.detail}")
        is GoastUnexpressible -> plain(598, "UNEXPRESSIBLE ${exception.detail}")
        else -> plain(597, "UNEXPECTED ${exception::class.java.name}: ${exception.message}")
    }

    private fun plain(status: Int, body: String): ResponseEntity<String> =
        ResponseEntity.status(status).contentType(MediaType.TEXT_PLAIN).body(body)
}
```

- [ ] **Step 3: Write `GoastApplication.kt`**

```kotlin
package goast.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
 * The application under test: generated controllers, handwritten delegates, nothing else.
 *
 * `proxyBeanMethods = false` is what removes the need for the Kotlin `all-open` compiler plugin —
 * Spring would otherwise have to subclass this final Kotlin class to intercept `@Bean` methods, and
 * this class declares none.
 *
 * `scanBasePackages` names both halves explicitly: the generated `@Controller` classes live in
 * `com.openapi.generated.api`, which is not under this class's own package, so the default
 * "scan my package and below" would find the delegates and none of the controllers, and every route
 * would 404.
 */
@SpringBootApplication(
    proxyBeanMethods = false,
    scanBasePackages = ["goast.server", "com.openapi.generated.api"],
)
class GoastApplication

fun main(args: Array<String>) {
    runApplication<GoastApplication>(*args)
}
```

**If `org.springframework.boot.runApplication` or `SpringBootApplication` moved package in Spring Boot 4.0**, the
`sb4` units will fail to compile on the import. Do not paper over it: split this one file into `common-sb3/` and
`common-sb4/` directories, add them to the matching `ServerUnit.delegateDirs`, and record the difference in the task
report — that split is exactly what `lenient-sb3`/`lenient-sb4` already models.

- [ ] **Step 4: Warm the Spring Boot server runtime**

In `test/docker/kotlin/warmup/build.gradle.kts`, inside the `for (configurationName in listOf("sb3", "sb4"))` loop,
after the two `kotlinx-coroutines` lines, add:

```kotlin
        // Tier 4's server direction *runs* a generated `spring-controllers` tree as a real Spring Boot
        // application, which needs the whole WebFlux runtime — `spring-boot`, `spring-boot-autoconfigure`,
        // Netty, Reactor Netty — none of which any generated file imports, so tier 3 never resolves it and
        // `kotlinDependenciesFor` deliberately does not list it. Managed by both BOMs, hence inside this
        // loop rather than in a variant slot below. See `SERVER_RUNTIME_DEPENDENCIES` in
        // `test/integration/spring-controllers/build.ts` for the consuming end.
        add(configurationName, "org.springframework.boot:spring-boot-starter-webflux")
```

**And close a warm-cache gap phase 6a's final review found, in the same edit.** `RUNTIME_JSON_CODEC_DEPENDENCIES` in
`test/integration/kotlin-clients/build.ts` declares `com.fasterxml.jackson.core:jackson-databind` (sb3) and
`tools.jackson.core:jackson-databind` (sb4), and **neither is named in the warmup** — both resolve only transitively,
through the `jackson-module-kotlin` declarations that exist for the *okhttp3* family. That works today and was verified
against the warm image, but it is one-directional: if a future generator change made `okhttp3-clients@sb3` stop
importing `com.fasterxml.jackson.databind` and the module coordinate were dropped from the warmup, the reactive tier-4
units would silently lose their runtime JSON codec, tier 3 would stay green because it never runs code, and the only
symptom would be `test:integration:kotlin:check` dying on an offline resolution error. Worse, `hashBuildContext` hashes
only `test/docker/kotlin/**`, so editing `build.ts` never rebuilds the image and the drift stays invisible until then.

Add both, after the loop, against their own variant — `tools.jackson` cannot go in the loop because the sb3 BOM does
not manage it:

```kotlin
    // Runtime-only, for tier 4's reactive client units: `spring-reactive-web-clients` imports no Jackson
    // databind class (so `kotlinDependenciesFor` rightly omits it), but WebFlux's default JSON codecs need
    // one at run time, and Gradle does not pull `spring-web`'s *optional* Maven dependency on it. See
    // `RUNTIME_JSON_CODEC_DEPENDENCIES` in `test/integration/kotlin-clients/build.ts`. Named explicitly
    // rather than left to arrive transitively through the okhttp3 family's `jackson-module-kotlin`: that
    // route works but couples this family's runtime to another family's compile-time needs, and phase 6a's
    // final review flagged it as a gap that would surface only as an offline resolution failure.
    sb3("com.fasterxml.jackson.core:jackson-databind")
    sb4("tools.jackson.core:jackson-databind")
```

Both are BOM-managed and version-less, exactly like the platform imports beside them, so this adds nothing new to
download beyond what is already in the cache — but it makes the dependency explicit rather than incidental.

- [ ] **Step 5: Write the boot gate**

Create `test/integration/spring-controllers/boot.test.ts`:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, startContainer, waitForHttpReady } from '@goast/test-harness';

import {
  DELEGATE_MOUNT,
  DELEGATES_DIR,
  SERVER_PORT,
  SERVER_UNITS,
  synthesizeServerBuild,
  TREE_MOUNT,
  WORK_MOUNT,
} from './build.ts';

/** Same gate as the rest of tier 4's Docker legs: `deno task test` must never start a container. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');

if (enabled) await requireDocker();

if (enabled) {
  describe('integration/spring-controllers boot', () => {
    // One unit, not all four: this asserts the *infrastructure* — offline resolution, the `run` task, the
    // published port, readiness polling, and that the generated controllers are component-scanned and
    // mapped. Nothing here is profile-specific, and `integration.test.ts` covers all four anyway.
    const unit = SERVER_UNITS[0];

    it('boots the generated server and routes a request to it', async () => {
      const image = await buildImage('kotlin', CONTEXT_DIR);
      const { settings, build } = synthesizeServerBuild(unit, TREE_MOUNT, DELEGATE_MOUNT);
      const workDir = await Deno.makeTempDir({ prefix: 'goast-server-' });

      try {
        await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
        await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

        const container = await startContainer({
          image,
          // The image's ENTRYPOINT pins tier 3's `compileKotlin`; this needs `run`.
          entrypoint: 'gradle',
          args: ['--no-daemon', '--offline', 'run', '--quiet'],
          mounts: [
            { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
            { source: DELEGATES_DIR, target: DELEGATE_MOUNT, readOnly: true },
            { source: workDir, target: WORK_MOUNT },
          ],
          workdir: WORK_MOUNT,
          publish: [{ containerPort: SERVER_PORT }],
        });

        try {
          const port = await container.hostPort(SERVER_PORT);
          await waitForHttpReady(`http://127.0.0.1:${port}/__goast-readiness`, {
            timeoutMs: 8 * 60 * 1000,
            isAlive: () => container.running(),
            describeDeath: () => container.output(),
          });

          const response = await fetch(`http://127.0.0.1:${port}/pets/abc`);
          await response.body?.cancel();

          // Not a specific status: this file has to keep passing once Task 5 replaces the generated
          // `501` defaults with real delegates that answer `200`. `404` is the failure that matters —
          // it means the generated controllers were never mapped, which is the one thing about this
          // wiring that could silently be wrong while the app still starts.
          expect(response.status, `GET /pets/abc\n${container.output()}`).not.toBe(404);
        } finally {
          await container.stop();
        }
      } finally {
        // Best effort, never allowed to throw: the container writes root-owned `build/` and `.gradle/`
        // trees into this bind mount on Linux, and a throw from here would replace whatever the run
        // actually determined — including a legitimate pass — with an unrelated `PermissionDenied`.
        await Deno.remove(workDir, { recursive: true }).catch((error: unknown) => {
          console.warn(`could not remove ${workDir}: ${error instanceof Error ? error.message : error}`);
        });
      }
    });
  });
}
```

- [ ] **Step 6: Run it**

```bash
deno test -A test/integration/spring-controllers && deno fmt --check && deno lint
```

Expected: the build tests pass, the boot test is skipped (no `GOAST_INTEGRATION`). Then the real thing — this rebuilds
the `kotlin` image, which is slow:

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/spring-controllers/boot.test.ts
```

Expected: PASS. Report the wall-clock time in the task report.

Debugging guide, in the order these actually fail:

- `No cached version available for offline mode` names the coordinate that is not warm. Add it to the warmup loop (or
  to a variant slot if only one BOM manages it) and re-run — the image rebuilds automatically because the tag is a
  content hash.
- The container exits during startup: `waitForHttpReady` will surface the log. A Kotlin compile error is in the
  handwritten delegates or the synthesized build, never in the generated tree (tier 3 proves it compiles).
- Readiness times out while the container is still alive: check the log for a bind failure or a Netty channel error.
- `GET /pets/abc` returns `404`: the generated controllers were not mapped. Check `scanBasePackages` first, then
  whether the interface's method-level `@RequestMapping` annotations are visible on the implementing class — Spring
  finds interface-default-method mappings via `MethodIntrospector`, which is how this delegate pattern normally works,
  but Kotlin's `-Xjvm-default` mode affects what the implementing class actually declares. Investigate before working
  around; a workaround that adds annotations to handwritten code would make this phase test the workaround.

- [ ] **Step 8: Commit**

```bash
git add test/docker/kotlin/warmup/build.gradle.kts test/integration/spring-controllers
git commit -m "test: boot a generated Kotlin server in the kotlin image"
```

---

### Task 5: The lenient delegates

**Files:**

- Create: `test/integration/spring-controllers/delegates/lenient/PetsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/lenient/ParamsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/lenient/BlobsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/lenient-sb3/WidgetsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/lenient-sb4/WidgetsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/common/CaseData.kt`

**Interfaces:**

- Consumes: `GoastMismatch`, `GoastUnexpressible`, `expectParam`, `json`, `readPart` (Task 4).
- Produces: `@Component` beans implementing `PetsApiDelegate`, `ParamsApiDelegate`, `BlobsApiDelegate`,
  `WidgetsApiDelegate` for the two non-strict units; and in `CaseData.kt` the two shared helpers
  `widgetCase(id: String): Pair<Int, Any>` and `styleMatrixCase(...)` that Task 6's strict delegates reuse.

**Context.** Every value below comes from `test/cases/cases.ts`. Verify each one against that file as you write it; if
one disagrees, the table wins and the disagreement goes in the task report.

Nothing here is allowed to make a case pass that would otherwise fail. Two specific temptations to refuse:

- Do **not** add `spring.jackson.default-property-inclusion=non_null` or an `@JsonInclude` anywhere. The generated
  models declare no inclusion, so a `Pet(id = "abc", name = "Rex")` response serializes its nine unset optional fields
  as explicit `null`s, and every `Pet`-bodied case will therefore produce a deviation artifact. That is a real finding
  about the generated code (Task 8 registers it) and configuring it away would delete the finding.
- Do **not** relax an assertion because it fails. A failing `expectParam` is this phase working.

- [ ] **Step 1: Write `CaseData.kt`**

```kotlin
package goast.server

import com.openapi.generated.model.Error
import com.openapi.generated.model.Widget

/**
 * The (status, body) pair `getWidget` must answer for one widget id.
 *
 * Shared by the lenient and strict `WidgetsDelegate`s, which differ only in how they turn a pair into a
 * response — and, for the `503`, in whether they can at all.
 *
 * The `id` is what discriminates: `getWidget` is one operation with five cases, and the case table gives
 * each a distinct path parameter. That makes this function both the response selector *and* the
 * assertion that the path parameter bound correctly — an `id` no case declares can only mean the
 * generated server bound something other than what the reference client sent.
 *
 * `com.openapi.generated.model.Error` is imported explicitly because it shadows `kotlin.Error`.
 */
fun widgetCase(id: String): Pair<Int, Any> = when (id) {
    "w1" -> 200 to Widget(id = "w1", name = "Sprocket", price = 9.99)
    "bad" -> 400 to Error(message = "Invalid widget id", code = 400)
    "missing" -> 404 to Error(message = "Widget not found", code = 404)
    "boom" -> 500 to Error(message = "Internal error", code = 500)
    "other" -> 503 to Error(message = "Unexpected error", code = 503)
    else -> throw GoastMismatch("getWidget.id was <$id>, which no case declares")
}

/**
 * Asserts that exactly one of `styleMatrix`'s three query parameters arrived, carrying `["a", "b"]`.
 *
 * The three cases (`form` exploded, `form` unexploded, `spaceDelimited`) each send one parameter and all
 * declare the same `200` response, so which one arrived is the only thing that distinguishes them —
 * and the decoded value is the whole point: `formUnexploded=a,b` and `spaceDelimited=a b` must both
 * arrive as two items, and a server that splits only on commas gets the second one wrong.
 *
 * The "exactly one" check is not ceremony: it catches a parameter emitted into the wrong slot, and it
 * distinguishes "absent" from "present but empty" in its own message, which is the difference between a
 * server that dropped a parameter and one that failed to decode it.
 */
fun styleMatrixCase(
    formExploded: List<String>?,
    formUnexploded: List<String>?,
    spaceDelimited: List<String>?,
) {
    val present = listOf(
        "formExploded" to formExploded,
        "formUnexploded" to formUnexploded,
        "spaceDelimited" to spaceDelimited,
    ).filter { it.second != null }

    if (present.size != 1) {
        throw GoastMismatch(
            "styleMatrix expected exactly one non-null parameter but got " +
                "formExploded=<$formExploded> formUnexploded=<$formUnexploded> spaceDelimited=<$spaceDelimited>",
        )
    }

    val (name, values) = present.single()
    expectParam("styleMatrix.$name", listOf("a", "b"), values)
}
```

- [ ] **Step 2: Write `lenient/PetsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.PetsApiDelegate
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Component

/**
 * `PetsApiDelegate` for the two non-strict units, one method per case group.
 *
 * Each method asserts what the case table says the request carried, then returns the declared response.
 * `updatePet` serves two cases — `updatePet/json` and `updatePet/form` — with one body: both send the
 * same `PetUpdate` values through different content types, and both declare the same response, so the
 * delegate cannot and need not tell them apart. Whether the *form* encoding was decoded at all still
 * shows up: a server that cannot read it never reaches this method.
 */
@Component
class PetsDelegate : PetsApiDelegate {
    override suspend fun getPet(id: String): ResponseEntity<Pet> {
        expectParam("getPet.id", "abc", id)
        return json(200, Pet(id = "abc", name = "Rex"))
    }

    override suspend fun updatePet(id: String, petUpdate: PetUpdate): ResponseEntity<Pet> {
        expectParam("updatePet.id", "abc", id)
        expectParam("updatePet.petUpdate", PetUpdate(name = "Rex", age = 4), petUpdate)
        return json(200, Pet(id = "abc", name = "Rex", age = 4))
    }

    override suspend fun deletePet(id: String): ResponseEntity<Unit> {
        expectParam("deletePet.id", "abc", id)
        return ResponseEntity.status(204).build()
    }

    override suspend fun createPet(pet: Pet): ResponseEntity<Pet> {
        expectParam("createPet.pet", Pet(id = "new1", name = "Fido"), pet)
        return json(201, Pet(id = "new1", name = "Fido"))
    }

    override suspend fun uploadPetPhoto(id: String, file: FilePart, caption: String?): ResponseEntity<Unit> {
        expectParam("uploadPetPhoto.id", "abc", id)
        expectParam("uploadPetPhoto.file.filename", "photo.png", file.filename())
        expectParam("uploadPetPhoto.file.content", "binarydata", readPart(file))
        expectParam("uploadPetPhoto.caption", "A good boy", caption)
        return ResponseEntity.status(200).build()
    }

    override suspend fun addPetNote(id: String, string: String): ResponseEntity<Pet> {
        expectParam("addPetNote.id", "abc", id)
        expectParam("addPetNote.string", "plain text body", string)
        return json(200, Pet(id = "abc", name = "Rex"))
    }
}
```

If `ResponseEntity.status(204).build()` does not infer `ResponseEntity<Unit>`, write `build<Unit>()`.

- [ ] **Step 3: Write `lenient/ParamsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.ParamsApiDelegate
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `ParamsApiDelegate` for the two non-strict units.
 *
 * `allLocations` asserts three of the four parameter locations the case declares. The fourth — the
 * spec's `session` cookie — has no parameter in the generated signature at all, so there is nothing to
 * assert and an ignored cookie changes no response: that case can conform on the wire while the
 * parameter is still dropped. Recorded in the plan and in `test/README.md`, not worked around here.
 */
@Component
class ParamsDelegate : ParamsApiDelegate {
    override suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?,
    ): ResponseEntity<Unit> {
        expectParam("allLocations.pathParam", "loc1", pathParam)
        expectParam("allLocations.queryParam", "q1", queryParam)
        expectParam("allLocations.xHeaderParam", "h1", xHeaderParam)
        return ResponseEntity.status(200).build()
    }

    override suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?,
    ): ResponseEntity<Unit> {
        styleMatrixCase(formExploded, formUnexploded, spaceDelimited)
        return ResponseEntity.status(200).build()
    }

    override suspend fun pathStyleSimple(values: List<String>): ResponseEntity<Unit> {
        expectParam("pathStyleSimple.values", listOf("a", "b"), values)
        return ResponseEntity.status(200).build()
    }

    override suspend fun getEncoded(value: String, raw: String?): ResponseEntity<Unit> {
        // The encoding case: the reference client sends `/encoded/abc%20def%2Fx?raw=a%26b%3Dc`, so a
        // correct server hands the delegate the *decoded* values — a space and a slash inside one path
        // segment, and an `&`/`=` inside one query value.
        expectParam("getEncoded.value", "abc def/x", value)
        expectParam("getEncoded.raw", "a&b=c", raw)
        return ResponseEntity.status(200).build()
    }
}
```

- [ ] **Step 4: Write `lenient/BlobsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.BlobsApiDelegate
import com.openapi.generated.model.BlobRef
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `BlobsApiDelegate` for the two non-strict units.
 *
 * The generated signature binds an `application/octet-stream` request body to a `String` — the
 * generator's choice, not this test's — so the assertion is against the bytes `"hello"` the case sends,
 * decoded as UTF-8.
 */
@Component
class BlobsDelegate : BlobsApiDelegate {
    override suspend fun uploadBlob(string: String): ResponseEntity<BlobRef> {
        expectParam("uploadBlob.string", "hello", string)
        return json(201, BlobRef(id = "blob1"))
    }
}
```

- [ ] **Step 5: Write the two `WidgetsDelegate.kt` files**

`delegates/lenient-sb3/WidgetsDelegate.kt`:

```kotlin
package goast.server

import com.openapi.generated.api.WidgetsApiDelegate
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `WidgetsApiDelegate` for `spring-controllers@sb3`.
 *
 * The `@sb4` twin in `../lenient-sb4/` is identical except for one type argument: the generated
 * interface returns `ResponseEntity<Any?>` under `@sb3` and `ResponseEntity<Any>` under `@sb4`, and
 * `ResponseEntity<T>` is invariant in `T`, so no single override satisfies both. That one line is the
 * entire reason the lenient flavour has per-variant source directories; everything else the two units
 * need is shared. The case data itself lives in `CaseData.kt#widgetCase`, so the duplication here is
 * the signature, not the behaviour.
 */
@Component
class WidgetsDelegate : WidgetsApiDelegate {
    override suspend fun getWidget(id: String): ResponseEntity<Any?> {
        val (status, body) = widgetCase(id)
        var builder = ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
        // Declared as a response header on the 200 only, so it is sent on the 200 only.
        if (status == 200) builder = builder.header("X-Rate-Limit", "42")
        return builder.body<Any?>(body)
    }
}
```

`delegates/lenient-sb4/WidgetsDelegate.kt` — byte-identical except the class doc's first line names `@sb4` and the
signature and `body` call use `Any` instead of `Any?`:

```kotlin
    override suspend fun getWidget(id: String): ResponseEntity<Any> {
        val (status, body) = widgetCase(id)
        var builder = ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
        if (status == 200) builder = builder.header("X-Rate-Limit", "42")
        return builder.body<Any>(body)
    }
```

- [ ] **Step 6: Verify both lenient units compile and boot**

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/spring-controllers/boot.test.ts
```

Expected: PASS, and `GET /pets/abc` now answers `200` rather than `501`. Then check the second lenient unit by
temporarily pointing the boot test at `SERVER_UNITS[1]` — run it, confirm, and **revert that edit before
committing**.

- [ ] **Step 7: Commit**

```bash
git add test/integration/spring-controllers/delegates
git commit -m "test: implement the lenient spring-controllers delegates"
```

---

### Task 6: The strict delegates

**Files:**

- Create: `test/integration/spring-controllers/delegates/strict/PetsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/strict/ParamsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/strict/BlobsDelegate.kt`
- Create: `test/integration/spring-controllers/delegates/strict/WidgetsDelegate.kt`

**Interfaces:**

- Consumes: everything Tasks 4 and 5 produced, including `widgetCase` and `styleMatrixCase` from `CaseData.kt`.
- Produces: the same four `@Component` beans for `spring-controllers@sb3-strict` and `@sb4-strict`.

**Context.** `strictResponseEntities` changes every delegate return type from `ResponseEntity<X>` to a per-operation
nested class whose primary constructor is `private` and whose only public entry points are the factories listed in
this plan's reference table. The assertions are identical to Task 5's — copy them, since a diverging assertion between
the flavours would be a bug, not a refactor — and only the return expressions change.

One case cannot be expressed: `getWidget/unexpectedError` declares `503`, servable only by the spec's `default`
response, and `GetWidgetResponseEntity` has no factory for it. That is what `GoastUnexpressible` is for.

Do **not** route around it by returning `internalServerError(...)` (a wrong-but-available status), and do **not** use
`GoastExceptionHandler`'s unconstrained `ResponseEntity<*>` to emit the `503` from the handler. Either would record a
deviation that misdescribes the gap.

- [ ] **Step 1: Write `strict/PetsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.PetsApi.AddPetNoteResponseEntity
import com.openapi.generated.api.PetsApi.CreatePetResponseEntity
import com.openapi.generated.api.PetsApi.DeletePetResponseEntity
import com.openapi.generated.api.PetsApi.GetPetResponseEntity
import com.openapi.generated.api.PetsApi.UpdatePetResponseEntity
import com.openapi.generated.api.PetsApi.UploadPetPhotoResponseEntity
import com.openapi.generated.api.PetsApiDelegate
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Component

/**
 * `PetsApiDelegate` for the two `-strict` units.
 *
 * Assertions are character-for-character the lenient delegate's: only the return expressions differ,
 * because `strictResponseEntities` replaces `ResponseEntity<Pet>` with a nested class whose primary
 * constructor is private. The factories used here are the only ones the generated code offers for these
 * operations, and each corresponds to a status the spec declares — which is the feature: an undeclared
 * status is unreachable by construction.
 *
 * One source set serves both `@sb3-strict` and `@sb4-strict`: their generated `*ApiDelegate.kt` files
 * are byte-identical, and the `*Api.kt` differences (`<T>` vs `<T : Any>`, `Unit?` vs `Unit`) do not
 * reach the factory signatures called here.
 */
@Component
class PetsDelegate : PetsApiDelegate {
    override suspend fun getPet(id: String): GetPetResponseEntity<*> {
        expectParam("getPet.id", "abc", id)
        return GetPetResponseEntity.ok(Pet(id = "abc", name = "Rex"))
    }

    override suspend fun updatePet(id: String, petUpdate: PetUpdate): UpdatePetResponseEntity<*> {
        expectParam("updatePet.id", "abc", id)
        expectParam("updatePet.petUpdate", PetUpdate(name = "Rex", age = 4), petUpdate)
        return UpdatePetResponseEntity.ok(Pet(id = "abc", name = "Rex", age = 4))
    }

    override suspend fun deletePet(id: String): DeletePetResponseEntity<*> {
        expectParam("deletePet.id", "abc", id)
        return DeletePetResponseEntity.noContent()
    }

    override suspend fun createPet(pet: Pet): CreatePetResponseEntity<*> {
        expectParam("createPet.pet", Pet(id = "new1", name = "Fido"), pet)
        return CreatePetResponseEntity.created(Pet(id = "new1", name = "Fido"))
    }

    override suspend fun uploadPetPhoto(
        id: String,
        file: FilePart,
        caption: String?,
    ): UploadPetPhotoResponseEntity<*> {
        expectParam("uploadPetPhoto.id", "abc", id)
        expectParam("uploadPetPhoto.file.filename", "photo.png", file.filename())
        expectParam("uploadPetPhoto.file.content", "binarydata", readPart(file))
        expectParam("uploadPetPhoto.caption", "A good boy", caption)
        return UploadPetPhotoResponseEntity.ok()
    }

    override suspend fun addPetNote(id: String, string: String): AddPetNoteResponseEntity<*> {
        expectParam("addPetNote.id", "abc", id)
        expectParam("addPetNote.string", "plain text body", string)
        return AddPetNoteResponseEntity.ok(Pet(id = "abc", name = "Rex"))
    }
}
```

- [ ] **Step 2: Write `strict/ParamsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.ParamsApi.AllLocationsResponseEntity
import com.openapi.generated.api.ParamsApi.GetEncodedResponseEntity
import com.openapi.generated.api.ParamsApi.PathStyleSimpleResponseEntity
import com.openapi.generated.api.ParamsApi.StyleMatrixResponseEntity
import com.openapi.generated.api.ParamsApiDelegate
import org.springframework.stereotype.Component

/** `ParamsApiDelegate` for the two `-strict` units. Assertions as in the lenient delegate. */
@Component
class ParamsDelegate : ParamsApiDelegate {
    override suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?,
    ): AllLocationsResponseEntity<*> {
        expectParam("allLocations.pathParam", "loc1", pathParam)
        expectParam("allLocations.queryParam", "q1", queryParam)
        expectParam("allLocations.xHeaderParam", "h1", xHeaderParam)
        return AllLocationsResponseEntity.ok()
    }

    override suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?,
    ): StyleMatrixResponseEntity<*> {
        styleMatrixCase(formExploded, formUnexploded, spaceDelimited)
        return StyleMatrixResponseEntity.ok()
    }

    override suspend fun pathStyleSimple(values: List<String>): PathStyleSimpleResponseEntity<*> {
        expectParam("pathStyleSimple.values", listOf("a", "b"), values)
        return PathStyleSimpleResponseEntity.ok()
    }

    override suspend fun getEncoded(value: String, raw: String?): GetEncodedResponseEntity<*> {
        expectParam("getEncoded.value", "abc def/x", value)
        expectParam("getEncoded.raw", "a&b=c", raw)
        return GetEncodedResponseEntity.ok()
    }
}
```

- [ ] **Step 3: Write `strict/BlobsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.BlobsApi.UploadBlobResponseEntity
import com.openapi.generated.api.BlobsApiDelegate
import com.openapi.generated.model.BlobRef
import org.springframework.stereotype.Component

/** `BlobsApiDelegate` for the two `-strict` units. Assertion as in the lenient delegate. */
@Component
class BlobsDelegate : BlobsApiDelegate {
    override suspend fun uploadBlob(string: String): UploadBlobResponseEntity<*> {
        expectParam("uploadBlob.string", "hello", string)
        return UploadBlobResponseEntity.created(BlobRef(id = "blob1"))
    }
}
```

- [ ] **Step 4: Write `strict/WidgetsDelegate.kt`**

```kotlin
package goast.server

import com.openapi.generated.api.WidgetsApi.GetWidgetResponseEntity
import com.openapi.generated.api.WidgetsApiDelegate
import com.openapi.generated.model.Error
import com.openapi.generated.model.Widget
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap

/**
 * `WidgetsApiDelegate` for the two `-strict` units.
 *
 * One source file serves both Boot lines here, unlike the lenient flavour: the strict return type is
 * `GetWidgetResponseEntity<*>` in both, so the `Any?`/`Any` split that forces `lenient-sb3`/
 * `lenient-sb4` apart does not arise.
 *
 * `getWidget/unexpectedError` declares `503`, which only the spec's `default` response can serve, and
 * `GetWidgetResponseEntity` has no factory for it — `ok`, `badRequest`, `notFound`,
 * `internalServerError`, `unauthorized`, `forbidden` and `notImplemented` are the whole set, and the
 * primary constructor is private. So the strict flavour genuinely cannot express that case, and it says
 * so rather than substituting an available status: a substituted `500` would record a plausible-looking
 * status deviation and bury the real, structural gap.
 */
@Component
class WidgetsDelegate : WidgetsApiDelegate {
    override suspend fun getWidget(id: String): GetWidgetResponseEntity<*> {
        val (status, body) = widgetCase(id)
        return when (status) {
            200 -> GetWidgetResponseEntity.ok(
                body as Widget,
                LinkedMultiValueMap<String, String>().also { it.add("X-Rate-Limit", "42") },
            )
            400 -> GetWidgetResponseEntity.badRequest(body as Error)
            404 -> GetWidgetResponseEntity.notFound(body as Error)
            500 -> GetWidgetResponseEntity.internalServerError(body as Error)
            else -> throw GoastUnexpressible(
                "getWidget cannot answer $status: strictResponseEntities generates no factory for the " +
                    "spec's `default` response, and GetWidgetResponseEntity's constructor is private",
            )
        }
    }
}
```

- [ ] **Step 5: Verify a strict unit compiles and boots**

Temporarily point `boot.test.ts` at the `spring-controllers@sb3-strict` unit, run:

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/spring-controllers/boot.test.ts
```

Expected: PASS with `GET /pets/abc` answering `200`. Repeat for `@sb4-strict`. **Revert the edit before committing.**

- [ ] **Step 6: Commit**

```bash
git add test/integration/spring-controllers/delegates/strict
git commit -m "test: implement the strict spring-controllers delegates"
```

---

### Task 7: Drive every case and record the deviations

**Files:**

- Create: `test/integration/spring-controllers/integration.test.ts`
- Modify: `test/integration/targets.ts`
- Modify: `deno.json`
- Create: `test/wire/spring-controllers@sb3/*.txt` and the three sibling directories (generated, then committed)

**Interfaces:**

- Consumes: `SERVER_UNITS`, `synthesizeServerBuild`, the mount constants (Task 3/4); `startContainer`,
  `waitForHttpReady` (Task 2); `readResponse`, `diffResponse` (Task 1); `issueCase` from
  `test/harness/ref-client.ts`; `casesFor` from `test/cases/cases.ts`; `verifyWireDeviations`, `wireSnapshotFile`,
  `wireRootDir`, `formatDeviations` from `@goast/test-harness`.
- Produces: the committed artifacts and four `WIRE_TARGETS` entries.

**Context.** `test/integration/kotlin-clients/integration.test.ts` is the model — read it first. The server direction
is *simpler* in one important way: attribution needs no heuristics. The client direction had to guess which recorded
request belonged to which case, because a driver issues all its calls and the server sees them out of band; here the
test issues one request per case and holds that case's response in hand. Nothing to attribute, and no surplus bucket.

**Register the targets in this task, not a later one.** `test/integration-tests/orphans.test.ts` builds its expected
file set from `WIRE_TARGETS` and sweeps *all* of `test/wire/`, so artifacts landing under a profile directory that
`WIRE_TARGETS` does not name make the sweep fail. In phase 6a that exact sequencing mistake pushed a red branch. The
artifacts and the registry entries belong in the same commit.

- [ ] **Step 1: Add the four server targets to `test/integration/targets.ts`**

Append to `WIRE_TARGETS`, and update that file's doc comment: the sentence claiming "All entries are `'client'` today"
and that the server direction "arrives with `diffResponse` in a later phase" is now false and must be rewritten to
describe what is actually there.

```ts
  { profile: 'spring-controllers@sb3', direction: 'server' },
  { profile: 'spring-controllers@sb4', direction: 'server' },
  { profile: 'spring-controllers@sb3-strict', direction: 'server' },
  { profile: 'spring-controllers@sb4-strict', direction: 'server' },
```

Keep the note about `wireSnapshotFile` having no direction segment — it is still the reason a profile driven in *both*
directions would need one, and no profile is.

- [ ] **Step 2: Write `integration.test.ts`**

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  buildImage,
  diffResponse,
  formatDeviations,
  issueCase,
  readResponse,
  repoRootDir,
  requireDocker,
  startContainer,
  verifyWireDeviations,
  waitForHttpReady,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import {
  DELEGATE_MOUNT,
  DELEGATES_DIR,
  SERVER_PORT,
  SERVER_UNITS,
  synthesizeServerBuild,
  TREE_MOUNT,
  WORK_MOUNT,
} from './build.ts';

/** Same gate as tier 4's other Docker legs. `deno task test:integration:controllers` sets this. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');

// Checked once, before the first container, rather than inside each `it`: a missing daemon should fail
// immediately, not after this file has already compiled a Gradle project.
if (enabled) await requireDocker();

if (enabled) {
  for (const unit of SERVER_UNITS) {
    describe(`integration/${unit.id}`, () => {
      it('answers every server case and records its deviations', async () => {
        const cases = casesFor(unit.profile, 'server');
        const image = await buildImage('kotlin', CONTEXT_DIR);
        const { settings, build } = synthesizeServerBuild(unit, TREE_MOUNT, DELEGATE_MOUNT);
        const workDir = await Deno.makeTempDir({ prefix: 'goast-server-' });

        // Per case, keyed by case id. Populated inside the container's lifetime and asserted after it,
        // so a failure to stop the container cannot leave assertions unrun.
        const responses = new Map<string, Awaited<ReturnType<typeof readResponse>>>();
        const failures = new Map<string, string>();

        try {
          await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
          await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

          const container = await startContainer({
            image,
            entrypoint: 'gradle',
            args: ['--no-daemon', '--offline', 'run', '--quiet'],
            mounts: [
              { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
              { source: DELEGATES_DIR, target: DELEGATE_MOUNT, readOnly: true },
              { source: workDir, target: WORK_MOUNT },
            ],
            workdir: WORK_MOUNT,
            publish: [{ containerPort: SERVER_PORT }],
          });

          try {
            const port = await container.hostPort(SERVER_PORT);
            // Gradle compiles the generated tree and the delegates before the app starts, so the first
            // request cannot be sent for a minute or more on a cold work directory.
            await waitForHttpReady(`http://127.0.0.1:${port}/__goast-readiness`, {
              timeoutMs: 8 * 60 * 1000,
              isAlive: () => container.running(),
              describeDeath: () => container.output(),
            });

            const baseUrl = `http://127.0.0.1:${port}`;
            for (const apiCase of cases) {
              // Sequential, in table order, and one request per case: that is what makes attribution
              // exact here, where the client direction had to attribute recorded requests by route
              // shape. Two cases sharing an operation (`updatePet/json` and `updatePet/form`) are told
              // apart by which response *this* call returned, not by anything the server records.
              try {
                responses.set(apiCase.id, await readResponse(await issueCase(baseUrl, apiCase)));
              } catch (error) {
                // A transport-level failure is a result, not a reason to abandon the run: it is exactly
                // what a case whose request the server rejects at the connection level looks like, and
                // it must reach the artifact rather than aborting the other 18 cases.
                failures.set(apiCase.id, error instanceof Error ? error.message : String(error));
              }
            }

            // The server must still be up. If it died partway through, every case after that point
            // recorded a transport failure that says nothing about the generated code, and the whole
            // run's artifacts would be fiction.
            expect(container.running(), `the server exited during the run\n\n${container.output()}`).toBe(true);
          } finally {
            await container.stop();
          }
        } finally {
          // Best effort, never allowed to throw — see the note in `boot.test.ts`.
          await Deno.remove(workDir, { recursive: true }).catch((error: unknown) => {
            console.warn(`could not remove ${workDir}: ${error instanceof Error ? error.message : error}`);
          });
        }

        // Drift protection, the analogue of the client direction's reported-ids check: every case must
        // have produced either a response or a recorded transport failure.
        expect([...responses.keys(), ...failures.keys()].sort(), 'a case was never driven')
          .toEqual(cases.map((c) => c.id).sort());

        for (const apiCase of cases) {
          const response = responses.get(apiCase.id);
          const deviations = response === undefined
            ? [{
              field: 'response',
              expected: `status ${apiCase.response.status}`,
              actual: `no response at all (${failures.get(apiCase.id)})`,
            }]
            : diffResponse(apiCase.response, response);

          await verifyWireDeviations(
            wireSnapshotFile(wireRootDir, unit.id, apiCase.id),
            formatDeviations(deviations),
          );
        }
      });
    });
  }
}
```

- [ ] **Step 3: Add the tasks to `deno.json`**

```json
    "test:integration:controllers": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write deno test -A test/integration/spring-controllers",
    "test:integration:controllers:check": "GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check deno test -A test/integration/spring-controllers",
```

and extend `test:all` with ` && deno task test:integration:controllers:check`.

- [ ] **Step 4: Generate the artifacts**

```bash
deno task test:integration:controllers
```

Expected: PASS, with new files under `test/wire/spring-controllers@sb3/` and its three siblings.

Then **read every artifact** before committing. This is the step that decides whether the phase is honest, so do not
skim it:

- Does each artifact describe a deviation that is *plausible for the mechanism named*? A `599` status with a
  `MISMATCH …` text body names the exact parameter that mis-bound. A `598` names an inexpressible response.
- Is any case suspiciously *clean*? A case with no artifact is claiming the generated server got everything right.
  For each such case, satisfy yourself that it really was driven — the drift check proves a response arrived, but
  check the status is the declared one and not an accident.
- Are the four units' artifacts consistent where they should be and different only where a real difference explains
  it? `@sb3` vs `@sb4` differ only in Jackson major version; lenient vs strict differ in what the return types can
  express. An unexplained difference between `@sb3` and `@sb3-strict` on a case that has nothing to do with response
  types is a signal something is wrong.
- Are `getWidget/unexpectedError`'s artifacts present under both `-strict` units and absent (or different) under the
  lenient two? That asymmetry is the expected shape.

Record the counts per unit and a one-line summary of the deviation classes in the task report.

- [ ] **Step 5: Prove determinism and the orphan sweep**

```bash
deno task test:integration:controllers:check
deno task test:integration:check
```

Expected: both PASS. The second is what proves `WIRE_TARGETS` covers the new directories — if it reports orphans, the
registry entries are missing or a profile name is misspelled.

Then plant a deliberate orphan and confirm the sweep catches it:

```bash
touch "test/wire/spring-controllers@sb3/nonexistentCase__x.txt"
deno task test:integration:check
rm "test/wire/spring-controllers@sb3/nonexistentCase__x.txt"
```

Expected: FAIL naming that file, then removal.

- [ ] **Step 6: Commit**

```bash
git add test/integration/spring-controllers/integration.test.ts test/integration/targets.ts deno.json test/wire
git commit -m "test: drive the generated Kotlin servers and record their wire deviations"
```

---

### Task 8: Document the leg and register what it found

**Files:**

- Modify: `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Interfaces:** none — this task produces prose.

**Context.** Two audiences. `test/README.md` is for someone adding a case or a target. The defect register is the
permanent record of what the gate found, and it is cited by file and line.

**Citation rot.** Any line inserted into a `packages/**` file silently invalidates every `file.ts:NN` citation below
it in the register. This plan changes no `packages/` file, so existing citations cannot rot from this work — but new
citations must be verified individually by opening the file at the cited line and confirming the construct is there.
Do not trust a line number produced by reading a diff.

- [ ] **Step 1: Document the server direction in `test/README.md`**

Follow the file's existing structure and voice. Cover:

- What the server direction is: the reference client drives a generated Spring Boot app in a container; the handwritten
  delegates return what the case table declares and assert what Spring bound.
- The four units, and why the delegate sources are split the way they are (`common`, `lenient`, `strict`, and the
  single method behind `lenient-sb3`/`lenient-sb4`).
- The three status codes the delegates use to report their own failures — `599` mismatch, `598` inexpressible,
  `597` unexpected — and that seeing one in an artifact means the request reached the delegate and the *parameters*
  were wrong, as opposed to a `4xx`/`5xx` from Spring meaning it never got that far.
- `deno task test:integration:controllers` and `:check`.
- The two things this direction structurally cannot observe: the dropped `session` cookie parameter and the
  unobservable auth headers.

- [ ] **Step 2: Extend or add defect register entries**

Work from the artifacts Task 7 committed, one entry per distinct mechanism. Before writing a new `### Defect N`, grep
the register for the mechanism: several are already recorded from the client direction and want a
`**Tier 4 (server):**` element on the existing entry instead of a duplicate. In particular:

- **The null-inclusion finding.** Defect 50 already records that `spring-reactive-web-clients` declares
  `serializerJsonInclude` and wires it nowhere, so unset model fields serialize as explicit `null`. The server
  direction will show the same *symptom* on every `Pet`-bodied response. Before deciding: grep
  `packages/kotlin/src/generators/services/spring-controllers/` (and the spring-service generator) for
  `serializerJsonInclude`, `JsonInclude` and `ObjectMapper`. If the option is declared-and-inert there too, this is
  the same defect in a second family — extend Defect 50. If `spring-controllers` never declares it, the generated
  models simply carry no inclusion annotation and the finding is its own defect: state precisely whose
  responsibility it is (the model generator's annotations, not the server's `ObjectMapper`, since a
  `spring-controllers` consumer supplies neither).
- **The strict flavour cannot express a `default` response.** New defect. `strictResponseEntities` generates a
  per-operation response-entity class with one factory per *explicitly declared* status plus a fixed
  `unauthorized`/`forbidden`/`notImplemented`/`badRequest`/`internalServerError` set, a `private` primary constructor,
  and nothing for the spec's `default` response — so an operation declaring `default` has a response its own delegate
  type forbids it from returning. Cite the generator source that builds the factory list, verified by opening the
  file. Artifacts: `test/wire/spring-controllers@sb3-strict/getWidget__unexpectedError.txt` and its `@sb4-strict`
  twin.
- **Anything else the artifacts show.** For each, name the mechanism, cite the generator source, quote the artifact,
  and say plainly whether it is a generator defect, a Spring behaviour the generator should have accounted for, or a
  limit of what this tier can see. Do not inflate a Spring default into a generator defect, and do not excuse a
  generator defect as a Spring default — say which it is and why.

Every entry ends the way the register's existing ones do: what the fix would be, and that this phase records rather
than fixes.

- [ ] **Step 3: Audit the register's citations**

Write a throwaway script in the scratchpad that reads every `path/to/file.ts:NN` and `:NN-MM` citation out of the
register, opens each at that line, and prints the cited line's text. Read the output against each claim. Repair
whatever is wrong. Report the number checked and the number repaired — including zero, and if it is zero, say why
that is the correct answer rather than a broken script.

- [ ] **Step 4: Run the full gate**

```bash
deno fmt --check && deno lint && deno task test
deno task test:output:check
deno task test:integration:check
deno task test:integration:kotlin:check
deno task test:integration:controllers:check
GOAST_COMPILE=1 GOAST_SNAPSHOT=check deno test -A test/compile-tests test/harness/docker.test.ts
```

Expected: all pass, and tier 3 still has exactly 67 committed diagnostic files:

```bash
find test/compile -name "*.txt" | wc -l
```

- [ ] **Step 5: Commit**

```bash
git add test/README.md docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: document the tier-4 server direction and register its confirmed defects"
```

---

## Known risks, in the order they are likely to bite

1. **Offline resolution of the Spring Boot runtime.** The largest new dependency surface this project has added to the
   warm cache, and `sb4` pulls the `tools.jackson` line. Task 4 hits this first, deliberately.
2. **Spring Boot 4.0 package moves.** `SpringBootApplication` and `runApplication` are assumed to be where they are in
   3.x. Task 4 states the remedy if not.
3. **Interface-default-method request mappings.** The delegate pattern relies on Spring finding `@RequestMapping` on
   methods the controller class inherits as Kotlin interface defaults. Standard for this generator family, but Task 4's
   `!= 404` assertion is what proves it here rather than assuming it.
4. **Startup time.** Four units, each compiling a generated tree plus delegates before Spring starts. Budget several
   minutes per unit and report measured times; if the total is bad enough to matter for CI, say so in the final report
   rather than optimizing inside this phase.
5. **A case that conforms for the wrong reason.** The failure mode this whole design is most vulnerable to, since an
   absent artifact is a positive claim. Task 7 Step 4 is the countermeasure and must not be rushed.
