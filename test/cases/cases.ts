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
  // --- Pets: getPet — baseline, 200 -----------------------------------------------------------
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

  // --- Pets: updatePet — two real content types (json, form) on one operation -----------------
  {
    id: 'updatePet/json',
    operationId: 'updatePet',
    method: 'put',
    pathTemplate: '/pets/{id}',
    expectRequest: {
      path: '/pets/abc',
      body: { kind: 'json', value: { name: 'Rex', age: 4 } },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { id: 'abc', name: 'Rex', age: 4 },
    },
    expectResult: { id: 'abc', name: 'Rex', age: 4 },
    directions: ['client', 'server'],
  },
  {
    id: 'updatePet/form',
    operationId: 'updatePet',
    method: 'put',
    pathTemplate: '/pets/{id}',
    expectRequest: {
      path: '/pets/abc',
      body: { kind: 'form', fields: { name: ['Rex'], age: ['4'] } },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { id: 'abc', name: 'Rex', age: 4 },
    },
    expectResult: { id: 'abc', name: 'Rex', age: 4 },
    directions: ['client', 'server'],
  },
  // --- Pets: addPetNote — a text/plain body -----------------------------------------------------
  // An earlier revision of this table faked this case: it claimed `updatePet` sent `text/plain`,
  // which that operation does not declare, and scoped it to `directions: ['server']` so nothing
  // would ever try to drive it. The owner ruled the spec should carry a real `text/plain` operation
  // instead, so `addPetNote` was added to the kitchen-sink and this case now describes it honestly
  // and runs in both directions.
  //
  // The generated client is expected to DEVIATE here, and recording that is the point: it emits
  // `JSON.stringify(body)` with no `content-type`, so a `text/plain` body of `plain text body`
  // reaches the wire as the JSON string `"plain text body"` — quoted. Per this phase's design that
  // becomes a committed deviation artifact, not an `except` entry.
  //
  // "With no content-type" describes the *client*, not the wire: `fetch` still supplies its own
  // default for a string body with no header set. The committed artifact
  // (`test/wire/fetch-clients/addPetNote__text.txt`) therefore shows `actual text/plain;charset=UTF-8`,
  // not an absent header — a reader comparing this comment to that file should expect the default,
  // not silence.
  {
    id: 'addPetNote/text',
    operationId: 'addPetNote',
    method: 'post',
    pathTemplate: '/pets/{id}/note',
    expectRequest: {
      path: '/pets/abc/note',
      headers: { 'content-type': 'text/plain' },
      body: { kind: 'text', value: 'plain text body' },
    },
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { id: 'abc', name: 'Rex' },
    },
    expectResult: { id: 'abc', name: 'Rex' },
    directions: ['client', 'server'],
  },

  // --- Pets: deletePet — 204 no-content ---------------------------------------------------------
  {
    id: 'deletePet/noContent',
    operationId: 'deletePet',
    method: 'delete',
    pathTemplate: '/pets/{id}',
    expectRequest: { path: '/pets/abc' },
    response: { status: 204 },
    // CONFIRMED (Task 7 Step 4): `deletePet` generates `Promise<TypedResponse<void>>`, and
    // `_VoidResponse` omits `.json()` entirely — a driver cannot parse a body that was never typed as
    // parseable. The only thing a driver can reasonably report for a void response is its status, and
    // running the generated client against the reference server confirms exactly this shape.
    expectResult: { status: 204 },
    directions: ['client', 'server'],
  },

  // --- Pets: createPet — 201, json body, bearerAuth ---------------------------------------------
  {
    id: 'createPet/created',
    operationId: 'createPet',
    method: 'post',
    pathTemplate: '/pets',
    expectRequest: {
      path: '/pets',
      // JUDGMENT CALL (auth case 1 of 2): `fetch-clients` generates no security-scheme code at all —
      // `createPet(body: Pet)` never touches an `authorization` header. The only way a caller can
      // satisfy `bearerAuth` with this client is by constructing it with
      // `new PetsClient({ baseUrl, headers: { authorization: '...' } })`, since every generated method
      // starts with `const headers = { ...this.options.headers }`. That is what Task 7's driver is
      // expected to do; it is not one of the four/five known wire limitations, so no `except` applies.
      headers: { authorization: 'Bearer secret-token' },
      body: { kind: 'json', value: { id: 'new1', name: 'Fido' } },
    },
    response: {
      status: 201,
      headers: { 'content-type': 'application/json' },
      body: { id: 'new1', name: 'Fido' },
    },
    expectResult: { id: 'new1', name: 'Fido' },
    directions: ['client', 'server'],
  },

  // --- Pets: uploadPetPhoto — multipart/form-data with a file part -------------------------------
  {
    id: 'uploadPetPhoto/ok',
    operationId: 'uploadPetPhoto',
    method: 'post',
    pathTemplate: '/pets/{id}/photo',
    expectRequest: {
      path: '/pets/abc/photo',
      body: {
        kind: 'multipart',
        parts: [
          { name: 'file', filename: 'photo.png', contentType: 'image/png', value: 'binarydata' },
          { name: 'caption', value: 'A good boy' },
        ],
      },
    },
    response: { status: 200 },
    // JUDGMENT CALL: void response (no content declared on the 200), same reasoning as deletePet.
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },

  // --- Widgets: getWidget — response headers, 200/400/404/500/default, apiKeyAuth ----------------
  {
    id: 'getWidget/ok',
    operationId: 'getWidget',
    method: 'get',
    pathTemplate: '/widgets/{id}',
    expectRequest: {
      path: '/widgets/w1',
      // JUDGMENT CALL (auth case 2 of 2): same reasoning as createPet/created — `getWidget` generates
      // no apiKeyAuth code either; the header is only present because the driver is expected to
      // construct `WidgetsClient` with `headers: { 'x-api-key': ... }`.
      headers: { 'x-api-key': 'secret-key' },
    },
    response: {
      status: 200,
      // `X-Rate-Limit` is declared as a response header in the spec. Nothing in this phase asserts a
      // response header from the client direction — `fetch-clients` exposes the raw `Response` and the
      // plan explicitly puts response-header assertions out of scope until phase 7's angular target —
      // but the reference server still needs to send it so the header exists on the wire to observe.
      headers: { 'content-type': 'application/json', 'x-rate-limit': '42' },
      body: { id: 'w1', name: 'Sprocket', price: 9.99 },
    },
    expectResult: { id: 'w1', name: 'Sprocket', price: 9.99 },
    directions: ['client', 'server'],
  },
  {
    id: 'getWidget/badRequest',
    operationId: 'getWidget',
    method: 'get',
    pathTemplate: '/widgets/{id}',
    expectRequest: { path: '/widgets/bad', headers: { 'x-api-key': 'secret-key' } },
    response: {
      status: 400,
      headers: { 'content-type': 'application/json' },
      body: { message: 'Invalid widget id', code: 400 },
    },
    // MEASURED (Task 7 Step 4): `getWidget` returns `Promise<TypedResponse<Widget>>` unconditionally —
    // there is no per-status overload, so the type gives a caller no way to know, from the signature
    // alone, that a particular call might come back non-2xx. `fetch` never rejects on an HTTP error
    // status, and `TypedResponse<Widget>`'s `.json()` is therefore just as callable on a 400 as on a
    // 200; running it against the reference server confirms it resolves with the actual response body
    // (mis-typed as `Widget`, but that is a static-only claim `JSON.parse` does not check). A driver
    // restricted to what the generated signature allows has no reason to read `.status` instead, so
    // this asserts on the decoded body, matching `response.body` above.
    expectResult: { message: 'Invalid widget id', code: 400 },
    directions: ['client', 'server'],
  },
  {
    id: 'getWidget/notFound',
    operationId: 'getWidget',
    method: 'get',
    pathTemplate: '/widgets/{id}',
    expectRequest: { path: '/widgets/missing', headers: { 'x-api-key': 'secret-key' } },
    response: {
      status: 404,
      headers: { 'content-type': 'application/json' },
      body: { message: 'Widget not found', code: 404 },
    },
    // MEASURED — see getWidget/badRequest above; same reasoning.
    expectResult: { message: 'Widget not found', code: 404 },
    directions: ['client', 'server'],
  },
  {
    id: 'getWidget/serverError',
    operationId: 'getWidget',
    method: 'get',
    pathTemplate: '/widgets/{id}',
    expectRequest: { path: '/widgets/boom', headers: { 'x-api-key': 'secret-key' } },
    response: {
      status: 500,
      headers: { 'content-type': 'application/json' },
      body: { message: 'Internal error', code: 500 },
    },
    // MEASURED — see getWidget/badRequest above; same reasoning.
    expectResult: { message: 'Internal error', code: 500 },
    directions: ['client', 'server'],
  },
  {
    id: 'getWidget/unexpectedError',
    operationId: 'getWidget',
    method: 'get',
    pathTemplate: '/widgets/{id}',
    expectRequest: { path: '/widgets/other', headers: { 'x-api-key': 'secret-key' } },
    // 503 is not one of the spec's explicit codes (200/400/404/500), so it can only be served by the
    // `default` response.
    response: {
      status: 503,
      headers: { 'content-type': 'application/json' },
      body: { message: 'Unexpected error', code: 503 },
    },
    // MEASURED — see getWidget/badRequest above; same reasoning.
    expectResult: { message: 'Unexpected error', code: 503 },
    directions: ['client', 'server'],
  },

  // --- Blobs: uploadBlob — application/octet-stream, 201 -----------------------------------------
  {
    id: 'uploadBlob/ok',
    operationId: 'uploadBlob',
    method: 'post',
    pathTemplate: '/blobs',
    expectRequest: {
      path: '/blobs',
      body: { kind: 'binary', base64: 'aGVsbG8=' }, // "hello"
    },
    response: {
      status: 201,
      headers: { 'content-type': 'application/json' },
      body: { id: 'blob1' },
    },
    expectResult: { id: 'blob1' },
    directions: ['client', 'server'],
  },

  // --- Params: allLocations — path, query, header, cookie -----------------------------------------
  {
    id: 'allLocations/ok',
    operationId: 'allLocations',
    method: 'get',
    pathTemplate: '/locations/{pathParam}',
    expectRequest: {
      path: '/locations/loc1',
      query: { queryParam: ['q1'] },
      // The spec declares `session` as a cookie parameter; a cookie is carried on the wire as a
      // `Cookie` request header, so that is how this case expresses it. `fetch-clients` drops this
      // parameter entirely (found in Task 2: `allLocations(params: { pathParam, queryParam?,
      // xHeaderParam? })` has no `session` and sets no `Cookie` header at all) — a fifth wire
      // limitation alongside the four the plan already lists. Per instruction, this is NOT declared as
      // an `except`: the profile is not incapable of expressing a cookie by design, it is simply wrong,
      // and driving it will produce a committed deviation artifact instead.
      headers: { 'x-header-param': 'h1', cookie: 'session=abc123' },
    },
    response: { status: 200 },
    // JUDGMENT CALL: void response, same reasoning as deletePet.
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },

  // --- Params: styleMatrix — one case per style/explode query parameter --------------------------
  {
    id: 'styleMatrix/formExploded',
    operationId: 'styleMatrix',
    method: 'get',
    pathTemplate: '/styles',
    // `style: form, explode: true` is OpenAPI's default for a query array: repeated keys.
    expectRequest: { path: '/styles', query: { formExploded: ['a', 'b'] } },
    response: { status: 200 },
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },
  {
    id: 'styleMatrix/formUnexploded',
    operationId: 'styleMatrix',
    method: 'get',
    pathTemplate: '/styles',
    // `style: form, explode: false`: a single comma-joined value.
    expectRequest: { path: '/styles', query: { formUnexploded: ['a,b'] } },
    response: { status: 200 },
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },
  {
    id: 'styleMatrix/spaceDelimited',
    operationId: 'styleMatrix',
    method: 'get',
    pathTemplate: '/styles',
    // `style: spaceDelimited, explode: false`: a single space-joined value.
    expectRequest: { path: '/styles', query: { spaceDelimited: ['a b'] } },
    response: { status: 200 },
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },

  // --- Params: pathStyleSimple — path array, style: simple, explode: false -----------------------
  {
    id: 'pathStyleSimple/ok',
    operationId: 'pathStyleSimple',
    method: 'get',
    pathTemplate: '/styles/{values}',
    // `style: simple` joins array items with a comma and no brackets, unescaped in the path segment.
    expectRequest: { path: '/styles/a,b' },
    response: { status: 200 },
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },

  // --- Params: getEncoded — the encoding case: percent-encoded path, encoded query & and = --------
  {
    id: 'getEncoded/ok',
    operationId: 'getEncoded',
    method: 'get',
    pathTemplate: '/encoded/{value}',
    expectRequest: {
      // Value is "abc def/x": a space and a slash, both of which must be percent-encoded to survive as
      // one path segment. `path` is compared literally against `url.pathname`, which Deno's URL parser
      // does not decode, so the encoded form is exactly what is asserted here.
      path: '/encoded/abc%20def%2Fx',
      // "a&b=c" round-trips through `URLSearchParams`/`parseQuery` already decoded — the encoding lives
      // only in the URL that carries it (`raw=a%26b%3Dc`), not in this multi-map.
      query: { raw: ['a&b=c'] },
    },
    response: { status: 200 },
    expectResult: { status: 200 },
    directions: ['client', 'server'],
  },
];
