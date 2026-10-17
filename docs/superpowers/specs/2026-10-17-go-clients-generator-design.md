# Go clients generator — design

Status: approved, 2026-10-17. Lands on PR #91 (`feat/go-generators`), next to `GoModelsGenerator` and `GoServersGenerator`.

## Intent

`@goast/go` can generate models and servers, but no way to *call* an API. Every other language package in gOAst has a
client generator (`@goast/typescript` fetch clients, `@goast/kotlin` OkHttp3 and Spring reactive clients), so the Go
package should too. The use case to design for is a Go program — a CLI tool is the reference picture — that calls an
API described by OpenAPI: create a client once, call one method per operation, get typed results back, and handle
errors the way ordinary Go code does (`if err != nil { return err }`, `errors.As` when it cares about the status).

## Goals

- A `GoClientsGenerator` in `@goast/go` that writes one client per tag plus a shared runtime file.
- Idiomatic Go: methods return `(T, error)` or `error`; non-success statuses come back as a typed error.
- Standard library only (`net/http`, `encoding/json`, `mime/multipart`, `net/url`, …), like the servers.
- Wire-compatible with `GoServersGenerator`: whatever the server decodes (path/query/header/cookie parameters with
  their styles; JSON, form, multipart, text and raw bodies), the client encodes the same way.
- Same quality bar and conventions as the rest of the package: provider + `Default…Generator` pattern with protected
  extension points, the shared per-package identifier registry, JSDoc in the PR #90 style, all four test tiers, README
  section and wiki page.

## Non-goals

- Typed per-status response types on the client (the server's `GetPet404Response` style). Decided against: the success
  body is returned directly, everything else is an error.
- Retries, timeouts, auth schemes, rate limiting as generated features. Callers get them through a custom `*http.Client`
  and request editors.
- Streaming response bodies, polymorphic (`oneOf`/discriminator) decoding — same limitations as the models/servers.

## Anti-goals

- Generated code that is not what a Go developer would write by hand (no `interface{}`-heavy APIs, no panics, no
  global state).
- A client whose encoding differs from the generated server's decoding — the two must talk to each other.
- Any third-party Go dependency.

## Generated API (decided)

For a tag `Pets` with the default config, `{outputDir}/client/pets_client.go`:

```go
// PetsClient calls the operations of the Pets API.
type PetsClient struct{ c *client }

// NewPetsClient creates a client for the Pets API. baseURL is prepended to the path of every operation; when it is
// empty, the URL of the first server of the API description is used.
func NewPetsClient(baseURL string, opts ...ClientOption) *PetsClient

// GetPet returns a pet.
func (c *PetsClient) GetPet(ctx context.Context, id string, params *GetPetParams, opts ...RequestOption) (*api.Pet, error)

// ListPets lists pets. tenant is a required header; limit is in params.
func (c *PetsClient) ListPets(ctx context.Context, tenant string, params *ListPetsParams, opts ...RequestOption) ([]api.Pet, error)

// CreatePet creates a pet.
func (c *PetsClient) CreatePet(ctx context.Context, body api.Pet, opts ...RequestOption) error
```

Method shape:
- `ctx context.Context` first.
- Then every **path** parameter, positionally, in the order they appear in the path, with its Go type.
- Then every **required query, header and cookie** parameter, positionally, in declaration order *(my call — keeps
  `params` free of required fields, so `nil` params is always valid)*.
- Then the **body**, if the operation has one: the body type (see below); a pointer when the body is optional (`nil`
  sends no body).
- Then `params *{Operation}Params` if the operation has any **optional query, header or cookie** parameters. A struct
  with one field per optional parameter, each a pointer (or a nil-able slice), omitted when nil; `nil` params means
  "none set". Defaults from the spec are *not* filled in client-side (the server applies them).
- **Supported parameters mirror the server** *(my call)*: exactly the parameters `DefaultGoServerGenerator` decodes
  (primitives, enums, arrays of those; query styles `form`/`spaceDelimited`/`pipeDelimited`; the path styles the
  server matches) are generated. Parameters the server skips (object schemas, `deepObject`, …) are skipped here too and
  listed in the method's doc comment; callers can still set them with a `RequestOption` editor.
- Last `opts ...RequestOption` (per-call request editors).
- Returns `(T, error)` where `T` is the success body type, or just `error` when no success response has a body.

Success status *(my call)*: **any 2xx status that arrives is a success**, declared or not. A `default` response counts
as a success response when the operation declares no 2xx response (many specs use `default` that way), and otherwise as
the error body for undeclared non-2xx statuses. Everything that is not 2xx is a `ResponseError`.

Success body type: taken from the declared 2xx responses (`2XX` included; `default` when it is the success response). If every 2xx response with content uses the same Go type, that type is
returned (as a pointer for structs, plain for slices/maps/strings/`[]byte`). If they disagree, the method returns
`any`, holding the decoded value of whichever status arrived (caller type-switches). A 2xx without content on an
operation that has a body type returns the zero value and a nil error.

Response body decoding by media type: JSON → the model type; `text/*` → `string`; anything else → `[]byte`.

Request body encoding by media type — when an operation declares several request media types, the first one in this
preference order is used: JSON, `application/x-www-form-urlencoded`, `multipart/form-data`, `text/*`, other.
- JSON: the model type, encoded with `encoding/json`.
- Form: the model type, encoded as `url.Values` with the same field rules the server's form decoding uses.
- Multipart: a generated `{Operation}Form` struct, one field per part; binary parts are a runtime `File` type
  (`Name`, `ContentType`, `Content io.Reader`).
- Text: `string`. Other: `io.Reader`, sent with the declared media type.

## Errors (decided)

`client_runtime.go` declares:

```go
// ResponseError is returned for a response whose status is not a success status of the operation.
type ResponseError struct {
	StatusCode int
	Header     http.Header
	Body       []byte // the raw body
	Value      any    // the decoded JSON body if a schema is declared for this status, its range (4XX) or default; else nil
}
```

Used as `var re *client.ResponseError; if errors.As(err, &re) && re.StatusCode == 404 { … }`. Transport errors,
encoding errors and decoding errors of a success body are returned wrapped (`fmt.Errorf("…: %w", err)`), not as
`ResponseError`. `Value` holds the pointer to the decoded model (e.g. `*api.Error`).

## Runtime and options (decided)

`client_runtime.go` is an asset like `server_runtime.go` (copied, with identifiers reserved through the package registry
so a schema called e.g. `ClientOption` doesn't collide). It contains:
- `ClientOption`: `WithHTTPClient(*http.Client)` (default `http.DefaultClient`), `WithRequestEditor(func(ctx, *http.Request) error)`
  (applied to every request — auth headers, user agent, tracing).
- `RequestOption`: `WithRequestHeader(name, value)`, `WithEditor(func(ctx, *http.Request) error)` for a single call.
- `ResponseError`, `File`, and the unexported helpers for building URLs (path escaping, query styles `form`/
  `spaceDelimited`/`pipeDelimited`, `explode`), encoding bodies, sending, and decoding.

## Configuration (decided)

`GoClientsGeneratorConfig = GoGeneratorConfig & { packagePath: string; packageName?: string; baseUrl?: …; pathModifier?: … }`
- `packagePath`, default `'client'` — a separate package from the models and servers (`'api'`), so the client's names
  and runtime never meet the server's. Setting it to `'api'` must still work (names deduplicated through the registry).
  When the client is in another package than the models it imports them via `modulePath`, which users then have to set
  to their module's import path (documented, as for the servers).
- `packageName`, default derived from `packagePath`.
- `baseUrl?: string | RegExp | ((baseUrl: string, service: ApiService) => string)` *(my call — named differently from
  the servers' `basePath` because it keeps scheme and host)*: the default base URL emitted as the generated constant
  `DefaultBaseURL` that `NewXClient("")` uses. Default: the first server URL of the API description with server
  variables replaced by their `default` values; `''` when there is none. A string replaces it, a RegExp keeps its first
  match, a function computes it. A relative result (e.g. `/v1`) is kept as is. If the URL a call ends up with has no
  scheme and host, the call returns an error ("no base URL: pass one to NewXClient") instead of sending.
- `pathModifier` *(my call)*: same type and semantics as the servers' option, so a client and server generated with the
  same setting agree on the URLs.

Depends on `GoModelsGenerator` (reads `go.models`), like the servers. Output published as `go.clients[serviceId]` with
references to the client type and its constructor.

## Testing (decided)

- Tier 1: unit tests for the generator (`clients-generator.test.ts`), covering method signatures, params structs,
  body kinds, the `any` return, name clashes, `baseUrl`, `pathModifier`.
- Tier 2: snapshots under `test/output/go/clients/…` for the same spec set the servers use.
- Tier 3: the existing Go compile gate (`go vet`) picks up the new snapshots.
- Tier 4: a `go-clients` leg (`direction: 'client'`) in `WIRE_TARGETS`: a hand-written Go driver (like
  `test/integration/go-servers/driver/main.go` and the Kotlin client drivers) calls the generated kitchen-sink client
  per case against the reference server; requests and results compared with `diffRequest`/`diffResult`; deviations
  committed under `test/wire/go-clients/`.

## Docs

JSDoc on everything public/protected (PR #90 style), README section "Calling an API", wiki page
"Go Clients Generator" plus links in `Go Generators`, `_Sidebar`, `Home`, `Generators`.

## Left to the builder

- Internal structure of the generator (mirror `GoServersGenerator`/`DefaultGoServerGenerator`; reuse operation analysis
  where it can be shared rather than duplicated — e.g. parameter/body classification).
- Exact helper names and layout inside `client_runtime.go`.
- How the driver maps the case table to client calls (follow the Kotlin client drivers).
