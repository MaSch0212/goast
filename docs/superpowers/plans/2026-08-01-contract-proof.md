# Contract Proof (Tier 4, Phase 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the tier-4 contract — case table, reference server, reference client, kitchen-sink spec — end to end
against one generated client (`fetch-clients`) with no containers involved.

**Architecture:** A single case table declares, for each API call, what the wire must look like and what the client must
return. Three consumers read it: a reference server that serves the declared response and records the real request, a
reference client that issues the declared request verbatim, and per-target drivers that invoke generated code with
hardcoded arguments. Deviations between what a driver actually sent and what the table declared are written to
committed text artifacts under `test/wire/`, exactly as tier 3 commits compiler diagnostics — so a generator fix shows
up as a reviewable deletion rather than a silent behaviour change.

**Tech Stack:** Deno 2.x, `Deno.serve`, `@std/testing/bdd`, `@std/expect`, `@goast/test-harness`.

## Global Constraints

- **Deno and Docker are the only prerequisites.** Nothing in this phase may start a container — that is the entire
  reason the spec put phase 5 before the Docker-heavy targets. `fetch-clients` runs as a plain Deno subprocess.
- No network access to anything but `127.0.0.1`. The reference server binds an ephemeral port on loopback.
- `it` everywhere. No `test(` from `@std/testing/bdd`.
- `import { expect } from '@std/expect'`. Never `'@std/expect/expect'`.
- Literal `\n` in expected strings. Never `EOL` from `node:os`.
- One top-level `describe` per exported symbol, in a file colocated as `<symbol-file>.test.ts`.
- No `stub(fs, ...)`. Real IO against a temp directory where IO is unavoidable.
- `deno fmt --check` and `deno lint` must pass before every commit.
- **No production code under `packages/` may change.** This phase measures generator behaviour; where the behaviour is
  wrong it is recorded and registered, never fixed. A fix would change generated output and break tier 2's byte-exact
  snapshots, and belongs to a later phase.
- Tier 2 and tier 3 must stay green. `deno task test:output:check` and `deno task test:compile:check` are the gates.
  Tasks 1 and 2 deliberately *add* to both; every other task must leave them byte-identical.

## Established facts (measured, do not re-derive)

- `discoverSpecs(root)` in `test/harness/specs.ts` walks the keys of `SPEC_VERSION_DIRS` (`v2`, `v3`, `v3.1`) and emits
  one `DiscoveredSpec` per file or per directory. `SpecVersionDir` is `keyof typeof SPEC_VERSION_DIRS` and appears in
  `Profile.versions` in `test/output-tests/profiles.ts`, in tier 2's snapshot paths, and in tier 3's unit ids.
- The corpus is 54 specs; tier 2 runs 15 profiles over it; tier 3 covers 782 compile units. Adding one spec adds 15
  snapshot trees and roughly 15 compile units.
- Tier 2's driver is `test/output-tests/output.test.ts`; it calls `verifyProfile(profileSnapshotPaths(baseDir, name), …)`
  with `new OpenApiGenerator({ outputDir, newLine: '\n', existingFileBehavior: 'count' })`.
- Tier 3's driver is `test/compile-tests/compile.test.ts`, gated behind `GOAST_COMPILE`. Its snapshot helper
  `verifyCompileDiagnostics(file, diagnostics, { updateCommand })` writes a file when there are diagnostics, **deletes**
  a stale one when there are none, and refuses in check mode. `findOrphanFiles` sweeps standalone-file snapshot bases.
  Tier 4 reuses this exact shape.
- `verifyText(snapshotFile, text, { mode, updateCommand })` is the shared text-snapshot engine. `resolveSnapshotMode()`
  reads `GOAST_SNAPSHOT`, defaulting to `check` on CI and `write` locally.
- `test/harness/docker.ts` already exists with `buildImage`, `runContainer`, `requireDocker` and `hostGateway`. **Phase 5
  uses none of it.** It was built in phase 3 with tier 4 in mind; phases 6 and 7 are its tier-4 consumers.
- `ApiMethod` in `@goast/core` (`packages/core/src/transform/api-types.ts:45`) is `OpenApiHttpMethod`. The case table
  declares its own `HttpMethod` union rather than importing it, because the table is a test-side contract and must not
  drift when the generator's type does.

### What `fetch-clients` actually emits — measured, and the reason this phase exists

Read `test/output/typescript/fetch-clients/v3/parameter-locations/` and
`packages/typescript/assets/client/fetch/fetch-client.utils.ts`. The generated client is a class per tag, constructed
with `Partial<FetchClientOptions>` (`baseUrl`, `headers`, `fetch`), whose methods take a single `params` object and
return `Promise<TypedResponse<T>>`. Four wire-observable limitations are already confirmed:

1. **No percent-encoding anywhere.** `UrlBuilder.withPathParam` stores `String(value)` and `build()` substitutes it raw;
   `withQueryParam` builds `` `${key}=${value}` `` with no `encodeURIComponent`. A path parameter of `abc def` produces
   a literal space in the URL.
2. **No `style`/`explode` support.** `String(value)` on an array yields `a,b`. OpenAPI's default for a query array is
   `style: form, explode: true`, i.e. repeated keys — so even the *default* serialization is wrong.
3. **Every body is `JSON.stringify(body)`** (`fetch-client-generator.ts:226`), regardless of the operation's content
   type. Form-urlencoded, multipart and binary bodies are all sent as JSON.
4. **Cookie parameters are not implemented.** The generated `cookieParams()` method takes no arguments at all.

These are exactly what tier 4 exists to find, and finding them is a success, not a blocker. **Do not fix any of them in
this phase.** Task 8 registers them.

---

## Design decisions

**Deviations are committed artifacts, not failures.** The owner chose tier 3's diagnostics-as-snapshots model over the
case table's `except` field. `except` stays in the type for genuine can't-express-by-design cases, but a generator that
is merely *wrong* produces a committed deviation file. The distinction matters: `except` says "not a bug", a committed
deviation says "a bug we found, and here is its exact shape". A fix later deletes the file, which is reviewable.

**Committed artifacts live under `test/wire/`, not `test/integration/`.** The spec's layout gives
`test/integration/<target>/` to "driver plus test per runtime generator" — code. Generated artifacts get their own root
beside `test/output/` (tier 2) and `test/compile/` (tier 3), so `.gitattributes` and the fmt/lint excludes can treat
them as generated without also excluding the drivers. Path: `test/wire/<profile>/<case-id>.txt`.

**The two oracles are validated against each other before either is trusted.** Task 6 runs the reference client against
the reference server over the whole case table and requires **zero** deviations. Until that holds, a deviation from a
generated client is not attributable to the generator. This is the actual "contract proof" the phase is named for.

**The kitchen-sink joins tiers 2 and 3.** `test/specs/integration/` becomes a fourth discovery root pinned to OpenAPI
3.0, so tier 2 commits its generated output — which is what tier 4 imports, satisfying the spec's "byte-identical to
what was reviewed" — and tier 3 compiles it for free.

## File structure

| File | Responsibility |
| --- | --- |
| `test/specs/integration/kitchen-sink.yml` | The curated spec. Only wire-observable concerns. |
| `test/harness/specs.ts` | Extended: `integration` as a fourth discovery root. |
| `test/cases/types.ts` | `ApiCase`, `BodyExpectation`, `HttpMethod`, `Direction`, `RecordedRequest`. |
| `test/cases/cases.ts` | The case table itself. One export: `cases`. |
| `test/cases/cases.test.ts` | Table self-consistency: unique ids, every id resolvable in the spec. |
| `test/harness/wire.ts` | Normalization and comparison: header allowlist, query multi-map, structural JSON, multipart parsing, deviation formatting. |
| `test/harness/ref-server.ts` | `Deno.serve` on an ephemeral port; per-endpoint case queues; records requests. |
| `test/harness/ref-client.ts` | Handwritten raw-`fetch` oracle that issues `expectRequest` verbatim. |
| `test/harness/integration/verify.ts` | `wireSnapshotFile` + `verifyWireDeviations` — tier 3's verify shape, tier 4's root. |
| `test/integration/fetch-clients/driver.ts` | Hardcoded calls into the committed generated client; emits JSONL. |
| `test/integration/fetch-clients/integration.test.ts` | Spawns the driver, drives the server, verifies deviations. |
| `test/wire/fetch-clients/*.txt` | Committed deviations. Absent file = the case conforms exactly. |

---

## Task 1: The `integration` discovery root

**Files:**

- Modify: `test/harness/specs.ts`
- Modify: `test/harness/specs.test.ts`
- Create: `test/specs/integration/kitchen-sink.yml` (minimal, one operation — Task 2 grows it)
- Create (generated, by running the task): `test/output/*/*/integration/kitchen-sink/**`

**Interfaces:**

- Produces: `SPEC_VERSION_DIRS` gains an `integration: '3.0'` entry, so `SpecVersionDir` gains `'integration'` and
  `discoverSpecs()` returns one more entry. Tasks 2 and 7 depend on the spec being discoverable at
  `versionDir: 'integration'`, `name: 'kitchen-sink'`.

The spec's Repository Layout puts the kitchen-sink at `test/specs/integration/`. Tier 4 imports the *committed*
generated output, so the spec must flow through tier 2 — which means `discoverSpecs` has to see it.

- [ ] **Step 1: Write the failing test**

Add to `test/harness/specs.test.ts`, inside the existing `describe('discoverSpecs')`:

```ts
it('treats integration/ as a fourth root, pinned to OpenAPI 3.0', async () => {
  const specs = await discoverSpecs();
  const kitchenSink = specs.find((s) => s.versionDir === 'integration' && s.name === 'kitchen-sink');

  expect(kitchenSink).toBeDefined();
  expect(kitchenSink!.version).toBe('3.0');
  expect(kitchenSink!.files).toHaveLength(1);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `deno test -A test/harness/specs.test.ts`
Expected: FAIL — `kitchenSink` is `undefined`, because neither the directory nor the root exists yet.

- [ ] **Step 3: Add the root**

In `test/harness/specs.ts`, replace the `SPEC_VERSION_DIRS` declaration with:

```ts
/**
 * Corpus roots, mapped to the OpenAPI version each holds.
 *
 * `integration` is not a version directory — it is the curated tier-4 kitchen-sink, pinned to 3.0. It
 * lives here rather than in a tier-4-only walk because tier 4 imports the *committed* generated tree
 * (the spec requires that what runs is byte-identical to what was reviewed), and only tier 2 commits
 * trees. Being a root also gets it tier-3 compile coverage for free.
 */
export const SPEC_VERSION_DIRS: {
  readonly v2: '2.0';
  readonly v3: '3.0';
  readonly 'v3.1': '3.1';
  readonly integration: '3.0';
} = {
  'v2': '2.0',
  'v3': '3.0',
  'v3.1': '3.1',
  'integration': '3.0',
} as const satisfies Record<string, OpenApiVersion>;
```

Nothing else in `discoverSpecs` changes — it already iterates `Object.keys(SPEC_VERSION_DIRS)`.

- [ ] **Step 4: Write the minimal spec**

Create `test/specs/integration/kitchen-sink.yml`. Task 2 grows this; here it only has to prove the wiring:

```yaml
openapi: 3.0.0
info:
  version: 1.0.0
  title: Kitchen Sink

paths:
  /pets/{id}:
    get:
      operationId: getPet
      tags: [Pets]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The pet.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'

components:
  schemas:
    Pet:
      type: object
      required: [id, name]
      properties:
        id:
          type: string
        name:
          type: string
```

- [ ] **Step 5: Run the test and the harness suite**

Run: `deno test -A test/harness`
Expected: PASS, including the new test.

- [ ] **Step 6: Generate and inspect the new tier-2 trees**

Run: `deno task test:output`
Expected: 15 new snapshot trees appear under `test/output/*/*/integration/kitchen-sink/`. Confirm with
`git status --short test/output | head -20` and spot-check
`test/output/typescript/fetch-clients/integration/kitchen-sink/clients/pets-client.ts` — it must contain a `getPet`
method. **No pre-existing snapshot may change.** Verify with
`git diff --stat test/output | grep -v integration` — expected: no output.

- [ ] **Step 7: Confirm tier 3 picks it up and still passes**

Run: `deno task test:compile:check`
Expected: PASS. The unit count rises by roughly 15 (one per profile). Note the exact before/after counts in your report.
If new diagnostics appear under `test/compile/`, that is a real finding about the kitchen-sink spec — report it and say
whether it is the spec's fault or the generator's; **do not** silently commit it without saying so.

- [ ] **Step 8: Commit**

```bash
deno fmt --check && deno lint && deno task test
git add test/harness/specs.ts test/harness/specs.test.ts test/specs/integration test/output test/compile
git commit -m "test: add the integration corpus root and a minimal kitchen-sink spec"
```

---

## Task 2: Grow the kitchen-sink spec

**Files:**

- Modify: `test/specs/integration/kitchen-sink.yml`
- Modify (generated, by running the task): `test/output/*/*/integration/kitchen-sink/**`

**Interfaces:**

- Consumes: the discovery root from Task 1.
- Produces: the operations the case table (Task 3) and the driver (Task 7) reference by `operationId`.

The spec's Kitchen-sink section names exactly what belongs here: "all four parameter locations; the `style` and
`explode` serialization matrix; path parameters requiring encoding; JSON, form-urlencoded, multipart with a file part,
and binary bodies; several content types on one operation; 200, 201, 204, 400, 404, 500, and a `default` response;
response headers; nullable and optional fields; enums; nested and recursive objects; date, date-time, and byte formats;
arrays of objects; and bearer plus apiKey auth."

And what does *not* belong: "Purely generative concerns — discriminators, `allOf` merging, naming collisions — stay in
the tier-2 and tier-3 corpus." **Only put in what is observable on the wire.** If you cannot write a case-table entry
asserting a byte of the request or response for a feature, it does not belong here.

- [ ] **Step 1: Write the operations**

Author the spec against the checklist above. Requirements that are easy to get subtly wrong:

- Give **every** operation an `operationId` and exactly one `tags` entry. The generator names the client class from the
  tag and the method from the `operationId`; the driver hardcodes both.
- Cover the `style`/`explode` matrix explicitly rather than relying on defaults: for query arrays include at least
  `style: form, explode: true` (the default — repeated keys), `style: form, explode: false` (comma-joined), and
  `style: spaceDelimited`. For a path array include `style: simple`. Name each parameter after its style so a failure
  is self-describing (`formExploded`, `formUnexploded`, `spaceDelimited`).
- The encoding case needs a path parameter whose value will contain a space and a slash, and a query parameter whose
  value contains `&` and `=`. The *spec* just declares `type: string`; the value lives in the case table.
- For "several content types on one operation", give one operation a `requestBody` with both `application/json` and
  `application/x-www-form-urlencoded`.
- Auth: declare `bearerAuth` (`type: http`, `scheme: bearer`) and `apiKeyAuth` (`type: apiKey`, `in: header`,
  `name: X-Api-Key`) under `components.securitySchemes`, and apply each to one operation.
- Keep it one file. A directory would work but makes the tier-2 diff harder to read.

- [ ] **Step 2: Confirm it parses and generates**

Run: `deno task test:output`
Expected: the 15 `integration/kitchen-sink` trees regenerate. Read
`test/output/typescript/fetch-clients/integration/kitchen-sink/clients/` and confirm one method exists per
`operationId`. **A missing method means the driver cannot call it** — if any operation produced no method, report which
and why before proceeding.

- [ ] **Step 3: Check the compile gate**

Run: `deno task test:compile:check`
Expected: PASS. If the kitchen-sink introduces new diagnostics, decide and report: a diagnostic caused by *your spec
being invalid* must be fixed here; a diagnostic caused by the *generator* is a finding for Task 8 and its snapshot gets
committed.

- [ ] **Step 4: Confirm nothing else moved**

```bash
git status --short test/output | grep -v '/integration/'
```

Expected: no output. Any other tree changing means the spec leaked into shared state, which it cannot legitimately do.

- [ ] **Step 5: Commit**

```bash
deno fmt --check && deno lint && deno task test
git add test/specs/integration test/output test/compile
git commit -m "test: grow the kitchen-sink spec to the wire-observable surface"
```

---

## Task 3: The case table

**Files:**

- Create: `test/cases/types.ts`
- Create: `test/cases/cases.ts`
- Create: `test/cases/cases.test.ts`

**Interfaces:**

- Consumes: the `operationId`s and paths from Task 2's spec.
- Produces, imported by Tasks 4, 5, 6 and 7:
  - `type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'`
  - `type Direction = 'client' | 'server'`
  - `type BodyExpectation` — the discriminated union below.
  - `type ApiCase` — the spec's shape, verbatim.
  - `type RecordedRequest = { method: HttpMethod; path: string; query: Record<string, string[]>; headers: Record<string, string>; body: RecordedBody }`
  - `const cases: ApiCase[]`
  - `function casesFor(profile: string, direction: Direction): ApiCase[]` — the table filtered by `directions` and
    `except`. **Every consumer must go through this**, so drift protection and exclusion are computed one way.

- [ ] **Step 1: Write the types**

Create `test/cases/types.ts`:

```ts
/** HTTP methods the case table can express. Declared here rather than imported from `@goast/core`:
 * the table is a test-side contract and must not drift when the generator's own type does. */
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/** Which side of the contract a case exercises. */
export type Direction = 'client' | 'server';

/** What the request body must look like on the wire, by content type. */
export type BodyExpectation =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; fields: Record<string, string[]> }
  | { kind: 'multipart'; parts: MultipartPart[] }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string };

/** One named part of a multipart body. `filename` present means a file part. */
export type MultipartPart = {
  name: string;
  filename?: string;
  contentType?: string;
  value: string;
};

/** A request as the reference server actually received it, after parsing. */
export type RecordedBody =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; fields: Record<string, string[]> }
  | { kind: 'multipart'; parts: MultipartPart[] }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string };

export type RecordedRequest = {
  method: HttpMethod;
  /** Path only, already percent-decoded by neither side — compared exactly as it arrived. */
  path: string;
  /** Order-insensitive multi-map. A repeated key becomes a multi-element array. */
  query: Record<string, string[]>;
  /** Lower-cased names, allowlist-filtered. See `wire.ts`. */
  headers: Record<string, string>;
  body: RecordedBody;
};

/** One API call, and everything three consumers need to know about it. */
export type ApiCase = {
  /** Stable id, e.g. `getPet/ok`. Doubles as the deviation artifact's file name. */
  id: string;
  operationId: string;
  method: HttpMethod;
  /** Template as written in the spec, e.g. `/pets/{id}`. Keys the server's case queues. */
  pathTemplate: string;
  /** What the wire must look like. */
  expectRequest: {
    /** Resolved and encoded, e.g. `/pets/abc%20def`. */
    path: string;
    query?: Record<string, string[]>;
    headers?: Record<string, string>;
    body?: BodyExpectation;
  };
  response: { status: number; headers?: Record<string, string>; body?: unknown };
  /** What the generated client must hand back to its caller. */
  expectResult: unknown;
  directions: Direction[];
  /** Profiles that cannot express this case *by design*. A profile that is merely wrong is not
   * listed here — it produces a committed deviation artifact instead. See the plan's design notes. */
  except?: string[];
};
```

- [ ] **Step 2: Write the table's self-consistency test first**

Create `test/cases/cases.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { cases, casesFor } from './cases.ts';

describe('cases', () => {
  it('gives every case a unique id', () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('declares at least one direction for every case', () => {
    const directionless = cases.filter((c) => c.directions.length === 0).map((c) => c.id);
    expect(directionless).toEqual([]);
  });

  it('resolves every pathTemplate placeholder in the expected path', () => {
    const unresolved = cases.filter((c) => c.expectRequest.path.includes('{')).map((c) => c.id);
    expect(unresolved).toEqual([]);
  });

  it('covers every operation in the kitchen-sink spec at least once', async () => {
    const spec = await Deno.readTextFile(
      new URL('../specs/integration/kitchen-sink.yml', import.meta.url),
    );
    const operationIds = [...spec.matchAll(/^\s*operationId:\s*(\S+)/gm)].map((m) => m[1]);
    const covered = new Set(cases.map((c) => c.operationId));

    expect(operationIds.filter((id) => !covered.has(id))).toEqual([]);
  });
});

describe('casesFor', () => {
  it('excludes a case the profile cannot express', () => {
    const excepted = cases.find((c) => (c.except?.length ?? 0) > 0);
    if (excepted === undefined) return; // No exceptions today; the filter is still exercised below.

    expect(casesFor(excepted.except![0], 'client').map((c) => c.id)).not.toContain(excepted.id);
  });

  it('excludes a case that does not declare the direction', () => {
    const serverOnly = cases.filter((c) => !c.directions.includes('client')).map((c) => c.id);
    const clientIds = casesFor('fetch-clients', 'client').map((c) => c.id);

    for (const id of serverOnly) expect(clientIds).not.toContain(id);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `deno test -A test/cases`
Expected: FAIL — `./cases.ts` does not exist.

- [ ] **Step 4: Write the table**

Create `test/cases/cases.ts`. Start with the filter, which every consumer uses:

```ts
import type { ApiCase, Direction } from './types.ts';

export * from './types.ts';

/**
 * The table, filtered for one profile and one direction.
 *
 * Every consumer goes through this rather than filtering `cases` itself, so that drift protection —
 * "the ids a driver reported must equal the ids it was asked for" — compares two lists computed the
 * same way. A driver that filtered differently would report a mismatched set and look broken.
 */
export function casesFor(profile: string, direction: Direction): ApiCase[] {
  return cases.filter((c) => c.directions.includes(direction) && !(c.except ?? []).includes(profile));
}

export const cases: ApiCase[] = [
  {
    id: 'getPet/ok',
    operationId: 'getPet',
    method: 'get',
    pathTemplate: '/pets/{id}',
    expectRequest: { path: '/pets/abc' },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { id: 'abc', name: 'Rex' },
    },
    expectResult: { id: 'abc', name: 'Rex' },
    directions: ['client', 'server'],
  },
  // … one entry per operation authored in Task 2, plus the variants below.
];
```

Write one entry per operation from Task 2, and additionally:

- **An encoding case** whose `expectRequest.path` is percent-encoded (`/pets/abc%20def%2Fx`) and whose query value
  contains encoded `&` and `=`.
- **One case per `style`/`explode` parameter**, with `query` spelling out the expected multi-map: `{ tags: ['a', 'b'] }`
  for the exploded form, `{ tags: ['a,b'] }` for the unexploded one.
- **One case per declared status code** — 200, 201, 204, 400, 404, 500 and `default`. Give the error cases an
  `expectResult` describing what the generated client hands back for a non-2xx; for `fetch-clients` that is the
  `TypedResponse` itself, so assert on `status`, not a parsed body. **Determine this by running the client, not by
  assuming** — see Task 7 Step 4.
- **One case per body kind** — json, form, multipart with a file part, text, binary.
- **The two auth cases**, asserting the `authorization` and `x-api-key` headers.

Do **not** add `except` entries for the four known `fetch-clients` limitations. They are defects, not design limits, and
the phase records them as deviations.

- [ ] **Step 5: Run the tests**

Run: `deno test -A test/cases`
Expected: PASS, all six tests.

- [ ] **Step 6: Commit**

```bash
deno fmt --check && deno lint && deno test -A test/cases
git add test/cases
git commit -m "test: add the tier-4 case table"
```

---

## Task 4: Wire normalization and comparison

**Files:**

- Create: `test/harness/wire.ts`
- Create: `test/harness/wire.test.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: `RecordedRequest`, `BodyExpectation`, `ApiCase` from `test/cases/types.ts`.
- Produces, exported from `@goast/test-harness`:
  - `const IGNORED_HEADERS: ReadonlySet<string>`
  - `function normalizeHeaders(headers: Headers): Record<string, string>`
  - `function parseQuery(url: URL): Record<string, string[]>`
  - `async function readBody(request: Request): Promise<RecordedBody>`
  - `function diffRequest(expected: ApiCase['expectRequest'], actual: RecordedRequest): Deviation[]`
  - `function diffResult(expected: unknown, actual: unknown): Deviation[]`
  - `type Deviation = { field: string; expected: string; actual: string }`
  - `function formatDeviations(deviations: readonly Deviation[]): string`

This module is where "what is under test" is separated from "what is incidental". Get it wrong in the lenient direction
and tier 4 proves nothing; get it wrong in the strict direction and every case fails on a `user-agent` string.

- [ ] **Step 1: Write the failing tests**

Create `test/harness/wire.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { diffRequest, formatDeviations, normalizeHeaders, parseQuery, readBody } from './wire.ts';

describe('normalizeHeaders', () => {
  it('lower-cases names and drops the incidental ones', () => {
    const headers = new Headers({
      'X-Request-Id': 'r1',
      'Host': 'localhost:8080',
      'User-Agent': 'Deno',
      'Accept-Encoding': 'gzip',
      'Content-Length': '12',
    });

    expect(normalizeHeaders(headers)).toEqual({ 'x-request-id': 'r1' });
  });
});

describe('parseQuery', () => {
  it('collects a repeated key into one array, preserving value order', () => {
    expect(parseQuery(new URL('http://x/p?tags=a&tags=b&q=1'))).toEqual({ tags: ['a', 'b'], q: ['1'] });
  });

  it('keeps an unexploded comma-joined value as a single element', () => {
    expect(parseQuery(new URL('http://x/p?tags=a,b'))).toEqual({ tags: ['a,b'] });
  });
});

describe('readBody', () => {
  it('parses a JSON body structurally', async () => {
    const request = new Request('http://x/p', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"b":2,"a":1}',
    });

    expect(await readBody(request)).toEqual({ kind: 'json', value: { a: 1, b: 2 } });
  });

  it('reports no body for a bodyless request', async () => {
    expect(await readBody(new Request('http://x/p'))).toEqual({ kind: 'none' });
  });

  it('parses a multipart body into named parts', async () => {
    const form = new FormData();
    form.append('name', 'Rex');
    form.append('photo', new File(['data'], 'p.txt', { type: 'text/plain' }));
    const request = new Request('http://x/p', { method: 'POST', body: form });

    const body = await readBody(request);

    expect(body.kind).toBe('multipart');
    expect(body.kind === 'multipart' && body.parts).toEqual([
      { name: 'name', value: 'Rex' },
      { name: 'photo', filename: 'p.txt', contentType: 'text/plain', value: 'data' },
    ]);
  });
});

describe('diffRequest', () => {
  const actual = {
    method: 'get' as const,
    path: '/pets/abc def',
    query: { tags: ['a,b'] },
    headers: {},
    body: { kind: 'none' as const },
  };

  it('reports the path and the query separately', () => {
    const deviations = diffRequest({ path: '/pets/abc%20def', query: { tags: ['a', 'b'] } }, actual);

    expect(deviations.map((d) => d.field)).toEqual(['path', 'query.tags']);
  });

  it('reports nothing when the request matches', () => {
    expect(diffRequest({ path: '/pets/abc def', query: { tags: ['a,b'] } }, actual)).toEqual([]);
  });

  it('ignores a header the expectation does not mention', () => {
    const withHeader = { ...actual, headers: { 'x-trace': 't' } };

    expect(diffRequest({ path: '/pets/abc def', query: { tags: ['a,b'] } }, withHeader)).toEqual([]);
  });
});

describe('formatDeviations', () => {
  it('renders one stanza per deviation, in the order given', () => {
    const text = formatDeviations([
      { field: 'path', expected: '/a', actual: '/b' },
      { field: 'query.tags', expected: '["a","b"]', actual: '["a,b"]' },
    ]);

    expect(text).toBe(
      'path\n' +
        '  expected /a\n' +
        '  actual   /b\n' +
        'query.tags\n' +
        '  expected ["a","b"]\n' +
        '  actual   ["a,b"]\n',
    );
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `deno test -A test/harness/wire.test.ts`
Expected: FAIL — `./wire.ts` does not exist.

- [ ] **Step 3: Implement**

Create `test/harness/wire.ts`:

```ts
import type { ApiCase, RecordedBody, RecordedRequest } from '../cases/types.ts';

/**
 * Headers the comparison drops.
 *
 * These are set by the runtime, not by the generated client, so asserting them would make the tier
 * fail on a Deno upgrade rather than on a generator change. Everything else survives, because a
 * header the generator *does* control is exactly what tier 4 is for.
 */
export const IGNORED_HEADERS: ReadonlySet<string> = new Set([
  'host',
  'user-agent',
  'accept-encoding',
  'content-length',
  'connection',
]);

export type Deviation = { field: string; expected: string; actual: string };

export function normalizeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of headers) {
    const lower = name.toLowerCase();
    if (!IGNORED_HEADERS.has(lower)) result[lower] = value;
  }
  return result;
}

export function parseQuery(url: URL): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of url.searchParams) (result[key] ??= []).push(value);
  return result;
}

export async function readBody(request: Request): Promise<RecordedBody> {
  const contentType = request.headers.get('content-type') ?? '';
  if (request.body === null) return { kind: 'none' };

  if (contentType.includes('application/json')) {
    const text = await request.text();
    if (text === '') return { kind: 'none' };
    return { kind: 'json', value: JSON.parse(text) };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const fields: Record<string, string[]> = {};
    for (const [key, value] of new URLSearchParams(await request.text())) (fields[key] ??= []).push(value);
    return { kind: 'form', fields };
  }
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const parts = [];
    for (const [name, value] of form) {
      parts.push(
        value instanceof File
          ? { name, filename: value.name, contentType: value.type, value: await value.text() }
          : { name, value },
      );
    }
    return { kind: 'multipart', parts };
  }
  if (contentType.startsWith('text/')) return { kind: 'text', value: await request.text() };

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0) return { kind: 'none' };
  return { kind: 'binary', base64: btoa(String.fromCharCode(...bytes)) };
}

/** Stable JSON, so an object's key order cannot make two equal values compare unequal. */
function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
}

function compare(field: string, expected: unknown, actual: unknown, into: Deviation[]): void {
  const e = stable(expected);
  const a = stable(actual);
  if (e !== a) into.push({ field, expected: e, actual: a });
}

/**
 * Compares one recorded request against its expectation.
 *
 * Only what the expectation *mentions* is compared. A header the case does not name is not a
 * deviation: the case table declares the contract, and a runtime that adds `accept` is not a
 * generator defect. Query and body are compared whenever the expectation names them.
 */
export function diffRequest(expected: ApiCase['expectRequest'], actual: RecordedRequest): Deviation[] {
  const deviations: Deviation[] = [];

  if (expected.path !== actual.path) {
    deviations.push({ field: 'path', expected: expected.path, actual: actual.path });
  }

  if (expected.query !== undefined) {
    const keys = [...new Set([...Object.keys(expected.query), ...Object.keys(actual.query)])].sort();
    for (const key of keys) compare(`query.${key}`, expected.query[key], actual.query[key], deviations);
  }

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    const lower = name.toLowerCase();
    if (actual.headers[lower] !== value) {
      deviations.push({ field: `header.${lower}`, expected: value, actual: actual.headers[lower] ?? '<absent>' });
    }
  }

  if (expected.body !== undefined) compare('body', expected.body, actual.body, deviations);

  return deviations;
}

export function diffResult(expected: unknown, actual: unknown): Deviation[] {
  const deviations: Deviation[] = [];
  compare('result', expected, actual, deviations);
  return deviations;
}

export function formatDeviations(deviations: readonly Deviation[]): string {
  return deviations.map((d) => `${d.field}\n  expected ${d.expected}\n  actual   ${d.actual}\n`).join('');
}
```

- [ ] **Step 4: Run the tests**

Run: `deno test -A test/harness/wire.test.ts`
Expected: PASS, all nine tests.

- [ ] **Step 5: Export it**

Add `export * from './wire.ts';` to `test/harness/mod.ts`, in alphabetical position.

- [ ] **Step 6: Commit**

```bash
deno fmt --check && deno lint && deno test -A test/harness
git add test/harness/wire.ts test/harness/wire.test.ts test/harness/mod.ts
git commit -m "test(harness): add wire normalization and request comparison"
```

---

## Task 5: The reference server

**Files:**

- Create: `test/harness/ref-server.ts`
- Create: `test/harness/ref-server.test.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: `readBody`, `normalizeHeaders`, `parseQuery` from `wire.ts`; `ApiCase`, `RecordedRequest` from
  `test/cases/types.ts`.
- Produces, exported from `@goast/test-harness`:
  - `type RefServer = { baseUrl: string; recorded: Map<string, RecordedRequest>; surplus: RecordedRequest[]; close(): Promise<void> }`
  - `async function startRefServer(cases: readonly ApiCase[]): Promise<RefServer>`

- [ ] **Step 1: Write the failing tests**

Create `test/harness/ref-server.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiCase } from '../cases/types.ts';
import { startRefServer } from './ref-server.ts';

const petCase = (id: string, status: number): ApiCase => ({
  id,
  operationId: 'getPet',
  method: 'get',
  pathTemplate: '/pets/{id}',
  expectRequest: { path: '/pets/x' },
  response: { status, headers: { 'content-type': 'application/json' }, body: { id } },
  expectResult: { id },
  directions: ['client'],
});

describe('startRefServer', () => {
  it('serves a case response and records the request that fetched it', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      const response = await fetch(`${server.baseUrl}/pets/x?q=1`, { headers: { 'x-trace': 't' } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: 'getPet/ok' });

      const recorded = server.recorded.get('getPet/ok')!;
      expect(recorded.path).toBe('/pets/x');
      expect(recorded.query).toEqual({ q: ['1'] });
      expect(recorded.headers['x-trace']).toBe('t');
    } finally {
      await server.close();
    }
  });

  it('pops cases in table order within one endpoint', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200), petCase('getPet/missing', 404)]);
    try {
      expect((await fetch(`${server.baseUrl}/pets/x`)).status).toBe(200);
      expect((await fetch(`${server.baseUrl}/pets/x`)).status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it('routes by path template, so two endpoints do not share a queue', async () => {
    const other: ApiCase = { ...petCase('listPets/ok', 200), pathTemplate: '/pets', expectRequest: { path: '/pets' } };
    const server = await startRefServer([petCase('getPet/ok', 200), other]);
    try {
      expect((await fetch(`${server.baseUrl}/pets`)).status).toBe(200);
      expect(server.recorded.has('listPets/ok')).toBe(true);
      expect(server.recorded.has('getPet/ok')).toBe(false);
    } finally {
      await server.close();
    }
  });

  it('buckets an unmatched request as surplus instead of desynchronizing the queue', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      const stray = await fetch(`${server.baseUrl}/unknown`);
      expect(stray.status).toBe(418);

      expect((await fetch(`${server.baseUrl}/pets/x`)).status).toBe(200);
      expect(server.surplus).toHaveLength(1);
      expect(server.surplus[0].path).toBe('/unknown');
    } finally {
      await server.close();
    }
  });

  it('buckets an extra request to a drained endpoint as surplus', async () => {
    const server = await startRefServer([petCase('getPet/ok', 200)]);
    try {
      await fetch(`${server.baseUrl}/pets/x`);
      const extra = await fetch(`${server.baseUrl}/pets/x`);

      expect(extra.status).toBe(418);
      expect(server.surplus).toHaveLength(1);
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `deno test -A test/harness/ref-server.test.ts`
Expected: FAIL — `./ref-server.ts` does not exist.

- [ ] **Step 3: Implement**

Create `test/harness/ref-server.ts`:

```ts
import type { ApiCase, HttpMethod, RecordedRequest } from '../cases/types.ts';
import { normalizeHeaders, parseQuery, readBody } from './wire.ts';

export type RefServer = {
  /** Origin to hand the client under test, e.g. `http://127.0.0.1:51234`. */
  baseUrl: string;
  /** Recorded request per case id, in the order the server matched them. */
  recorded: Map<string, RecordedRequest>;
  /** Requests that matched no waiting case: a stray retry, a preflight, a duplicate. */
  surplus: RecordedRequest[];
  close(): Promise<void>;
};

/** Turns `/pets/{id}` into `^/pets/[^/]+$`, so routing does not depend on the parameter's value. */
function templateToPattern(template: string): RegExp {
  const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

/**
 * A reference server for one run of the case table.
 *
 * Queues are keyed per `(method, pathTemplate)` rather than globally, so the only ordering requirement
 * is *within* one endpoint that has several cases — `getPet` 200 then 404, in table order. A client's
 * stray retry lands in {@link RefServer.surplus} and is reported, instead of shifting every subsequent
 * case's response by one and turning a single defect into a wall of failures.
 */
export async function startRefServer(cases: readonly ApiCase[]): Promise<RefServer> {
  const queues = new Map<string, ApiCase[]>();
  for (const apiCase of cases) {
    const key = `${apiCase.method} ${apiCase.pathTemplate}`;
    (queues.get(key) ?? queues.set(key, []).get(key)!).push(apiCase);
  }

  const routes = [...queues.keys()].map((key) => {
    const [method, template] = key.split(' ');
    return { key, method: method as HttpMethod, pattern: templateToPattern(template) };
  });

  const recorded = new Map<string, RecordedRequest>();
  const surplus: RecordedRequest[] = [];

  const record = async (request: Request, url: URL): Promise<RecordedRequest> => ({
    method: request.method.toLowerCase() as HttpMethod,
    path: url.pathname,
    query: parseQuery(url),
    headers: normalizeHeaders(request.headers),
    body: await readBody(request),
  });

  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, async (request) => {
    const url = new URL(request.url);
    const method = request.method.toLowerCase();
    const route = routes.find((r) => r.method === method && r.pattern.test(url.pathname));
    const queue = route === undefined ? undefined : queues.get(route.key);
    const next = queue?.shift();

    if (next === undefined) {
      surplus.push(await record(request, url));
      // 418 rather than 404: a generated client may legitimately expect a 404 from the table, and a
      // harness failure must never be mistakable for a case's declared response.
      return new Response('unmatched request', { status: 418 });
    }

    recorded.set(next.id, await record(request, url));

    const headers = new Headers(next.response.headers ?? {});
    const body = next.response.body === undefined ? null : JSON.stringify(next.response.body);
    if (body !== null && !headers.has('content-type')) headers.set('content-type', 'application/json');
    return new Response(next.response.status === 204 ? null : body, { status: next.response.status, headers });
  });

  return {
    baseUrl: `http://127.0.0.1:${(server.addr as Deno.NetAddr).port}`,
    recorded,
    surplus,
    close: async () => {
      await server.shutdown();
    },
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `deno test -A test/harness/ref-server.test.ts`
Expected: PASS, all five tests. If Deno reports a leaked resource, the `close()` in a `finally` is missing somewhere —
fix the test, not the server.

- [ ] **Step 5: Export it**

Add `export * from './ref-server.ts';` to `test/harness/mod.ts`.

- [ ] **Step 6: Commit**

```bash
deno fmt --check && deno lint && deno test -A test/harness
git add test/harness/ref-server.ts test/harness/ref-server.test.ts test/harness/mod.ts
git commit -m "test(harness): add the tier-4 reference server"
```

---

## Task 6: The reference client, and proving the two oracles agree

**Files:**

- Create: `test/harness/ref-client.ts`
- Create: `test/harness/ref-client.test.ts`
- Create: `test/integration/oracles.test.ts`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: `startRefServer` (Task 5), `diffRequest` (Task 4), `cases`/`casesFor` (Task 3).
- Produces, exported from `@goast/test-harness`:
  - `async function issueCase(baseUrl: string, apiCase: ApiCase): Promise<Response>` — issues `expectRequest`
    **verbatim** and returns the raw response.

**This task is the phase's actual contract proof.** If the handwritten client and the handwritten server disagree on any
case, the table is wrong or one oracle is wrong, and every later deviation attributed to a generator is untrustworthy.

- [ ] **Step 1: Write the failing tests**

Create `test/harness/ref-client.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiCase } from '../cases/types.ts';
import { issueCase } from './ref-client.ts';
import { startRefServer } from './ref-server.ts';

const base: ApiCase = {
  id: 'x/ok',
  operationId: 'x',
  method: 'post',
  pathTemplate: '/x',
  expectRequest: { path: '/x' },
  response: { status: 200, body: { ok: true } },
  expectResult: { ok: true },
  directions: ['server'],
};

describe('issueCase', () => {
  it('sends the declared path, query, headers and JSON body verbatim', async () => {
    const apiCase: ApiCase = {
      ...base,
      expectRequest: {
        path: '/x',
        query: { tags: ['a', 'b'] },
        headers: { 'x-api-key': 'k' },
        body: { kind: 'json', value: { name: 'Rex' } },
      },
    };
    const server = await startRefServer([apiCase]);
    try {
      const response = await issueCase(server.baseUrl, apiCase);

      expect(response.status).toBe(200);
      const recorded = server.recorded.get('x/ok')!;
      expect(recorded.query).toEqual({ tags: ['a', 'b'] });
      expect(recorded.headers['x-api-key']).toBe('k');
      expect(recorded.body).toEqual({ kind: 'json', value: { name: 'Rex' } });
    } finally {
      await server.close();
    }
  });

  it('does not re-encode an already-encoded path', async () => {
    const apiCase: ApiCase = { ...base, method: 'get', expectRequest: { path: '/x/abc%20def' } };
    const server = await startRefServer([{ ...apiCase, pathTemplate: '/x/{id}' }]);
    try {
      await issueCase(server.baseUrl, { ...apiCase, pathTemplate: '/x/{id}' });

      expect(server.recorded.get('x/ok')!.path).toBe('/x/abc%20def');
    } finally {
      await server.close();
    }
  });

  it('sends a form body as application/x-www-form-urlencoded', async () => {
    const apiCase: ApiCase = { ...base, expectRequest: { path: '/x', body: { kind: 'form', fields: { a: ['1'] } } } };
    const server = await startRefServer([apiCase]);
    try {
      await issueCase(server.baseUrl, apiCase);

      expect(server.recorded.get('x/ok')!.body).toEqual({ kind: 'form', fields: { a: ['1'] } });
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `deno test -A test/harness/ref-client.test.ts`
Expected: FAIL — `./ref-client.ts` does not exist.

- [ ] **Step 3: Implement**

Create `test/harness/ref-client.ts`:

```ts
import type { ApiCase, BodyExpectation } from '../cases/types.ts';

/**
 * Builds the request body a case declares.
 *
 * Deliberately dumb and generator-independent: this is the oracle, so it shares no code with any
 * generator. If it grew a URL builder or a serializer it would start making the same mistakes it
 * exists to detect.
 */
function buildBody(body: BodyExpectation | undefined): { body: BodyInit | null; contentType?: string } {
  if (body === undefined || body.kind === 'none') return { body: null };
  if (body.kind === 'json') return { body: JSON.stringify(body.value), contentType: 'application/json' };
  if (body.kind === 'text') return { body: body.value, contentType: 'text/plain' };
  if (body.kind === 'form') {
    const params = new URLSearchParams();
    for (const [key, values] of Object.entries(body.fields)) for (const value of values) params.append(key, value);
    return { body: params.toString(), contentType: 'application/x-www-form-urlencoded' };
  }
  if (body.kind === 'multipart') {
    const form = new FormData();
    for (const part of body.parts) {
      if (part.filename === undefined) form.append(part.name, part.value);
      else form.append(part.name, new File([part.value], part.filename, { type: part.contentType }), part.filename);
    }
    // No explicit content-type: `fetch` must set it, because only it knows the boundary.
    return { body: form };
  }
  const binary = Uint8Array.from(atob(body.base64), (c) => c.charCodeAt(0));
  return { body: binary, contentType: 'application/octet-stream' };
}

/**
 * Issues one case's declared request against `baseUrl`, exactly as written.
 *
 * The path is concatenated rather than passed through `URL`'s path handling, because
 * `expectRequest.path` is already encoded and re-encoding it would silently repair the very defect a
 * generated client is being measured for.
 */
export async function issueCase(baseUrl: string, apiCase: ApiCase): Promise<Response> {
  const { path, query, headers, body } = apiCase.expectRequest;

  const search = new URLSearchParams();
  for (const [key, values] of Object.entries(query ?? {})) for (const value of values) search.append(key, value);
  const queryString = search.toString();

  const built = buildBody(body);
  const requestHeaders = new Headers(headers ?? {});
  if (built.contentType !== undefined) requestHeaders.set('content-type', built.contentType);

  return await fetch(`${baseUrl}${path}${queryString === '' ? '' : `?${queryString}`}`, {
    method: apiCase.method.toUpperCase(),
    headers: requestHeaders,
    body: built.body,
  });
}
```

- [ ] **Step 4: Run the tests**

Run: `deno test -A test/harness/ref-client.test.ts`
Expected: PASS, all three tests.

- [ ] **Step 5: Write the oracle-agreement test**

Create `test/integration/oracles.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { diffRequest, formatDeviations, issueCase, startRefServer } from '@goast/test-harness';

import { cases } from '../cases/cases.ts';

/**
 * The contract proof.
 *
 * Both sides of this test are handwritten and share no code: `issueCase` builds a request from a
 * case, `startRefServer` parses it back. If they disagree, the case table is wrong or one oracle is,
 * and every deviation a *generated* client produces afterwards is unattributable. Nothing else in
 * tier 4 means anything until this passes.
 */
describe('reference client against reference server', () => {
  it('round-trips every case in the table with zero deviations', async () => {
    const server = await startRefServer(cases);
    try {
      for (const apiCase of cases) await issueCase(server.baseUrl, apiCase);

      const problems: string[] = [];
      for (const apiCase of cases) {
        const recorded = server.recorded.get(apiCase.id);
        if (recorded === undefined) {
          problems.push(`${apiCase.id}\n  the server never matched a request for this case\n`);
          continue;
        }
        const deviations = diffRequest(apiCase.expectRequest, recorded);
        if (deviations.length > 0) problems.push(`${apiCase.id}\n${formatDeviations(deviations)}`);
      }

      expect(problems.join('')).toBe('');
      expect(server.surplus).toEqual([]);
    } finally {
      await server.close();
    }
  });
});
```

- [ ] **Step 6: Run it**

Run: `deno test -A test/integration/oracles.test.ts`
Expected: PASS with zero deviations.

**If it fails, do not weaken the comparison to make it pass.** A failure here means one of three things, and each has a
different correct fix: the case table declares something `fetch` cannot send (fix the case), `readBody` parses back
something different from what `buildBody` sent (fix `wire.ts` or `ref-client.ts`), or the expectation is genuinely
ambiguous (fix the type). Report which, with the deviation text.

- [ ] **Step 7: Export and commit**

Add `export * from './ref-client.ts';` to `test/harness/mod.ts`.

```bash
deno fmt --check && deno lint && deno test -A test/harness test/integration
git add test/harness/ref-client.ts test/harness/ref-client.test.ts test/harness/mod.ts test/integration/oracles.test.ts
git commit -m "test: add the reference client and prove it agrees with the reference server"
```

---

## Task 7: The `fetch-clients` driver and committed deviations

**Files:**

- Create: `test/harness/integration/verify.ts`
- Create: `test/harness/integration/mod.ts`
- Create: `test/harness/integration/verify.test.ts`
- Create: `test/integration/fetch-clients/driver.ts`
- Create: `test/integration/fetch-clients/integration.test.ts`
- Create (generated, by running the task): `test/wire/fetch-clients/*.txt`
- Modify: `test/harness/mod.ts`

**Interfaces:**

- Consumes: everything from Tasks 3-6.
- Produces, exported from `@goast/test-harness`:
  - `function wireSnapshotFile(wireRootDir: string, profile: string, caseId: string): string`
  - `async function verifyWireDeviations(snapshotFile, deviations, options?): Promise<void>` — same contract as tier 3's
    `verifyCompileDiagnostics`: write a file when there are deviations, **delete** a stale one when there are none,
    refuse in check mode.
  - `const wireRootDir: string` in `test/harness/paths.ts`.

- [ ] **Step 1: Write the verify tests**

Create `test/harness/integration/verify.test.ts`. Model it on `test/harness/compile/verify.test.ts` — read that file
first and match its shape:

```ts
import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { verifyWireDeviations, wireSnapshotFile } from './verify.ts';

describe('wireSnapshotFile', () => {
  it('puts one file per case under the profile directory', () => {
    expect(wireSnapshotFile('/wire', 'fetch-clients', 'getPet/ok')).toBe(
      join('/wire', 'fetch-clients', 'getPet__ok.txt'),
    );
  });
});

describe('verifyWireDeviations', () => {
  it('writes the deviations in write mode', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await verifyWireDeviations(file, 'path\n  expected /a\n  actual   /b\n', { mode: 'write' });

      expect(await Deno.readTextFile(file)).toBe('path\n  expected /a\n  actual   /b\n');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('removes a stale file in write mode when the case now conforms', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await Deno.writeTextFile(file, 'stale\n');
      await verifyWireDeviations(file, '', { mode: 'write' });

      await expect(Deno.lstat(file)).rejects.toThrow();
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  it('refuses in check mode when the case now conforms', async () => {
    const dir = await Deno.makeTempDir({ prefix: 'goast-wire-' });
    try {
      const file = join(dir, 'case.txt');
      await Deno.writeTextFile(file, 'stale\n');

      await expect(verifyWireDeviations(file, '', { mode: 'check' })).rejects.toThrow('no longer deviates');
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `deno test -A test/harness/integration`
Expected: FAIL — `./verify.ts` does not exist.

- [ ] **Step 3: Implement verify**

Add to `test/harness/paths.ts`:

```ts
/** Root of the committed tier-4 wire deviations. */
export const wireRootDir: string = join(_repoRootDir, 'test', 'wire');
```

Create `test/harness/integration/verify.ts`:

```ts
import { join } from 'node:path';

import { resolveSnapshotMode, type VerifyOptions } from '../snapshot/mode.ts';
import { verifyText } from '../snapshot/verify-text.ts';

/** The task that regenerates tier 4's deviation artifacts. */
const WIRE_UPDATE_COMMAND = 'deno task test:integration';

/**
 * Where one case's deviations are committed.
 *
 * `/` in a case id becomes `__`, because ids read as `getPet/ok` and a nested directory per operation
 * would put one file in each — harder to scan than a flat, sorted list per profile.
 */
export function wireSnapshotFile(wireRootDir: string, profile: string, caseId: string): string {
  return join(wireRootDir, profile, `${caseId.replaceAll('/', '__')}.txt`);
}

/**
 * Compares one case's deviations against its committed artifact.
 *
 * A conforming case has no file, so "conforms now but an artifact is committed" needs its own
 * handling: write mode removes the stale file, check mode refuses. That refusal is what turns a
 * generator fix into a reviewable deletion instead of a silent pass — the same reasoning as tier 3's
 * `verifyCompileDiagnostics`.
 */
export async function verifyWireDeviations(
  snapshotFile: string,
  deviations: string,
  options: VerifyOptions = {},
): Promise<void> {
  const mode = options.mode ?? resolveSnapshotMode();
  const updateCommand = options.updateCommand ?? WIRE_UPDATE_COMMAND;

  if (deviations !== '') {
    await verifyText(snapshotFile, deviations, { mode, updateCommand });
    return;
  }

  let exists = true;
  try {
    await Deno.lstat(snapshotFile);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    exists = false;
  }
  if (!exists) return;

  if (mode === 'check') {
    throw new Error(
      `${snapshotFile} is committed, but this case no longer deviates from the contract.\n\n` +
        `A generator fix probably landed. Run \`${updateCommand}\` and commit the deletion.`,
    );
  }

  await Deno.remove(snapshotFile);
  console.info(`wire deviation removed ${snapshotFile}`);
}
```

Create `test/harness/integration/mod.ts` with `export * from './verify.ts';`, and add
`export * from './integration/mod.ts';` to `test/harness/mod.ts`.

- [ ] **Step 4: Discover what the generated client actually returns**

Before writing the driver, find out what `fetch-clients` hands back, rather than assuming. Write a throwaway script that
imports the committed client, points it at a `startRefServer`, calls one 200 case and one 404 case, and prints the
resolved value's shape. Delete the script afterwards.

Record in your report: what a success returns, what a non-2xx returns (does it reject, or resolve with a `Response`?),
and what a 204 returns. **Task 3's `expectResult` values must match this shape** — if they do not, updating them is part
of this task and must be called out in your report.

- [ ] **Step 5: Write the driver**

Create `test/integration/fetch-clients/driver.ts`. It takes the base URL as `Deno.args[0]`, calls each client method
with **hardcoded** arguments, and prints exactly one JSON line per case:

```ts
/**
 * Drives the generated fetch client against the reference server.
 *
 * Arguments are hardcoded rather than read from the case table on purpose: writing
 * `client.getPet({ id: 'abc def' })` in typed TypeScript *is* the assertion that the generated
 * signature is usable. Reading them from JSON would need a dynamic dispatch layer, which would erase
 * exactly what is under test.
 *
 * Output contract: one `{"caseId":…,"result":…}` line per case on stdout, and nothing else. Anything
 * else on stdout makes the harness fail to parse the run.
 */
import { PetsClient } from '../../output/typescript/fetch-clients/integration/kitchen-sink/clients/pets-client.ts';

const baseUrl = Deno.args[0];
const emit = (caseId: string, result: unknown) => console.log(JSON.stringify({ caseId, result }));

const pets = new PetsClient({ baseUrl });

{
  const response = await pets.getPet({ id: 'abc' });
  emit('getPet/ok', await response.json());
}

// … one block per case in table order, per endpoint.
```

Import paths must point at the **committed** tree under `test/output/`, never at a freshly generated one — the spec
requires that what runs is byte-identical to what was reviewed.

- [ ] **Step 6: Write the integration test**

Create `test/integration/fetch-clients/integration.test.ts`:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  diffRequest,
  diffResult,
  formatDeviations,
  startRefServer,
  verifyWireDeviations,
  wireRootDir,
  wireSnapshotFile,
} from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';

const PROFILE = 'fetch-clients';

describe(`integration/${PROFILE}`, () => {
  it('drives every client case and records its deviations', async () => {
    const cases = casesFor(PROFILE, 'client');
    const server = await startRefServer(cases);

    let output: string;
    try {
      const command = new Deno.Command(Deno.execPath(), {
        args: ['run', '-A', new URL('./driver.ts', import.meta.url).pathname, server.baseUrl],
        stdout: 'piped',
        stderr: 'piped',
      });
      const result = await command.output();
      const stderr = new TextDecoder().decode(result.stderr);
      expect(result.code, `driver exited ${result.code}\n${stderr}`).toBe(0);
      output = new TextDecoder().decode(result.stdout);
    } finally {
      await server.close();
    }

    const reported = new Map<string, unknown>();
    for (const line of output.split('\n').filter((l) => l.trim() !== '')) {
      const parsed = JSON.parse(line) as { caseId: string; result: unknown };
      reported.set(parsed.caseId, parsed.result);
    }

    // Drift protection: a forgotten case must fail loudly, not quietly shrink coverage.
    expect([...reported.keys()].sort()).toEqual(cases.map((c) => c.id).sort());
    expect(server.surplus.map((r) => `${r.method} ${r.path}`)).toEqual([]);

    for (const apiCase of cases) {
      const recorded = server.recorded.get(apiCase.id);
      const deviations = recorded === undefined
        ? [{ field: 'request', expected: 'one request', actual: 'none' }]
        : [...diffRequest(apiCase.expectRequest, recorded), ...diffResult(apiCase.expectResult, reported.get(apiCase.id))];

      await verifyWireDeviations(wireSnapshotFile(wireRootDir, PROFILE, apiCase.id), formatDeviations(deviations));
    }
  });
});
```

- [ ] **Step 7: Run it in write mode and read every artifact**

```bash
GOAST_SNAPSHOT=write deno test -A test/integration
```

Expected: PASS, with files appearing under `test/wire/fetch-clients/`. **Read every one.** For each, classify it in your
report as (a) a confirmed generator defect — expected, and one of the four already known, or a new one; (b) a mistake in
your case table; or (c) a mistake in the harness. Only (a) may be committed. Fix (b) and (c) and re-run.

- [ ] **Step 8: Confirm the run is deterministic**

```bash
GOAST_SNAPSHOT=check deno test -A test/integration
```

Expected: PASS with no drift. Run it twice. A deviation set that changes between runs means something is ordering- or
timing-dependent, which is a harness defect — report it rather than committing a flaky artifact.

- [ ] **Step 9: Commit**

```bash
deno fmt --check && deno lint
git add test/harness/paths.ts test/harness/integration test/harness/mod.ts test/integration/fetch-clients test/wire
git commit -m "test: drive the generated fetch client against the reference server"
```

---

## Task 8: Tasks, orphan sweep, docs, and the register

**Files:**

- Create: `test/integration-tests/orphans.test.ts`
- Modify: `deno.json`
- Modify: `.gitattributes`
- Modify: `test/README.md`
- Modify: `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`

**Interfaces:**

- Consumes: `findOrphanFiles` from `@goast/test-harness` (added in phase 3 for exactly this shape — standalone file
  snapshot bases, as opposed to tier 2's directory bases).

- [ ] **Step 1: Add the orphan sweep**

A renamed or deleted case must not leave its artifact behind, claiming a deviation that nothing produces any more.
Create `test/integration-tests/orphans.test.ts`, modelled on `test/compile-tests/orphans.test.ts` — read that file
first:

```ts
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { findOrphanFiles, wireRootDir, wireSnapshotFile } from '@goast/test-harness';

import { cases } from '../cases/cases.ts';

describe('wire artifacts', () => {
  it('has no artifact without a matching case', async () => {
    const expected = cases.map((c) => wireSnapshotFile(wireRootDir, 'fetch-clients', c.id));

    expect(await findOrphanFiles(wireRootDir, expected)).toEqual([]);
  });
});
```

Note the profile is hardcoded because `fetch-clients` is the only tier-4 target in this phase. Phases 6 and 7 make this
a loop over a target registry; leave a comment saying so rather than building the registry now.

- [ ] **Step 2: Add the tasks**

In `deno.json`, after the `test:compile*` entries:

```json
"test:integration": "GOAST_SNAPSHOT=write deno test -A test/integration test/integration-tests",
"test:integration:check": "GOAST_SNAPSHOT=check deno test -A test/integration test/integration-tests",
```

and extend `test:all` to `deno task test:check && deno task test:compile:check && deno task test:integration:check`.

**Tier 4 needs no opt-in guard in this phase.** Unlike tier 3, nothing here starts a container or takes minutes — the
whole run is a loopback server and one Deno subprocess. It therefore runs as part of `deno task test`, which is a
feature: the everyday loop catches a broken driver. Say so in the README. Phases 6 and 7 add containerized targets that
**will** need a `GOAST_INTEGRATION` guard; note that in the README too.

- [ ] **Step 3: Mark the artifacts as generated**

In `.gitattributes`, beside the existing `test/compile/**` rules:

```
# Tier-4 wire deviations (see test/README.md). Generated comparison output, not source; same
# line-ending reasoning as test/output/** and test/compile/** above.
test/wire/** linguist-generated
test/wire/** -text
```

Verify with `git check-attr linguist-generated -- test/wire/fetch-clients/<some-file>.txt`.

Add `"test/wire/**"` to both `fmt.exclude` and `lint.exclude` in `deno.json`.

- [ ] **Step 4: Document tier 4**

Add a `## Tier 4: integration` section to `test/README.md`, after the tier-3 section and before `## Layout`. Cover:

- What tier 4 answers that tier 3 cannot: tier 3 proves generated code *compiles*; tier 4 proves it puts the right bytes
  on the wire and hands back the right value.
- The case table as the single source of truth, and its three consumers.
- Why drivers hardcode their arguments instead of reading the table.
- **Deviations as committed artifacts**: an absent file means the case conforms exactly; a present file is a recorded
  generator defect with a register entry. `deno task test:integration` regenerates; a deletion means a fix landed.
- The oracle-agreement test, and why nothing else in the tier means anything until it passes.
- That `test/specs/integration/` is a corpus root, so the kitchen-sink also gets tier-2 snapshots and tier-3 compile
  coverage, and that tier 4 imports the **committed** tree so what runs is what was reviewed.
- That this phase covers `fetch-clients` only, with no Docker, and that phases 6 and 7 add the containerized targets
  behind a `GOAST_INTEGRATION` guard.

Update the `## Tiers` table's row 4 status from `phases 5-7` to `phase 5: fetch-clients`, and add `cases/`,
`integration/`, `integration-tests/`, `wire/`, `harness/integration/`, `harness/ref-server.ts`, `harness/ref-client.ts`
and `harness/wire.ts` to the `## Layout` block.

- [ ] **Step 5: Register what tier 4 found**

Add numbered entries to `docs/superpowers/plans/2026-07-25-generator-bug-fixes.md`, continuing from the highest existing
number, for each confirmed generator defect. At minimum the four already measured:

1. **`UrlBuilder` percent-encodes nothing** — `packages/typescript/assets/client/fetch/fetch-client.utils.ts`.
   `withPathParam` stores `String(value)` and `build()` substitutes it raw; `withQueryParam` builds `` `${k}=${v}` ``.
2. **No `style`/`explode` support** — a query array becomes `String(value)`, i.e. comma-joined, where OpenAPI's default
   is repeated keys.
3. **Every request body is `JSON.stringify(body)`** regardless of content type —
   `packages/typescript/src/generators/services/fetch-clients/fetch-client-generator.ts:226`.
4. **Cookie parameters are not implemented** — the generated method takes no arguments.

Match the format of the entries above `### Also registered, not scheduled`, and add a consistent `**Tier 4:**` element
citing the committed artifact path, the way tier-3 entries carry `**Compile gate:**` and tier-1 entries carry
`**Tier 1:**`. Add anything else Task 7 Step 7 classified as a real defect. **Verify every citation** by opening it.

- [ ] **Step 6: Full verification**

```bash
deno fmt --check && deno lint
deno task test
deno task test:output:check
deno task test:integration:check
deno task test:compile:check
```

Expected: all pass. Report each result.

- [ ] **Step 7: Commit**

```bash
git add deno.json .gitattributes test/README.md test/integration-tests \
        docs/superpowers/plans/2026-07-25-generator-bug-fixes.md
git commit -m "docs: document tier 4 and register what the wire contract found"
```

---

## Out of scope, recorded rather than dropped

- **Fixing any generator defect tier 4 finds.** Every one is registered and left. A fix changes generated output, which
  changes tier-2 and tier-3 snapshots, and belongs to its own phase.
- **The server direction.** `spring-controllers` with handwritten delegates is phase 6. The reference client is built
  here anyway, because the oracle-agreement test needs it and because discovering its design problems now is the whole
  reason phase 5 precedes the container work.
- **Every containerized target.** okhttp3, spring-reactive-web, spring-controllers (phase 6); angular, k6,
  easy-network-stub (phase 7). `docker.ts` already exists and is untouched here.
- **The `k6`, `playwright` Dockerfiles.** Phase 7.
- **CI wiring.** Phase 8 owns the workflow and the seven per-target jobs.
- **A target registry for tier 4.** With one target, a registry is speculative structure. Phase 6 adds the second target
  and can extract it from two real cases instead of one imagined one. The orphan sweep hardcodes `fetch-clients` and
  says so.
- **Response-header assertions in the client direction.** The case table carries `response.headers` and the reference
  server sends them, but `fetch-clients` exposes the raw `Response`, so asserting them would test `fetch`, not the
  generator. Phase 7's angular target, which maps headers into a typed result, is where this becomes meaningful.

## Halt conditions

Report BLOCKED rather than working around any of these:

- The oracle-agreement test (Task 6) cannot be made to pass without weakening the comparison. That means the contract
  design is wrong, which is precisely what this phase exists to discover early — stop and report, do not loosen
  `diffRequest`.
- Adding the `integration` corpus root changes any pre-existing snapshot under `test/output/` or any diagnostic under
  `test/compile/`. It must only add.
- A deviation set differs between two consecutive runs. A non-deterministic artifact is worse than none.
- The driver cannot call an operation because the generator emitted no method for it. Report which operation and what
  was emitted instead.
- Making a case pass requires changing production code under `packages/`.

## Self-review

**Spec coverage.** The spec's Tier 4 section has six parts. *Case table* — Task 3, with the shape copied verbatim and
`casesFor` added so drift protection and `except` are computed one way. *Reference server* — Task 5: ephemeral port,
in-process, per-`(method, pathTemplate)` queues, surplus bucket, and the normalization the spec names (header allowlist,
order-insensitive query multi-map, structural JSON, parsed multipart) in Task 4. *Reference client* — Task 6:
handwritten, raw `fetch`, sharing no code with any generator. *Per-target wiring* — Task 7 covers the one row of that
table with no container. *Kitchen-sink spec* — Task 2, restricted to wire-observable concerns, with the generative
concerns explicitly left in the tier-2/3 corpus. *Docker layer* — already built in phase 3; this phase deliberately uses
none of it.

Two spec details this plan implements differently, both stated above: committed artifacts live under `test/wire/`
rather than beside the drivers in `test/integration/`, so the generated-artifact roots stay uniform with `test/output/`
and `test/compile/`; and a generator that is *wrong* produces a deviation artifact rather than an `except` entry, which
is the owner's ruling and keeps `except` meaning "cannot express by design".

**Placeholder scan.** No TBDs. Three steps deliberately produce a measurement rather than transcribe one, and each names
its output and what to do with either result: Task 2 Step 2 verifies a method exists per `operationId` and says to
report a missing one rather than working around it; Task 7 Step 4 discovers the generated client's actual return shape
before the driver hardcodes it, and says updating Task 3's `expectResult` values is part of the task; Task 7 Step 7
classifies every artifact into defect, case-table mistake, or harness mistake, and permits committing only the first.
Task 3 Step 4 and Task 5's route table both spell out the concrete content rather than describing it.

**Type consistency.** `ApiCase`, `BodyExpectation`, `RecordedRequest`, `RecordedBody`, `HttpMethod` and `Direction` are
defined once in Task 3's `types.ts` and consumed under those exact names by Tasks 4, 5, 6 and 7. `Deviation` and
`formatDeviations` are defined in Task 4 and used in Tasks 6 and 7. `startRefServer(cases)` returns the `RefServer`
shape Task 6 and Task 7 destructure (`baseUrl`, `recorded`, `surplus`, `close`). `issueCase(baseUrl, apiCase)` is
defined in Task 6 and used only there. `wireSnapshotFile(wireRootDir, profile, caseId)` and `verifyWireDeviations` are
defined in Task 7 and reused by Task 8's orphan sweep, which also consumes `wireRootDir` from `paths.ts`. `casesFor`
is defined in Task 3 and is the only path to a filtered table in Tasks 7 and 8.
