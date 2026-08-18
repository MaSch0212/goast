# Tier 4: `easy-network-stub` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive the generated `easy-network-stub` profile as a real HTTP server in the `node` container, issue every server-direction case against it from the host's reference client, and commit one deviation artifact per case that does not conform.

**Architecture:** The generated stubs *are* the API — `EasyNetworkStubBase` subclasses that register routes and answer them — so this is a **server**-direction leg and its harness shape is `spring-controllers`', not `angular-services`'. A ~40-line handwritten adapter turns `easy-network-stub`'s framework-agnostic interception contract into a `node:http` server; the host then drives it with `issueCase`/`readResponse`/`diffResponse` exactly as it drives the four Spring units. Compilation reuses the `angular-services` leg's `tsc`-under-`rootDirs` arrangement.

**Tech Stack:** Deno (host harness), Docker, the existing `node` image (`node:22-alpine` + `typescript@5.7.3` + `easy-network-stub@9.0.0`), `node:http`.

## Global Constraints

- **Only Deno and Docker may be required as prerequisites.** Every other toolchain lives inside a container.
- **No production code under `packages/` may change.** A generator change would break byte-exact tier-2 snapshots. Everything this plan measures is a property of already-committed output.
- **`test/docker/node/package.json` and `test/docker/node/Dockerfile` must not change.** Image tags derive from a content hash of the Dockerfile plus its context, so editing either rebuilds the image and puts tier 3's committed TypeScript diagnostics up for re-review. This leg needs no new dependency — see Fact 1.
- **The committed tree is mounted read-only and never modified.** What runs must be byte-identical to reviewed output.
- **A merely-wrong generator produces a committed artifact, never an `except` entry** in `test/cases/cases.ts`. `except` is reserved for "this profile cannot express this case *by design*".
- **An absent artifact means "this case conforms."** Anything that makes a case fail to be *measured* is a correctness bug, not a passing test.
- **Tier 3 must stay at exactly 67 committed diagnostic files** under `test/compile/`.
- **`test/harness` is JSR-published**: every export needs an explicit type annotation or `deno lint` fails `no-slow-types`. (This plan adds no harness exports, but Task 4 may be tempted to.)
- **`deno task test` must never start a container.** Docker legs gate on `GOAST_INTEGRATION`.
- Formatting/lint gate: `deno fmt --check` and `deno lint` must pass. Line width in this repo is 120.

---

## What the spike established

Every fact below was **measured** against `grafana`-free tooling this repo already has: the pinned `node` image and the committed `test/output/typescript/easy-network-stub/integration/kitchen-sink` tree. Do not re-derive them; do not assume anything beyond them.

1. **`easy-network-stub@9.0.0` is already a dependency of the `node` image** (`test/docker/node/package.json:7`), because tier 3 type-checks this profile. So this leg needs **no new image, no new dependency, and no Playwright**: the image is reused as-is and its content hash does not move.

2. **`EasyNetworkStub` is a concrete class with a `protected initInternal<T>(config: InitConfig<T>): T`** that ends with `return config.interceptor(this._urlMatch, async (req) => { … })`. `Interceptor<T> = (baseUrl: string | RegExp, handler: (req: Request) => Promise<void>) => T`. An interceptor of `(_urlMatch, handler) => handler` therefore hands the request handler straight back, and a subclass exposing that is the entire adapter. This is the same seam `playwright-easy-network-stub` and `cypress-easy-network-stub` use; the leg is not doing anything unsupported.

3. The types the adapter must satisfy, all exported from `'easy-network-stub'`:
   - `RequestData = { url: string; method: HttpMethod; body?: any; headers?: { [key: string]: string | string[] } }`
   - `Request = RequestData & { reply: (response: Response) => void | Promise<void>; destroy: () => void }`
   - `Response = { statusCode: number; body?: any; headers?: any }`
   - `HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'` — **five methods only.**
   - `InitConfig<T> = { interceptor: Interceptor<T>; failer: (error: Error | string) => void; errorLogger?: (error: ErrorLog) => void; responseProcessor?: (response: any) => any }`

4. **Method matching is exact and case-sensitive.** `try-get-response-for-request.js` filters `config.stubs.filter(s => s.method === req.method)`, and the generated stubs register `'GET'`/`'PUT'`/`'POST'`/`'DELETE'`. So the adapter must upper-case `req.method`. `OPTIONS` never reaches a stub: `initInternal`'s handler short-circuits it to `200` with the preflight header set.

5. **Route regexes are suffix-anchored only.** `buildStubRegex` returns `segments.join('') + '/?$'` — no `^`. So handing the raw request path (`/api/pets/abc`) through as `req.url` matches a stub registered as `'pets/{id:string}'`. The `urlMatch` constructor argument is *never used for matching by the library*; it is only passed to the interceptor, which this adapter ignores. Measured: `GET /api/pets/abc` → `200 {"id":"abc","name":"Rex"}`.

6. **Route params do not match percent-encoded or path-separating characters.** The default `string` route matcher is `([\w-_~.]+)`. When nothing matches, `failBecauseOfNotOrWrongMockedRoute` calls **`req.destroy()` and never replies**, then `config.failer(...)`. Measured: `GET /api/pets/abc%20def` closes the socket and the host's `fetch` throws `TypeError: fetch failed` with `cause.code = 'UND_ERR_SOCKET'`. The host loop must therefore treat a transport failure as a *result*, which is exactly the `failures` branch `spring-controllers/integration.test.ts` already has.

7. **`stubPathStyleSimple` throws at registration time.** Its route is `'styles/{values:string[]}'` and `buildRouteParamRegex` throws `Array parameters are not supported for route parameters.` — synchronously, from the `stub2()(…)` call. Measured. **Every registration must be individually guarded** or the server dies at startup and all 19 cases record a transport failure that says nothing about the generator.

8. **Every generated stub answers by `throw`ing**, so all responses go through `logErrorAndReplyWithErrorCode`:
   - `error.statusCode` is honoured.
   - `error.headers` is merged *over* `{'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': '*', 'Content-Type': 'application/json'}`, so a `Content-Type` the driver sets wins, and one it does not set is always `application/json`.
   - **Non-object `content` is `JSON.stringify`d.** A string body therefore arrives quoted (`"MISMATCH …"`), and `content: undefined` yields `body: undefined` because `JSON.stringify(undefined)` is `undefined`, not `"undefined"`.

9. **`getStubResponder` cannot set response headers.** Its implementation is `(statusCode: number, content?: unknown) => ({ statusCode, content })`. Headers are reachable only by the driver spreading its own onto the returned object, which the generated types permit because `StrictRouteResponseCallback` returns `ErrorResponse<any>` and `ErrorResponse` has an optional `headers`.

10. **Request bodies are strings put through `JSON.parse` with numeric/boolean/string fallbacks** (`parseRequestBody`). Nothing in the library ever produces a `Blob` or a parsed form/multipart body — yet `blobs.stubs.ts` types `uploadBlob`'s body as `Blob` and `pets.stubs.ts` types `uploadPetPhoto`'s as `{ file: Blob; caption?: string }`. Measured: a `text/plain` body arrives as the raw string.

11. **Query arrays are repeated-parameter only.** Measured against the generated `'styles?{formExploded?:string[]}&{formUnexploded?:string[]}&{spaceDelimited?:string[]}'`:
    - `?formExploded=a&formExploded=b` → `{ formExploded: ['a', 'b'] }` ✅
    - `?formUnexploded=a,b` → `{}` — **silently dropped**, no error, stub still matches. (The optional param matches neither the type matcher nor `invalidRegex`, so `getAllMatchingStubsAndTheirSpecificity` treats it as absent.)
    - `?spaceDelimited=a%20b` → `{ spaceDelimited: ['a%20b'] }` — neither percent-decoded nor split.

12. **`tsc` compiles the committed tree plus a handwritten driver with zero diagnostics** under the `angular-services` tsconfig shape (`target ES2022`, `module ESNext`, `moduleResolution bundler`, `lib ['ES2022','DOM']`, `rootDirs: ['/tree', '/driver']`, `types: ['node']`). Emitted layout: `/out/driver/*.js` and `/out/tree/**/*.js`, so a driver importing `'../tree/stubs'` resolves at compile time against `/tree` and at run time against `/out/tree`.

13. **Conventions this leg mirrors from `spring-controllers`** (`delegates/common/GoastExceptionHandler.kt`, `Expectations.kt`), so an artifact from either leg reads the same way:
    - `599` + `MISMATCH <detail>` — a bound parameter or body is not what the case table says the request carried.
    - `598` + `UNEXPRESSIBLE <detail>` — the generated API cannot express the response the case declares.
    - `597` + `UNEXPECTED <name>: <message>` — anything unmodelled. **A 597 in a committed artifact is a finding to investigate, not a snapshot to accept**, because the interpolated message may not be deterministic.

## File Structure

| File | Responsibility |
|---|---|
| `test/integration/easy-network-stub/build.ts` | **Host-side, Deno.** Profile/path/mount constants, `SERVER_PORT`, `driverTsConfig()`, `buildCommand()`. Pure string production — no I/O, no Docker. |
| `test/integration/easy-network-stub/build.test.ts` | Unit tests for the above. Runs under plain `deno task test` (no Docker). |
| `test/integration/easy-network-stub/driver/adapter.ts` | **Container-side, Node.** `NodeEasyNetworkStub` (exposes the handler) and `serveStub()` (the `node:http` bridge, readiness endpoint, no-reply guard). Knows nothing about cases. |
| `test/integration/easy-network-stub/driver/expectations.ts` | **Container-side.** `GoastMismatch`, `GoastUnexpressible`, `expectParam`, `mismatchResponse` — the `Expectations.kt`/`GoastExceptionHandler.kt` analogue. |
| `test/integration/easy-network-stub/driver/stubs.ts` | **Container-side.** One registration per generated stub method, each asserting what arrived and returning the declared response. The `delegates/` analogue. |
| `test/integration/easy-network-stub/driver/server.ts` | **Container-side.** Entry point: build the stub, register, serve. |
| `test/integration/easy-network-stub/boot.test.ts` | Docker risk gate: the generated stubs come up and answer. Fails loudly and early, before the case loop's 19 assertions can bury the reason. |
| `test/integration/easy-network-stub/integration.test.ts` | Host-side case loop, mirroring `spring-controllers/integration.test.ts`. |
| `test/integration/targets.ts` | Modify: register `{ profile: 'easy-network-stub', direction: 'server' }`. |
| `deno.json` | Modify: `test:integration:stubs`, `test:integration:stubs:check`, and add the check task to `test:all`. |
| `test/wire/easy-network-stub/*.txt` | Committed deviation artifacts. |
| `test/README.md` | Modify: document the leg. |
| `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md` | Modify: register the defects this leg confirms. |

---

### Task 1: Host-side build module

**Files:**
- Create: `test/integration/easy-network-stub/build.ts`
- Test: `test/integration/easy-network-stub/build.test.ts`

**Interfaces:**
- Consumes: `repoRootDir` from `@goast/test-harness`.
- Produces, and later tasks rely on these exact names:
  ```ts
  export const PROFILE = 'easy-network-stub';
  export const TREE_PATH = `typescript/${PROFILE}/integration/kitchen-sink`;
  export const TREE_MOUNT = '/tree';
  export const DRIVER_MOUNT = '/driver';
  export const OUT_DIR = '/out';
  export const SERVER_PORT = 8080;
  export const READINESS_PATH = '/__goast-readiness';
  export const TREE_DIR: string;   // join(repoRootDir, 'test', 'output', ...TREE_PATH.split('/'))
  export const DRIVER_DIR: string; // join(repoRootDir, 'test', 'integration', PROFILE, 'driver')
  export function driverTsConfig(): string;
  export function buildCommand(): string;
  ```

**Context for the implementer:** `test/integration/angular-services/build.ts` is the model. Read it first — this module is deliberately its sibling, and the two tsconfigs should differ only where a reason exists. Copy its doc-comment density; this repo's test code explains *why*, with measurements, not *what*.

Differences from the Angular leg, all of which need a comment saying why:
- `include` is `[`${DRIVER_MOUNT}/server.ts`, `${TREE_MOUNT}/**/*.ts`]` — the driver's entry point is `server.ts`, and `tsc` pulls `adapter.ts`/`expectations.ts`/`stubs.ts` in through the import graph.
- No `experimentalDecorators`/`emitDecoratorMetadata`: nothing in this profile is decorated.
- `buildCommand()` **ends by starting a server in the foreground**, where Angular's ended after compiling. So it terminates with `exec node ${OUT_DIR}/driver/server.js`.
- The driver-diagnostic guard must match this leg's own filenames. Angular greps `driver\.ts(`; here the driver is four files, so grep for the mount path instead: `grep -q '${DRIVER_MOUNT}/'` over `tsc`'s log. `tsc` prints paths for a `-p` project rooted at `/out` as absolute for files outside it, and `/driver` is outside `/out`; the generated tree is under `/tree`, so no tree diagnostic can match `/driver/`.

- [ ] **Step 1: Write the failing tests**

Create `test/integration/easy-network-stub/build.test.ts`. These assertions were each chosen because a plausible mistake makes them fail — do not add assertions that merely restate a literal you can read two lines away in `build.ts`.

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildCommand, driverTsConfig, DRIVER_MOUNT, OUT_DIR, READINESS_PATH, TREE_MOUNT } from './build.ts';

describe('driverTsConfig', () => {
  it('lays the two mounts out side by side under the out dir', () => {
    const config = JSON.parse(driverTsConfig());

    // Without both rootDirs entries, `tsc` roots the program at the common ancestor and the emitted
    // layout stops being `/out/driver` + `/out/tree`, which is what makes `'../tree/stubs'` resolve at
    // run time.
    expect(config.compilerOptions.rootDirs).toEqual([TREE_MOUNT, DRIVER_MOUNT]);
    expect(config.compilerOptions.outDir).toBe(OUT_DIR);
  });

  it('emits JavaScript rather than type-checking only', () => {
    // The image's own tsconfig.base.json sets noEmit for tier 3. Inheriting that silently would leave
    // /out empty and the server would fail with MODULE_NOT_FOUND, several minutes later.
    expect(JSON.parse(driverTsConfig()).compilerOptions.noEmit).toBe(false);
  });

  it('compiles the driver entry point and the whole generated tree', () => {
    expect(JSON.parse(driverTsConfig()).include).toEqual([`${DRIVER_MOUNT}/server.ts`, `${TREE_MOUNT}/**/*.ts`]);
  });

  it('provides the DOM lib, which the generated stubs need for Blob', () => {
    // `blobs.stubs.ts` types its body as `Blob` and `pets.stubs.ts` as `{ file: Blob; … }`.
    expect(JSON.parse(driverTsConfig()).compilerOptions.lib).toContain('DOM');
  });
});

describe('buildCommand', () => {
  it('starts the server in the foreground as the last thing it does', () => {
    // `exec` and not a background start: the container's main process must BE the server, or the
    // container exits as soon as the shell finishes and `waitForHttpReady` reports a dead container.
    expect(buildCommand().trimEnd().endsWith(`exec node ${OUT_DIR}/driver/server.js`)).toBe(true);
  });

  it('fails the build when a driver file has a type error, and not when the tree does', () => {
    const command = buildCommand();

    // The whole rationale of a handwritten typed driver is that writing the call IS the assertion that
    // the generated signature is usable. A driver that does not type-check but still runs makes the
    // assertion worthless — measured on the Angular leg, where a bogus argument left the leg green.
    expect(command).toContain(`${DRIVER_MOUNT}/`);
    expect(command).toContain('exit 1');
    // Tier 3 owns tree diagnostics and records them as snapshots; a tree that type-checks imperfectly
    // but runs is still informative here, so `tsc`'s own exit code must not stop the run.
    expect(command).toContain('|| true');
  });

  it('rewrites extensionless imports only under the out dir', () => {
    const command = buildCommand();

    // Rewriting under /tree would mean the leg no longer runs byte-identical reviewed output — and /tree
    // is mounted read-only, so it would fail at run time instead of being caught here.
    expect(command).toContain(`find ${OUT_DIR} -name '*.js'`);
    expect(command).not.toContain(`find ${TREE_MOUNT}`);
  });

  it('marks the emitted tree as ESM', () => {
    // Without this Node reads the emitted .js as CommonJS and the first `import` is a syntax error.
    expect(buildCommand()).toContain(`${OUT_DIR}/package.json`);
  });
});

describe('READINESS_PATH', () => {
  it('cannot collide with a generated route', () => {
    // Route regexes are suffix-anchored (`…/?$`, no `^`), so a readiness path that ends in a generated
    // route's shape would be swallowed by that stub instead of answering the readiness probe.
    expect(READINESS_PATH.startsWith('/__')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
deno test -A test/integration/easy-network-stub/build.test.ts
```

Expected: failure resolving `./build.ts`.

- [ ] **Step 3: Write `build.ts`**

Model it on `test/integration/angular-services/build.ts`, with the constants from the Interfaces block above. `buildCommand()` returns a `&&`-joined pipeline:

```ts
export function buildCommand(): string {
  return [
    `mkdir -p ${OUT_DIR}`,
    `cat > ${OUT_DIR}/tsconfig.json <<'GOAST_TSCONFIG'\n${driverTsConfig()}\nGOAST_TSCONFIG`,
    `/opt/goast/node_modules/.bin/tsc -p ${OUT_DIR}/tsconfig.json > ${OUT_DIR}/tsc.log 2>&1 || true`,
    `cat ${OUT_DIR}/tsc.log`,
    `if grep -q '${DRIVER_MOUNT}/' ${OUT_DIR}/tsc.log; then echo 'DRIVER TYPE ERRORS — see the tsc output above'; exit 1; fi`,
    `find ${OUT_DIR} -name '*.js' -exec sed -i -E "s#(from '[./][^']*)(')#\\1.js\\2#g; s#\\.js\\.js'#.js'#g" {} +`,
    `printf '{"type":"module"}' > ${OUT_DIR}/package.json`,
    `ln -sfn /opt/goast/node_modules ${OUT_DIR}/node_modules`,
    `exec node ${OUT_DIR}/driver/server.js`,
  ].join(' && ');
}
```

Two things to get right and comment:
- The tsconfig is written by the command itself via a **quoted** heredoc (`<<'GOAST_TSCONFIG'`), so the shell performs no expansion on the JSON. The Angular leg wrote its tsconfig from the host into a writable mount; here the container has no writable host mount, and `/out` is container-local.
- A heredoc inside an `&&` chain is valid `sh` but the newline placement matters: the terminator must be at the start of its own line. Verify by running the command, not by reading it.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
deno test -A test/integration/easy-network-stub/build.test.ts
```

- [ ] **Step 5: Gate and commit**

```bash
deno fmt && deno lint && deno test -A test/integration/easy-network-stub/build.test.ts
```

```bash
git add test/integration/easy-network-stub && git commit -m "test: add the easy-network-stub container-side build module"
```

---

### Task 2: The adapter, and a boot gate that proves it works

**Files:**
- Create: `test/integration/easy-network-stub/driver/adapter.ts`
- Create: `test/integration/easy-network-stub/driver/server.ts`
- Create: `test/integration/easy-network-stub/boot.test.ts`

**Interfaces:**
- Consumes: everything Task 1 produced; `buildImage`, `startContainer`, `repoRootDir`, `requireDocker`, `waitForHttpReady` from `@goast/test-harness`.
- Produces:
  ```ts
  // adapter.ts
  export class NodeEasyNetworkStub extends EasyNetworkStub {
    public start(): void;                       // wires initInternal, stores the handler
    public get handler(): (req: Request) => Promise<void>;
  }
  export function serveStub(stub: NodeEasyNetworkStub, port: number, readinessPath: string): Server;
  ```

**Context for the implementer:** this file is container-side Node/TypeScript, compiled by `tsc` in the image and **in no Deno module graph** — `deno lint` and `deno check` never see it, and the *only* thing that type-checks it is the `tsc` run inside the container plus Task 1's driver-diagnostic guard. That is why this task's deliverable includes a Docker test rather than only source.

`test/integration/spring-controllers/boot.test.ts` is the model for the gate. Facts 2–8 in this plan's "What the spike established" section are the specification for the adapter; read them before writing a line.

The adapter's four load-bearing behaviours:
1. **Upper-case the method** (Fact 4).
2. **Pass the raw request path through as `url`** (Fact 5) — do not strip a prefix, do not decode.
3. **Buffer the whole body and hand it over as a UTF-8 string** (Fact 10).
4. **Distinguish "the stub replied" from "nothing replied".** `failBecauseOfNotOrWrongMockedRoute` calls `req.destroy()` and returns without replying (Fact 6). Destroying the socket is the honest reproduction of what a browser interceptor does, so `destroy` must genuinely destroy — but a handler that returns having neither replied nor destroyed is a hole in this adapter, not a property of the generated code, and it must be visibly distinct. Answer such a request with `599` and a body naming the path, so it cannot be silently read as a generated-code deviation.

`serveStub` also answers `readinessPath` with `200` **before** consulting the stub (Fact 5: a suffix-anchored route could otherwise swallow it).

- [ ] **Step 1: Write the failing boot gate**

Create `test/integration/easy-network-stub/boot.test.ts`. It starts the container, waits for readiness, and probes exactly the four behaviours that must hold before the case loop is worth writing. Every probe below was measured in the spike, so a failure means a real regression, not a guess.

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, startContainer, waitForHttpReady } from '@goast/test-harness';

import { buildCommand, DRIVER_DIR, DRIVER_MOUNT, READINESS_PATH, SERVER_PORT, TREE_DIR, TREE_MOUNT } from './build.ts';

const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';
const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

if (enabled) await requireDocker();

if (enabled) {
  describe('integration/easy-network-stub boot', () => {
    it('serves the generated stubs over HTTP', async () => {
      const image = await buildImage('node', CONTEXT_DIR);
      const container = await startContainer({
        image,
        entrypoint: 'sh',
        args: ['-c', buildCommand()],
        mounts: [
          { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
          { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
        ],
        publish: [{ containerPort: SERVER_PORT }],
      });

      try {
        const port = await container.hostPort(SERVER_PORT);
        // `tsc` compiles the whole generated tree before the server binds, so the first probe cannot
        // be sent for tens of seconds on a cold container.
        await waitForHttpReady(`http://127.0.0.1:${port}${READINESS_PATH}`, {
          timeoutMs: 5 * 60 * 1000,
          isAlive: () => container.running(),
          describeDeath: () => container.output(),
        });

        // A route the generated stubs register, answered through the generated responder.
        const ok = await fetch(`http://127.0.0.1:${port}/api/pets/abc`);
        expect(ok.status).toBe(200);
        expect(await ok.json()).toEqual({ id: 'abc', name: 'Rex' });

        // A route param the default `([\w-_~.]+)` matcher cannot match. The library destroys the socket
        // without replying (measured), which must surface as a transport failure and not as a response.
        await expect(fetch(`http://127.0.0.1:${port}/api/pets/abc%20def`)).rejects.toThrow();

        // The server must still be up: a `destroy()` that took the process down with it would make
        // every later case in the real loop record a failure that says nothing about the generator.
        expect(container.running(), container.output()).toBe(true);
      } finally {
        await container.stop();
      }
    });
  });
}
```

- [ ] **Step 2: Run it to verify it fails**

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/easy-network-stub/boot.test.ts
```

Expected: failure resolving `./driver/server.js` inside the container, or a container that exits immediately.

- [ ] **Step 3: Write `adapter.ts`**

```ts
import { createServer, type Server } from 'node:http';

import { EasyNetworkStub } from 'easy-network-stub';
import type { HttpMethod, Request } from 'easy-network-stub';

type Handler = (req: Request) => Promise<void>;

export class NodeEasyNetworkStub extends EasyNetworkStub {
  private _handler?: Handler;

  public start(): void {
    this._handler = this.initInternal<Handler>({
      interceptor: (_urlMatch, handler) => handler,
      failer: (error) => console.log('##FAILER##', typeof error === 'string' ? error : error.message),
      errorLogger: (log) => console.log('##ERRLOG##', log.message),
    });
  }

  public get handler(): Handler {
    if (this._handler === undefined) throw new Error('start() has not been called');
    return this._handler;
  }
}

export function serveStub(stub: NodeEasyNetworkStub, port: number, readinessPath: string): Server {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      void (async () => {
        const url = request.url ?? '/';
        if (url === readinessPath) {
          response.writeHead(200).end('ready');
          return;
        }
        await stub.handler({
          url,
          method: (request.method ?? 'GET').toUpperCase() as HttpMethod,
          body: Buffer.concat(chunks).toString('utf8'),
          headers: request.headers as Record<string, string | string[]>,
          reply: (stubResponse) => {
            const body = stubResponse.body === undefined
              ? ''
              : typeof stubResponse.body === 'string'
              ? stubResponse.body
              : JSON.stringify(stubResponse.body);
            response.writeHead(stubResponse.statusCode, stubResponse.headers ?? {}).end(body);
          },
          destroy: () => request.socket.destroy(),
        });
        if (!response.writableEnded && !request.socket.destroyed) {
          response.writeHead(599).end(`UNEXPECTED no stub replied and none destroyed the socket: ${url}`);
        }
      })();
    });
  });
  server.listen(port, '0.0.0.0');
  return server;
}
```

Write the doc comments yourself, citing Facts 2–8 by what they *are*, not by number — a reader of the file has no access to this plan.

- [ ] **Step 4: Write a minimal `server.ts`**

For this task, register only what the boot gate probes. Task 3 replaces the registration block wholesale.

```ts
import { ApiStubs } from '../tree/stubs';

import { NodeEasyNetworkStub, serveStub } from './adapter';

const stub = new NodeEasyNetworkStub('/api/');
stub.start();

const api = new ApiStubs(stub);
api.pets((pets) => pets.stubGetPet((respond) => respond(200, { id: 'abc', name: 'Rex' })));

serveStub(stub, 8080, '/__goast-readiness');
console.log('##LISTENING##');
```

The port and readiness path are duplicated here as literals because this file is compiled by `tsc` in the container and cannot import from `build.ts` (a Deno module). Task 1's `build.test.ts` does not catch a drift between the two — say so in a comment, and keep both in one place in Task 3 if you find a way that does not couple the two module systems.

- [ ] **Step 5: Run the boot gate to verify it passes**

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/easy-network-stub/boot.test.ts
```

- [ ] **Step 6: Prove the driver-diagnostic guard actually bites**

Not optional, and not a thought experiment: the equivalent guard on the Angular leg was verified only by reading, and it was not wired up at all. Temporarily add a line to `server.ts` that cannot type-check — `api.pets((pets) => pets.stubGetPet((respond) => respond(200, { bogusNotAField: 1 })));` — re-run the boot gate, and confirm the container fails with `DRIVER TYPE ERRORS`. Then revert the line. Record both outcomes in your report.

- [ ] **Step 7: Gate and commit**

```bash
deno fmt && deno lint && deno test -A test/integration/easy-network-stub
```

```bash
git add test/integration/easy-network-stub && git commit -m "test: serve the generated easy-network-stub tree over HTTP"
```

---

### Task 3: Stub registrations for every case

**Files:**
- Create: `test/integration/easy-network-stub/driver/expectations.ts`
- Create: `test/integration/easy-network-stub/driver/stubs.ts`
- Modify: `test/integration/easy-network-stub/driver/server.ts`
- Modify: `test/integration/easy-network-stub/boot.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // expectations.ts
  export class GoastMismatch extends Error {}
  export class GoastUnexpressible extends Error {}
  export function expectParam<T>(name: string, expected: T, actual: T): T;  // throws GoastMismatch
  export function registerAll(api: ApiStubs): string[];  // in stubs.ts; returns a report line per stub
  ```

**Context for the implementer:** this is the `delegates/` analogue. Read `test/integration/spring-controllers/delegates/lenient/PetsDelegate.kt` and `delegates/common/CaseData.kt` first: they are the shape to match, including that a request whose parameters are not what the case table declares must become a *distinguishable response* (`599 MISMATCH …`), because the HTTP response is the only channel the host can observe.

The 19 server-direction cases in `test/cases/cases.ts` cover 12 operations across 4 stub groups. Read the table — it is the single source of truth for every expected value, and no value may be transcribed into this driver from anywhere else.

Rules, each with a measured reason:

- **Every registration is individually guarded.** `stubPathStyleSimple` throws synchronously (Fact 7). `registerAll` returns one line per stub — `"<name>: ok"` or `"<name>: FAILED <message>"` — and `server.ts` prints them under a `##REGISTRATION##` prefix. A registration that throws must not stop the others.
- **Discriminate cases within an operation by the values that arrived**, as `widgetCase(id)` does: `getWidget` has five cases distinguished only by path parameter. An `id` no case declares is a `GoastMismatch`, not a fallback response — that is what makes the discriminator double as the binding assertion.
- **Assert, then answer.** Every callback checks the parameters and body the case table declares before returning the responder's result.
- **A response header a case declares needs a spread**, because `getStubResponder` cannot set headers (Fact 9): `{ ...respond(200, body), headers: { 'X-Whatever': 'v' } }`. Comment the first occurrence with why.
- **Do not paper over an inexpressible response.** If the generated responder's status map has no entry for a status the case declares, throw `GoastUnexpressible` rather than substituting a status that happens to be available — substituting records a smaller, wrong deviation and hides the real gap.
- **`MISMATCH`/`UNEXPRESSIBLE` bodies arrive JSON-quoted** (Fact 8: non-object content is `JSON.stringify`d). Do not fight it and do not post-process it away; the artifact showing `"MISMATCH …"` with quotes is honest, and a reader needs one comment saying the quotes come from the library.

- [ ] **Step 1: Extend the boot gate first**

Add one probe per stub group to `boot.test.ts`, asserting the response the case table declares for one representative case each. These are the failing tests for this task.

```ts
        // One representative case per generated stub group, so a group that fails to register is caught
        // here rather than as five unexplained artifacts in the case loop.
        const widget = await fetch(`http://127.0.0.1:${port}/api/widgets/w1`);
        expect(widget.status).toBe(200);
        expect(await widget.json()).toEqual({ id: 'w1', name: 'Sprocket', price: 9.99 });

        const notFound = await fetch(`http://127.0.0.1:${port}/api/widgets/missing`);
        expect(notFound.status).toBe(404);

        // A mismatch must be observable as a response, not swallowed: an id no case declares is the
        // cheapest way to prove the 599 channel works at all.
        const mismatch = await fetch(`http://127.0.0.1:${port}/api/widgets/nosuchcase`);
        expect(mismatch.status).toBe(599);
        expect(await mismatch.text()).toContain('MISMATCH');
```

- [ ] **Step 2: Run to verify the new probes fail**

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/easy-network-stub/boot.test.ts
```

- [ ] **Step 3: Write `expectations.ts` and `stubs.ts`, and rewrite `server.ts`'s registration block**

`server.ts` after this step is: construct, `start()`, `new ApiStubs(stub, { rememberRequests: true })`, `registerAll(api)`, print the report, `serveStub(...)`.

- [ ] **Step 4: Run the boot gate to verify it passes**

```bash
GOAST_INTEGRATION=1 deno test -A test/integration/easy-network-stub/boot.test.ts
```

- [ ] **Step 5: Gate and commit**

```bash
deno fmt && deno lint && deno test -A test/integration/easy-network-stub
```

```bash
git add test/integration/easy-network-stub && git commit -m "test: answer every easy-network-stub server case from the generated stubs"
```

---

### Task 4: The case loop, the registry entry, and the artifacts

**Files:**
- Create: `test/integration/easy-network-stub/integration.test.ts`
- Modify: `test/integration/targets.ts`
- Modify: `deno.json`
- Create: `test/wire/easy-network-stub/*.txt` (whatever the run produces)

**Interfaces:**
- Consumes: `casesFor` from `test/cases/cases.ts`; `diffResponse`, `formatDeviations`, `issueCase`, `readResponse`, `verifyWireDeviations`, `wireRootDir`, `wireSnapshotFile`, `startContainer`, `waitForHttpReady`, `buildImage`, `requireDocker` from `@goast/test-harness`; everything Tasks 1–3 produced.

**Context for the implementer:** `test/integration/spring-controllers/integration.test.ts` is the model and should be followed closely — including its two structural decisions, both of which exist for measured reasons stated in its comments:
- **Responses are collected inside the container's lifetime and asserted after it**, so a failure to stop the container cannot leave assertions unrun.
- **A transport-level failure is recorded as a result, not thrown**, because a request the server rejects at the connection level is exactly what several cases here do (Fact 6) and it must reach the artifact rather than abandoning the other 18 cases.

Keep its drift check verbatim in spirit: every case must have produced either a response or a recorded transport failure, asserted against `cases.map((c) => c.id).sort()`.

This leg needs **no** body stabilizer. The Spring leg needed one because WebFlux's default error body carries a `timestamp` and a `requestId`; `easy-network-stub` renders only what the driver hands it. If any artifact turns out to churn between two runs, that is a finding — investigate it, do not add a normalizer to hide it.

Two things this leg must additionally do, because `spring-controllers` had no equivalent:
- **Assert the registration report.** The container prints `##REGISTRATION##`. Parse it out of `container.output()` and assert that the set of stubs that failed to register is exactly the set you expect — currently `['pathStyleSimple']`. A newly-failing registration would otherwise show up only as extra transport failures, which look identical to a route the matcher could not match.
- **`deno.json`**: add `test:integration:stubs` (`GOAST_SNAPSHOT=write`) and `test:integration:stubs:check` (`GOAST_SNAPSHOT=check`), both with `GOAST_INTEGRATION=1`, and append the check task to `test:all`. Pass `{ updateCommand: 'deno task test:integration:stubs' }` to `verifyWireDeviations` — the default it would otherwise print cannot regenerate anything in this directory.

- [ ] **Step 1: Write the case loop**

Follow the model file. `casesFor('easy-network-stub', 'server')`.

- [ ] **Step 2: Add the registry entry and the deno tasks**

In `test/integration/targets.ts`, add `{ profile: 'easy-network-stub', direction: 'server' }`. Note what the surrounding doc comment already says: this list is the orphan sweep's source of truth, so the entry and the artifacts must land in **one commit** — a commit with the entry and no artifacts, or artifacts and no entry, leaves a red branch on the history.

- [ ] **Step 3: Generate the artifacts**

```bash
deno task test:integration:stubs
```

Then read **every** file it wrote. For each one, decide and be able to say: is this a generator defect, a case the profile cannot express by design, or a bug in this leg's own driver? A `597` in any artifact is the third of those until proven otherwise (Fact 13). Do not commit an artifact you cannot explain.

- [ ] **Step 4: Prove the artifacts are deterministic**

```bash
deno task test:integration:stubs:check
```

Then run it once more. Two consecutive check runs must both pass with no file changes.

- [ ] **Step 5: Prove the Docker-free sweep agrees**

```bash
deno task test:integration:check
```

This runs the orphan sweep without Docker. It must be green with the new directory present.

- [ ] **Step 6: Gate and commit**

```bash
deno fmt && deno lint && deno task test && deno task test:integration:check
```

```bash
git add -A && git commit -m "test: record the easy-network-stub wire deviations"
```

---

### Task 5: Documentation and the defect register

**Files:**
- Modify: `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Context for the implementer:** read `test/README.md`'s existing tier-4 sections first; this leg gets one in the same shape. State plainly what is unusual about it — that it is a server-direction leg whose "server" is a stub library, that it needs no browser despite `easy-network-stub` being a browser-testing tool, and why (Fact 2).

For the register: the leg's artifacts are the evidence. Every defect entry needs a **`Tier 4:`** element naming the artifact that demonstrates it, in the shape the existing entries use. Candidates the spike already measured — verify each against a committed artifact before writing it up, and do not write up one you cannot point at:

- `pathStyleSimple` generates `'styles/{values:string[]}'`, an array route parameter `easy-network-stub` rejects at registration time, so the operation cannot be stubbed at all.
- `styleMatrix` generates optional array *query* parameters, which `easy-network-stub` can only receive as repeated parameters — so the comma-joined `form` (non-exploded) and space-delimited styles are silently dropped rather than rejected.
- Route parameters are typed `{id:string}`, whose default matcher `([\w-_~.]+)` cannot match a percent-encoded value, so any case with a reserved character in a path parameter is unroutable.
- `getStubResponder` returns `{statusCode, content}` and cannot set response headers, so no declared response header is reachable through the generated API.
- Bodies typed `Blob` (`uploadBlob`) and `{ file: Blob; caption?: string }` (`uploadPetPhoto`) are unreachable: the library only ever produces a JSON-parsed or raw string body.

**The register's citations rot on any line insertion.** Run the citation audit script after editing, as the existing register notes require.

- [ ] **Step 1: Write the `test/README.md` section**

- [ ] **Step 2: Write the register entries**

- [ ] **Step 3: Audit the citations**

- [ ] **Step 4: Gate and commit**

```bash
deno fmt --check && deno lint
```

```bash
git add -A && git commit -m "docs: document the easy-network-stub leg and register its confirmed defects"
```

---

## Self-review notes

- **Spec coverage.** The design spec's tier-4 requirement is "generated sources are actually tested"; for a target whose generated sources are a server, that means driving them with the reference client, which Task 4 does for every server-direction case.
- **The one thing this plan cannot promise.** How many artifacts land is unknown until Task 4 runs. That is the point of the tier — but it means Task 4's review must judge each artifact on its explanation, not on a count this plan predicted.
- **A rejected alternative, recorded so it can be overruled.** The obvious reading of "`easy-network-stub` is a browser-testing library" is that this leg needs a Playwright image and a real browser. It does not (Fact 2), and adding one would cost a new image, a new toolchain, and minutes per run — while measuring *Playwright's* request interception as much as the generated code. If the owner wants the browser path anyway, this plan should be replaced rather than amended: the driver, the build module, and the gate would all be different.
