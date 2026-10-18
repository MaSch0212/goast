# Go Clients Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GoClientsGenerator` to `@goast/go` that generates idiomatic, standard-library Go API clients (one
`<Tag>Client` per tag plus `client_runtime.go`) that are wire-compatible with the generated Go servers.

**Architecture:** Mirrors the servers generator: a provider `GoClientsGenerator` (package, runtime asset, identifier
reservation, output) delegating per service to `DefaultGoClientGenerator extends GoFileGenerator`, whose protected
methods analyse each operation into a `GoClientOperation` and write the client type, constructor, `Params` structs,
multipart form structs and methods. Schema helpers the server already has are extracted into a shared module so both
generators classify parameters and bodies identically. The fixed Go code lives in `packages/go/assets/clients/
client_runtime.go`, copied like `server_runtime.go`.

**Tech Stack:** TypeScript (Node 24, vitest, oxlint/oxfmt, tsc 7), `@goast/core`, Go 1.22+ standard library, Docker
`golang:1.27-alpine` image (`test/docker/go`) for tiers 3/4.

**Spec:** `docs/superpowers/specs/2026-10-17-go-clients-generator-design.md`

## Global Constraints

- Standard library only in all generated Go code; no third-party Go dependency.
- Generated code must be `gofmt`-clean and pass `go build` + `go vet` (tier 3).
- Encoding must mirror the server runtime's decoding (`packages/go/assets/servers/server_runtime.go`: `pathParamValues`,
  `queryParamValues`, `headerParamValues`, `cookieParamValues`, form/multipart decoding).
- Config defaults: `packagePath: 'client'`; `packageName` derived via `toGoPackageName(path || modulePath)`; `baseUrl` and
  `pathModifier` default `undefined`.
- Method parameter order: `ctx`, path params (path order), required query/header/cookie params (declaration order),
  body, `params *{Op}Params` (only optional query/header/cookie), `opts ...RequestOption`.
- Any 2xx is success; `default` is the success response only if no 2xx is declared; non-2xx → `*ResponseError`.
- Supported parameters = exactly those `DefaultGoServerGenerator.getParameterDecoding` accepts; others skipped and
  listed in the method doc.
- Request media type preference when several are declared: JSON, `application/x-www-form-urlencoded`,
  `multipart/form-data`, `text/*`, other.
- Every exported declaration and public/protected member gets JSDoc in the PR #90 style (see
  `packages/go/src/generators/servers/*.ts` for the Go package's existing examples).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push.
- Deviation from the spec's wording, decided here: the default base URL constant is per client,
  `{Client}DefaultBaseURL` (e.g. `PetsClientDefaultBaseURL`), because `baseUrl` may differ per service. Task 1 updates
  the spec line.

## Review Focus

1. Path parameter values containing `/`, space, `%`, `?`, `#` must arrive at the server unchanged → runtime test
   `TestPathParamEscapesReservedCharacters` (Task 2) and the kitchen-sink `getEncoded` case (Task 8).
2. A base URL with a path and/or trailing slash (`https://h/v1/`) joined with `/pets` must give `https://h/v1/pets`
   (no `//`, path kept); a base URL with no scheme/host must return the "no base URL" error without sending → runtime
   tests `TestJoinURL*`, `TestDoWithoutBaseURL` (Task 2).
3. A 2xx with an empty body (204, or 200 with `Content-Length: 0`) on an operation that has a body type returns the zero
   value and nil error → runtime test `TestDecodeJSONEmptyBody` (Task 2).
4. A non-2xx whose body is not valid JSON (or has no declared schema) yields a `*ResponseError` with the raw `Body` and
   `Value == nil`, never a decode error → runtime test `TestResponseErrorInvalidJSON` (Task 2).
5. Query values with `+`, `&`, `=` and spaces, and `spaceDelimited`/`pipeDelimited` arrays, decode on the server to the
   original values → runtime test `TestQueryParamStyles` (Task 2) and the kitchen-sink params cases (Task 8).

---

### Task 1: Extract shared schema helpers (pure refactor)

**Files:**
- Create: `packages/go/src/generators/schema-utils.ts`
- Modify: `packages/go/src/generators/servers/server-generator.ts` (`resolveSchema`, `getObjectSchema`, `getBodyKind`
  delegate; `getMultipartFieldDecoding` uses `isGoFileSchema`)
- Modify: `packages/go/src/generators/index.ts` (export the new module)
- Modify: `docs/superpowers/specs/2026-10-17-go-clients-generator-design.md` (the `DefaultBaseURL` line →
  `{Client}DefaultBaseURL`)
- Test: `packages/go/src/generators/schema-utils.test.ts`

**Interfaces:**
- Produces:
  - `resolveGoSchema(schema: Nullable<ApiSchema>): ApiSchema | undefined` — the body of today's `resolveSchema`
    (reference resolution + `oneOf [X, null]` unwrapping).
  - `getGoObjectSchema(schema: Nullable<ApiSchema>): ApiSchema<'object'> | null` — today's `getObjectSchema`.
  - `getGoBodyKind(mediaType: string): 'json' | 'form' | 'multipart' | 'text' | 'raw'` — today's `getBodyKind`.
  - `isGoFileSchema(schema: Nullable<ApiSchema>): boolean` — `string` + `format: 'binary'` after resolving.

- [ ] **Step 1: Write the failing tests** — `schema-utils.test.ts`: `getGoBodyKind` returns `json` for
  `application/json` and `application/problem+json`, `form` for `application/x-www-form-urlencoded`, `multipart` for
  `multipart/form-data`, `text` for `text/plain`, `raw` for `application/octet-stream`; `isGoFileSchema` is true for
  `{type:'string',format:'binary'}` and false for `{type:'string'}` (build schemas with the helpers the models tests
  use, or parse a tiny spec with `OpenApiGenerator` as `servers-generator.test.ts` does).
- [ ] **Step 2: Run** `npx vitest run packages/go/src/generators/schema-utils.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the four functions by moving the code; make the server's protected methods call them.
- [ ] **Step 4: Run** `npx vitest run packages/go` and `GOAST_SNAPSHOT=check npx vitest run test/output-tests -t go` —
  Expected: all PASS, snapshots unchanged.
- [ ] **Step 5: Commit** `refactor(go): share schema helpers between the generators`.

### Task 2: Client runtime asset

**Files:**
- Create: `packages/go/assets/clients/client_runtime.go` (package `client`, an `import ( … )` block as in
  `server_runtime.go`, `// #region` sections)
- Create: `test/integration/go-clients/runtime/client_runtime_test.go` (package `client`)
- Create: `test/integration/go-clients/runtime.test.ts` (gated by `GOAST_INTEGRATION`, like the other tier-4 legs)
- Modify: `package.json` scripts: `test:integration:go-clients` / `test:integration:go-clients:check`
  (`GOAST_INTEGRATION=1 … vitest run test/integration/go-clients`)

**Interfaces:**
- Produces (Go, exported):
  - `type ClientOption func(*clientOptions)`; `WithHTTPClient(c *http.Client) ClientOption` (default
    `http.DefaultClient`); `WithRequestEditor(f func(ctx context.Context, req *http.Request) error) ClientOption`.
  - `type RequestOption func(ctx context.Context, req *http.Request) error`; `WithRequestHeader(name, value string)
    RequestOption`; `WithEditor(f func(ctx context.Context, req *http.Request) error) RequestOption`.
  - `type ResponseError struct { StatusCode int; Header http.Header; Body []byte; Value any }` with
    `Error() string` → `"unexpected status <code> <text>"` plus `": <first 200 bytes of body>"` when non-empty.
  - `type File struct { Name string; ContentType string; Content io.Reader }`.
- Produces (Go, unexported, used by generated code — names are what Task 5/6 emit):
  - `newClient(baseURL, defaultBaseURL string, opts []ClientOption) *client`
  - `(c *client) newRequest(method, path string) *request`
  - `pathParam(name, style string, explode, array bool, values []string) string` — `simple`: values `url.PathEscape`d,
    joined by `,`; `label`: `.` + join by `.` if explode else `,`; `matrix`: array+explode → `;name=v1;name=v2`,
    otherwise `;name=` + join `,`.
  - `(r *request) query(name, style string, explode, array bool, values []string)` — not array or (explode && `form`)
    → one `name=value` per value; else one value joined by `,` / ` ` (`spaceDelimited`) / `|` (`pipeDelimited`).
  - `(r *request) header(name string, values []string)` (joined by `,`), `(r *request) cookie(name string, values
    []string)` (joined by `,`).
  - `(r *request) jsonBody(v any) error`, `(r *request) formBody(v url.Values)`, `(r *request) multipartBody(write
    func(w *multipart.Writer) error) error`, `(r *request) textBody(contentType, v string)`, `(r *request)
    rawBody(contentType string, v io.Reader)`.
  - `formatString[T ~string](v T) string`, `formatInt[T ~int|~int8|~int16|~int32|~int64](v T) string`,
    `formatFloat[T ~float32|~float64](v T) string` (`strconv.FormatFloat(…, 'g', -1, bits)`), `formatBool[T ~bool](v T)
    string`, `formatTime(v time.Time) string` (RFC 3339 nano), `formatBytes(v []byte) string` (std base64),
    `formatJSON[T any](v T) (string, error)`, `formatAll[T any](vs []T, f func(T) string) []string`.
  - `writeFormFile(w *multipart.Writer, name string, f File) error`, `writeFormField(w *multipart.Writer, name, value
    string) error`.
  - `(c *client) do(ctx context.Context, r *request, opts []RequestOption) (*http.Response, error)` — joins base URL and
    path (`strings.TrimRight(base, "/") + path`, query appended), returns
    `errors.New("no base URL: pass one to the client's constructor")` when the joined URL has no scheme or host,
    applies client editors then call options, sends.
  - `isSuccess(resp *http.Response) bool` (2xx).
  - `decodeJSON[T any](resp *http.Response) (T, error)` (empty body → zero, nil), `decodeText(resp) (string, error)`,
    `decodeBytes(resp) ([]byte, error)`.
  - `newResponseError(resp *http.Response, value func(status int, body []byte) any) *ResponseError` (reads the body;
    `value` may be nil) and `decodeErrorJSON[T any](body []byte) any` (returns `*T`, or nil when the body is not valid
    JSON).

- [ ] **Step 1: Write the failing Go tests** in `client_runtime_test.go` using `net/http/httptest`:
  `TestPathParamEscapesReservedCharacters` (`pathParam("id","simple",false,false,[]string{"a/b c%?#"})` ==
  `"a%2Fb%20c%25%3F%23"`), `TestPathParamStyles` (label `.a.b` exploded, `.a,b` not; matrix `;id=a;id=b` /
  `;id=a,b`), `TestQueryParamStyles` (round-trip through an `httptest` server reading `r.URL.Query()`: `a+b&c=d` and
  `x y` unchanged; `spaceDelimited` → one value `a b`, `pipeDelimited` → `a|b`, exploded form → two values),
  `TestJoinURLWithPathAndTrailingSlash` (`https://h/v1/` + `/pets` → `https://h/v1/pets`), `TestDoWithoutBaseURL`
  (base `""` and `"/v1"` → the "no base URL" error, server not hit), `TestDecodeJSONEmptyBody` (204 and empty 200 →
  zero value, nil), `TestResponseErrorInvalidJSON` (404 with `not json` → `Body` raw, `Value` nil, `errors.As` works),
  `TestRequestEditorsOrder` (client editor runs before call option; header set by `WithRequestHeader` arrives),
  `TestMultipartFile` (`File` part arrives with filename and content type).
- [ ] **Step 2: Write `runtime.test.ts`**: builds the `go` image (`buildImage('go', join(repoRootDir,'test','docker',
  'go'))`), runs it with `entrypoint: 'sh'` and a command that copies the asset and the test file into `/work/client`,
  writes `go.mod` (`module example.com/generated`, `go 1.22`) and runs `cd /work/client && go vet . && go test .`;
  asserts exit code 0 and prints stdout on failure. Mount both read-only (see `test/integration/go-servers/
  integration.test.ts` for `startContainer`/`runContainer` usage). `describe.skipIf(!enabled)`.
- [ ] **Step 3: Run** `GOAST_INTEGRATION=1 npx vitest run test/integration/go-clients/runtime.test.ts` — Expected: FAIL.
- [ ] **Step 4: Implement `client_runtime.go`** with the interfaces above; every declaration has a Go doc comment.
- [ ] **Step 5: Run** the same command — Expected: PASS (all Go tests ok, `go vet` clean).
- [ ] **Step 6: Commit** `feat(go): add the client runtime`.

### Task 3: Config, types and the `GoClientsGenerator` provider

**Files:**
- Create: `packages/go/src/generators/clients/models.ts`, `operation.ts`, `args.ts`, `clients-generator.ts`,
  `index.ts`, `client-generator.ts` (a stub `DefaultGoClientGenerator` writing only the package clause + client type in
  this task)
- Modify: `packages/go/src/generators/index.ts` (`export * from './clients/index.ts'`)
- Test: `packages/go/src/generators/clients/clients-generator.test.ts`

**Interfaces:**
- Produces:
  - `GoClientsGeneratorConfig = GoGeneratorConfig & { packagePath: string; packageName?: string; baseUrl?: string |
    RegExp | ((baseUrl: string, service: ApiService) => string); pathModifier?: RegExp | ((path: string, endpoint:
    ApiEndpoint) => string) }`; `defaultGoClientsGeneratorConfig = { ...defaultGoGeneratorConfig, packagePath: 'client'
    }`.
  - `GoClientsGeneratorInput = GoModelsGeneratorOutput`; `GoClientsGeneratorOutput = { go: { clients: { [serviceId:
    string]: GoClientGeneratorOutput } } }`; `GoClientGeneratorOutput = { client: go.Reference<SourceBuilder>;
    constructor: go.Reference<SourceBuilder> }`.
  - `GoClientsGeneratorContext` = services provider context & `{ package: GoPackageInfo; runtimeNames: Record<string,
    string>; operations: Map<string, GoClientOperation> }`; `GoClientGeneratorContext = … & { service: ApiService }`.
  - `GoClientsGenerator` with the same structure as `GoServersGenerator` (`initResult`, `buildContext` incl.
    `exclude-from-generation` filter, `getPackage`, `reserveRuntimeNames`, `generateRuntime` writing
    `{dir}/client_runtime.go` from asset `clients/client_runtime.go`, `generateService`, `addServiceResult`). Prefer
    extracting the shared `getPackage`/`reserveRuntimeNames`/runtime-copy code into a helper used by both providers over
    copying it.
  - `GoClientOperation` (in `operation.ts`), decided fields: `endpoint`, `name` (method name), `paramsTypeName: string |
    null`, `formTypeName: string | null`, `pathParts: (string | GoClientParameter)[]` (literal text and parameters, after
    `pathModifier`), `positional: GoClientParameter[]` (path, then required query/header/cookie), `optional:
    GoClientParameter[]`, `skippedParameters: ApiParameter[]`, `body: GoClientBody | null`, `success: GoClientSuccess`,
    `errors: GoClientErrorResponse[]`, `declared: boolean`. `GoClientParameter = { parameter: ApiParameter; name: string
    (Go identifier: unexported for positional args, exported field name for params); type: go.Type; format:
    AppendValue (the `formatX` function); array: boolean }`. `GoClientBody = { content: ApiContent; kind: GoBodyKind;
    type: go.Type; optional: boolean; fields: GoClientFormField[] | null }`. `GoClientSuccess = { type: go.Type | null;
    pointer: boolean; byStatus: { status: number | 'range2' | 'default'; kind: 'json' | 'text' | 'raw'; type: go.Type
    }[] }` (`type` is `any` when the success bodies disagree, null when none has a body). `GoClientErrorResponse = {
    status: number | { range: number } | 'default'; type: go.Type }` (JSON bodies only).

- [ ] **Step 1: Write the failing tests** (helper `generate(spec, config)` like `servers-generator.test.ts`, reading
  `out/client`):
  `writes one client file per tag and the runtime once` (files `pets_client.go`, `files_client.go`,
  `client_runtime.go`; models stay in `out/api`), `imports the models from the api package` (`import
  "example.com/generated/api"`), `renames a runtime identifier that a schema declares` with `packagePath: 'api'` and a
  schema `ClientOption` → `type ClientOption2 func(*clientOptions)` and usages renamed, `publishes the client and its
  constructor` (`output.go.clients[...]` → `PetsClient`, `NewPetsClient`).
- [ ] **Step 2: Run** `npx vitest run packages/go/src/generators/clients` — Expected: FAIL.
- [ ] **Step 3: Implement** the files above.
- [ ] **Step 4: Run** the tests — Expected: PASS.
- [ ] **Step 5: Commit** `feat(go): add the clients generator provider`.

### Task 4: Client type, constructor and method signatures

**Files:**
- Modify: `packages/go/src/generators/clients/client-generator.ts`, `args.ts`
- Test: `clients-generator.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers; server `getValueDecoding` rules for which parameters are supported (re-implement as
  `getParameterEncoding(ctx, { parameter }): { type: go.Type; format: AppendValue; array: boolean } | null`, accepting
  exactly what the server accepts: primitives/enums/arrays of those, `null` otherwise).
- Produces protected methods (each with an `Args` type): `getOperation`, `getParameters`, `getParameterEncoding`,
  `getPathParts`, `getBaseUrl`, `getClientStruct`, `getConstructor`, `getParamsStruct`, `getMethodSignature`
  (parameter list + results), `getEndpointDocText`. Emitted Go (exact):

```go
// PetsClientDefaultBaseURL is the base URL a PetsClient uses when NewPetsClient gets none.
const PetsClientDefaultBaseURL = "https://example.com/v1"

// PetsClient calls the operations of the Pets API.
type PetsClient struct {
	c *client
}

// NewPetsClient creates a client for the Pets API. baseURL is prepended to the path of every operation; when it is
// empty, PetsClientDefaultBaseURL is used.
func NewPetsClient(baseURL string, opts ...ClientOption) *PetsClient {
	return &PetsClient{c: newClient(baseURL, PetsClientDefaultBaseURL, opts)}
}
```

- `getBaseUrl`: first server URL of the service (`ctx.service.$src ?? endpoints[0].$src`), variables `{x}` replaced by
  `servers[0].variables[x].default` (left as is if absent), then `modifyString(url, config.baseUrl, service)`; `''` when
  no server.
- Names: method = operation name (`toExportedName`), positional args `toUnexportedName(param.name, 'param')` made
  unique against `ctx`, `body`, `params`, `opts`; `{Op}Params` via `registry.reserveFirst([`${name}Params`,
  `${name}Parameters`])`; operations shared by several tags declared once (`declared` flag, like the server).

- [ ] **Step 1: Write the failing tests** using the `petsApi` fixture of `servers-generator.test.ts` (copy it):
  `generates the client type and constructor` (exact block above for `/v1` server → `"https://example.com/v1"`),
  `passes path parameters positionally and optional query parameters in a params struct`
  (`func (c *PetsClient) GetPet(ctx context.Context, id string, params *GetPetParams, opts ...RequestOption)
  (*api.Pet, error)` and `type GetPetParams struct {\n\tFields []string\n\tLimit  *int32\n}`), `passes required query,
  header and cookie parameters positionally` (spec with required header `X-Tenant` → `xTenant string` before `params`),
  `omits the params struct when there are no optional parameters`, `skips parameters the server cannot decode and lists
  them in the doc` (object-typed query param → doc line `The query parameter "filter" is not sent, because its schema is
  not supported. Set it with a RequestOption.`), `uses server variable defaults in the default base URL`,
  `uses the configured base URL` (`baseUrl: 'http://localhost:8080'`), `applies the path modifier`
  (`pathModifier: /\/pets.*$/` on `/v1/pets/{id}`), `declares an operation with several tags once`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.** Method bodies are filled in by Tasks 5 and 6; in this task each body is a single
  `return` of the zero values (e.g. `return nil, nil`), so the output compiles. Nothing outside this branch sees that
  intermediate state.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(go): generate the client types and method signatures`.

### Task 5: Request building (parameters and bodies)

**Files:** Modify `client-generator.ts`, `args.ts`; Test `clients-generator.test.ts`

**Interfaces:**
- Consumes: Task 2 runtime helper names; Task 4 `GoClientOperation`.
- Produces protected methods `getRequestStatements`, `getPathExpression`, `getParameterStatement`, `getBody`
  (choosing by the preference order), `getBodyStatement`, `getFormStruct`, `getFormFieldStatement`.
- Emitted shape (exact for the first lines; the rest follows):

```go
	r := c.c.newRequest("GET", "/pets/"+pathParam("id", "simple", false, false, []string{formatString(id)}))
	if params != nil {
		if params.Fields != nil {
			r.query("fields", "form", true, true, formatAll(params.Fields, formatString[string]))
		}
		if params.Limit != nil {
			r.query("limit", "form", true, false, []string{formatInt(*params.Limit)})
		}
	}
```

- Path parts that share a segment with text (`/files/{name}.json`) use `pathParam(name, "simple", false, array, …)` for
  the parameter and keep the literal text, escaped with the server's `escapePathSegment` rule.
- Bodies: JSON → `if err := r.jsonBody(body); err != nil { return …, err }`; optional body → wrapped in `if body !=
  nil`. Form → `url.Values` built field by field with the format functions (`formatJSON` for non-primitive fields, as
  the server's form decoding uses `parseJSON`), or passed through when the type is `url.Values`. Multipart → struct
  `{Op}Form` (`reserveFirst([`${name}Form`, `${name}FormBody`])`), file fields `*File` / `[]File`, others like form
  fields; written with `writeFormFile` / `writeFormField`. Text → `r.textBody("text/plain", body)`. Raw →
  `r.rawBody("<media type>", body)`.

- [ ] **Step 1: Write the failing tests**: `encodes path, query, header and cookie parameters` (assert the exact lines
  above plus a header and a cookie line), `encodes a path parameter that shares its segment` (`"/files/"+pathParam(
  "name", "simple", false, false, []string{formatString(name)})+".json"`), `encodes a label and a matrix path
  parameter`, `sends a required JSON body`, `skips an optional body that is nil`, `prefers JSON when several media types
  are declared`, `encodes a form body field by field`, `generates a form struct for a multipart body with file parts`
  (`type UploadPhotoForm struct` with `Photo *File`), `sends text and raw bodies with their media type`.
- [ ] **Step 2: Run** — Expected: FAIL. **Step 3: Implement.** **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(go): encode the parameters and bodies of client requests`.

### Task 6: Responses and errors

**Files:** Modify `client-generator.ts`, `args.ts`; Test `clients-generator.test.ts`

**Interfaces:**
- Produces protected methods `getSuccess`, `getErrorResponses`, `getResponseStatements`, `getErrorValueFunction`.
- Return type: success body type from declared 2xx (and `2XX`; `default` iff no 2xx). All equal → that type, pointer
  iff `ctx.input.go.models[schema.id]?.fields` is defined (the model is a struct); text → `string`; raw → `[]byte`;
  disagreeing → `any`; none → method returns only `error`.
- Emitted shape (exact):

```go
	resp, err := c.c.do(ctx, r, opts)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if !isSuccess(resp) {
		return nil, newResponseError(resp, func(status int, body []byte) any {
			switch {
			case status == 404:
				return decodeErrorJSON[api.Error](body)
			case status >= 400 && status < 500:
				return decodeErrorJSON[api.Problem](body)
			default:
				return decodeErrorJSON[api.Error](body)
			}
		})
	}
	return decodeJSON[*api.Pet](resp)
```

  (`newResponseError(resp, nil)` when no error response has a JSON schema; the `default` case only when declared and not
  the success response.) For `any`: `switch resp.StatusCode { case 200: return decodeJSON[*api.Pet](resp) … default:
  return nil, nil }`.

- [ ] **Step 1: Write the failing tests**: `returns the decoded success body` (exact block above, minus error cases),
  `returns only an error when no success response has a body` (`CreatePet(...) error`, ends `return nil`),
  `decodes the declared error bodies into ResponseError.Value`, `treats default as success when no 2xx is declared`,
  `returns any when success bodies disagree`, `returns a string for text and []byte for other media types`,
  `returns slices and enums by value and structs by pointer`.
- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(go): decode the responses of client calls`.

### Task 7: Snapshots and the compile gate

**Files:**
- Modify: `test/output-tests/profiles.ts` (profile `{ name: 'clients', language: 'go', versions: 'all', configure: (g)
  => g.useType(GoModelsGenerator, base).useType(GoClientsGenerator, base) }`), `test/output-tests/profiles.test.ts`
  (`'go/clients'` in the expected list), `test/compile-tests/compile.test.ts` (`GO_PROFILES = ['models', 'servers',
  'clients']`, and raise the unit-count comment/floor only if the file requires it)
- Create: `test/output/go/clients/**` (written by the snapshot run)

- [ ] **Step 1: Run** `GOAST_SNAPSHOT=write npx vitest run test/output-tests -t go` — Expected: new files under
  `test/output/go/clients`.
- [ ] **Step 2: Run** `GOAST_COMPILE=1 GOAST_SNAPSHOT=check npx vitest run test/compile-tests -t "go \\(go vet\\)"` —
  Expected: PASS for `models`, `servers`, `clients`. Fix generator issues (not snapshots) until it passes.
- [ ] **Step 3: Run** `GOAST_SNAPSHOT=check npx vitest run test/compile-tests/orphans.test.ts test/output-tests` —
  Expected: PASS.
- [ ] **Step 4: Commit** `test(go): snapshot and compile the generated clients`.

### Task 8: Tier-4 `go-clients` leg

**Files:**
- Create: `test/integration/go-clients/build.ts` (`PROFILE = 'go-clients'`, `TREE_PATH = 'go/clients/integration/
  kitchen-sink'`, `buildCommand()` copying the tree (contains `api/` and `client/`) and `driver/*.go` into `/app/cmd/
  driver`, writing `go.mod` for `example.com/generated`, `go build`, then running the driver), `driver/main.go`,
  `integration.test.ts`
- Modify: `test/integration/targets.ts` (`{ profile: 'go-clients', direction: 'client' }` after `go-servers`, and the
  doc comment's list), `package.json` (`test:integration:go-clients` scripts already added in Task 2 cover this
  directory)
- Create: `test/wire/go-clients/*` only if deviations are recorded by the run

**Interfaces:**
- Consumes: `casesFor('go-clients', 'client')`, `startRefServer`, `runContainer`, `diffRequest`, `diffResult`,
  `verifyWireDeviations`, `wireSnapshotFile` from `@goast/test-harness`; `CASE_LINE_PREFIX = '##GOAST-CASE##'` and
  `parseCaseLines` (move them from `test/integration/kotlin-clients/build.ts` into a shared module, e.g.
  `test/integration/case-lines.ts`, and import from both legs).
- Driver contract (same as `OkHttp3Driver.kt`): reads `GOAST_BASE_URL`, calls each case in `casesFor` table order with
  hardcoded arguments, prints `##GOAST-CASE##{"caseId":"…","result":…}` per case; a success prints the decoded body as
  JSON (`{"status": n}` for calls with no body), a `*ResponseError` prints `{"status": n}`, any other error prints
  `{"error": "<type>", "message": "…"}`. Auth cases set headers with `WithRequestEditor` at construction, as the fetch
  driver does with `headers`.

- [ ] **Step 1: Write `integration.test.ts`** modelled on `test/integration/kotlin-clients/integration.test.ts` (one
  unit; container env `GOAST_BASE_URL=http://host.docker.internal:<port>`; asserts every case reported exactly once;
  diffs and `verifyWireDeviations`).
- [ ] **Step 2: Write `driver/main.go`** covering every case id of `casesFor('go-clients','client')`.
- [ ] **Step 3: Run** `GOAST_INTEGRATION=1 GOAST_SNAPSHOT=write npx vitest run test/integration/go-clients` —
  Expected: PASS; inspect any written `test/wire/go-clients/*.txt`: each deviation must be either fixed in the generator
  (then re-run tasks' tests and snapshots) or genuinely a limitation listed in the spec's non-goals.
- [ ] **Step 4: Run** `GOAST_INTEGRATION=1 GOAST_SNAPSHOT=check npx vitest run test/integration/go-clients
  test/integration/kotlin-clients/build.test.ts test/integration-tests` — Expected: PASS.
- [ ] **Step 5: Commit** `test(go): drive the generated clients against the reference server`.

### Task 9: Docs and final checks

**Files:**
- Modify: `packages/go/README.md` (generator list + section "Calling an API": generate, `NewPetsClient("", 
  client.WithRequestEditor(...))`, a call, `errors.As` with `*client.ResponseError`, the `modulePath` note, limitations),
  JSDoc everywhere in `packages/go/src/generators/clients/` and Task 1's module (PR #90 style: descriptions,
  `@param` without types, `@returns`, `@default` matching `defaultGoClientsGeneratorConfig`, config type doc listing how
  each common option affects the clients)
- Modify (wiki repo `E:\MaSch0212\goast.wiki`, commit there, do not push): create `Go Clients Generator.md` (structure of
  `Go Servers Generator.md`: Purpose, Usage, Input, Configuration tables, Output, Calling an API, Error handling,
  Limitations), link it in `Go Generators.md`, `_Sidebar.md`, `Home.md`, `Generators.md`

- [ ] **Step 1: Write docs.**
- [ ] **Step 2: Run** `pnpm lint && pnpm fmt:check && pnpm typecheck && GOAST_SNAPSHOT=check npx vitest run` —
  Expected: all PASS; plus the compile gate (Task 7 Step 2) and both Go integration legs in check mode.
- [ ] **Step 3: Commit** `docs(go): document the clients generator` (goast) and `Add the Go clients generator` (wiki).
- [ ] **Step 4:** Update PR #91's description (generators list, tests) with `gh pr edit 91 --body-file …` after the
  branch is pushed — push only when the user asks.
