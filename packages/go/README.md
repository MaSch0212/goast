# gOAst (@goast/go)

**gOAst** stands for **g**enerative **O**pen **A**PI **s**pecification **t**ransformer, a tool designed to transform
OpenAPI specifications into various forms with flexibility and extensibility at its core.

For more Information, please visit the [gOAst GitHub Repository](https://github.com/MaSch0212/goast/blob/main).

## Purpose 👍

The `@goast/go` package provides generators for [Go](https://go.dev/) code generation from OpenAPI specifications.
The generated code is formatted like `gofmt` formats it, passes `go vet` and depends on the standard library only.

## Usage Example 🚀

```typescript
import { OpenApiGenerator } from '@goast/core';
import { GoClientsGenerator, GoModelsGenerator, GoServersGenerator } from '@goast/go';

async function main() {
  await new OpenApiGenerator({ outputDir: 'internal' })
    .useType(GoModelsGenerator, { modulePath: 'example.com/petstore/internal' })
    .useType(GoServersGenerator, { modulePath: 'example.com/petstore/internal' })
    .useType(GoClientsGenerator, { modulePath: 'example.com/petstore/internal' })
    .parseAndGenerateFromDir('.openapi');
}

main();
```

`modulePath` is the import path of the output directory, so packages generated into different directories can import
each other. The servers write into the package `api` and the clients into the package `client` (both set by
`packagePath`).

## Available Generators 📚

- `GoModelsGenerator`: Generates Go types from the schemas: structs with `json` tags, string, integer, number and
  boolean enums with constants and an `IsValid` method, and maps and slices. Additional properties are kept in an
  `AdditionalProperties` map that is marshaled along with the other fields.
- `GoServersGenerator`: Generates servers based on `net/http` (Go 1.22 or later). For every tag it generates
  - an interface with one method per operation, taking a typed request and returning a typed response,
  - a function registering the operations on an `*http.ServeMux`.

  Requests are decoded from path, query, header and cookie parameters (with their `style` and `explode`) and from
  JSON, form, multipart, text and binary bodies. Every declared status has its own response type.
  - Depends on the output of the `GoModelsGenerator` generator.

- `GoClientsGenerator`: Generates clients based on `net/http`. For every tag it generates
  - a client type with one method per operation, taking typed parameters and returning the typed response body,
  - a constructor for the client, which takes options for the HTTP client and for request editors.

  Parameters and bodies are encoded the way `GoServersGenerator` decodes them, so a client and a server generated from
  the same specification talk to each other. A response that is not a success is returned as a `*client.ResponseError`.
  - Depends on the output of the `GoModelsGenerator` generator.

### Implementing a server

```go
type petsService struct{}

func (petsService) GetPet(ctx context.Context, req api.GetPetRequest) (api.GetPetResponse, error) {
	pet, ok := findPet(req.ID)
	if !ok {
		return api.GetPet404Response{}, nil
	}
	return api.GetPet200Response{Body: pet}, nil
}

func main() {
	mux := http.NewServeMux()
	api.RegisterPetsRoutes(mux, petsService{}, api.WithBasePath("/v1"))
	log.Fatal(http.ListenAndServe(":8080", mux))
}
```

A request that cannot be decoded is answered with a `*api.RequestError` (400, or 415 for an unsupported content type)
and an error returned by the service with 500. `api.WithErrorHandler` replaces how errors are written,
`api.WithMiddleware` wraps every handler.

### Calling an API

The clients are in the package `client`, with one client type per tag. Create a client with its constructor. The first
argument is the base URL; an empty string uses the URL of the first server of the specification, which is the constant
`PetsClientDefaultBaseURL` for the `Pets` tag. The options set the HTTP client, or add request editors that run before
every request, such as one that sets an authorization header:

```go
petsClient := client.NewPetsClient("https://petstore.example.com/v1", client.WithRequestEditor(
	func(ctx context.Context, req *http.Request) error {
		req.Header.Set("Authorization", "Bearer "+token)
		return nil
	},
))

pet, err := petsClient.GetPet(ctx, "42")
if err != nil {
	return err
}
fmt.Println(pet.Name)
```

The clients import the models from the package `api`, so `modulePath` has to be the import path of the output directory,
as in the usage example above.

Each method takes its arguments in this order:

1. the `context.Context`,
2. the path parameters, in the order they appear in the path,
3. the required query, header and cookie parameters, in the order of the specification,
4. the request body, if the operation has one; it is a pointer if the body is optional, and `nil` sends no body,
5. `params *XParams`, if the operation has optional query, header or cookie parameters. Its fields are pointers, a `nil`
   field is not sent, and `nil` params sends none of them,
6. `opts ...RequestOption`, which change a single call, such as `client.WithRequestHeader("X-Request-ID", id)`.

For example, `UpdatePet` takes the path parameter `id` and the body, and `StyleMatrix` only takes params:

```go
paramsClient := client.NewParamsClient("")
err := paramsClient.StyleMatrix(ctx, &client.StyleMatrixParams{FormExploded: []string{"red", "green"}})
```

A method returns the decoded body of the success response and an error. An operation without a response body returns
only the error. If the success responses of an operation declare different body types, the body is an `any` that holds
the decoded body of the status that arrived.

Any response whose status is not 2xx is returned as a `*client.ResponseError`. It has the `StatusCode`, the `Header`
and the raw `Body`. `Value` holds the decoded body if the specification declares a schema for the status, otherwise
`nil`. Transport, encoding and decoding errors are returned wrapped, not as a `*client.ResponseError`:

```go
_, err := widgetsClient.GetWidget(ctx, "42")
var re *client.ResponseError
if errors.As(err, &re) && re.StatusCode == http.StatusNotFound {
	if apiErr, ok := re.Value.(*api.Error); ok {
		fmt.Println(apiErr.Message)
	}
}
```

The clients have these limitations:

- A parameter whose schema is not supported, such as an object, is not sent. The doc comment of its method lists it, and
  `client.WithEditor` can set it on a single call.
- Any 2xx status is a success, whether the specification declares it or not.
- A response is read completely into memory; streaming response bodies are not supported.

### Limitations

- Polymorphic schemas (`oneOf`, `anyOf` and discriminators) become `any` or the struct of their base, there is no
  decoding into the matching variant.
- Query parameters with an object schema are not decoded; the request documents them and they can be read from
  `HTTPRequest`.
- Property names that a `json` struct tag cannot express (e.g. the empty name, or names with a comma) are not
  mapped.
- Routes that `http.ServeMux` considers conflicting make it panic when they are registered.
