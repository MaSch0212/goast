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
import { GoModelsGenerator, GoServersGenerator } from '@goast/go';

async function main() {
  await new OpenApiGenerator({ outputDir: 'internal' })
    .useType(GoModelsGenerator, { modulePath: 'example.com/petstore/internal' })
    .useType(GoServersGenerator, { modulePath: 'example.com/petstore/internal' })
    .parseAndGenerateFromDir('.openapi');
}

main();
```

`modulePath` is the import path of the output directory, so packages generated into different directories can import
each other. Both generators write into the package `api` (`packagePath`) by default.

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

### Limitations

- Polymorphic schemas (`oneOf`, `anyOf` and discriminators) become `any` or the struct of their base, there is no
  decoding into the matching variant.
- Query parameters with an object schema are not decoded; the request documents them and they can be read from
  `HTTPRequest`.
- Property names that a `json` struct tag cannot express (e.g. the empty name, or names with a comma) are not
  mapped.
- Routes that `http.ServeMux` considers conflicting make it panic when they are registered.
