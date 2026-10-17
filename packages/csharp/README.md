# gOAst (@goast/csharp)

[![@goast/csharp NPM Version](https://img.shields.io/npm/v/%40goast%2Fcsharp?logo=npm&label=%40goast%2Fcsharp)](https://www.npmjs.com/package/@goast/csharp)

**gOAst** stands for **g**enerative **O**pen **A**PI **s**pecification **t**ransformer, a tool designed to transform
OpenAPI specifications into various forms with flexibility and extensibility at its core.

For more Information, please visit the [gOAst GitHub Repository](https://github.com/MaSch0212/goast/blob/main).

## Purpose 👍

The `@goast/csharp` package provides generators for [C#](https://learn.microsoft.com/dotnet/csharp/) code generation
from OpenAPI specifications. It also exposes the C# AST (`cs`) the generators are built on, so custom generators can
reuse it.

The generated code targets **.NET 10** with C# and `<Nullable>enable</Nullable>`. Models are serialized with
**System.Text.Json**. The FastEndpoints generator requires **FastEndpoints 8.3.0**.

## Installation 📦

```bash
npm install @goast/core @goast/csharp
```

## Usage Example 🚀

```typescript
import { OpenApiGenerator } from '@goast/core';
import { CSharpControllersGenerator, CSharpHttpClientsGenerator, CSharpModelsGenerator } from '@goast/csharp';

async function main() {
  await new OpenApiGenerator({ outputDir: '.api' })
    .useType(CSharpModelsGenerator)
    .useType(CSharpControllersGenerator)
    .useType(CSharpHttpClientsGenerator)
    .parseAndGenerateFromDir('.openapi');
}

main();
```

## Available Generators 📚

- [`CSharpModelsGenerator`](#csharpmodelsgenerator): Generates C# records from schemas in the OpenAPI specification(s).
- [`CSharpControllersGenerator`](#csharpcontrollersgenerator): Generates abstract ASP.NET Core controllers, one per
  service (tag), with strict result types for every endpoint.
  - Depends on the output of the `CSharpModelsGenerator` generator.
- [`CSharpMinimalApisGenerator`](#csharpminimalapisgenerator): Generates abstract minimal API classes and a
  `Map<Tag>Api` extension method per service.
  - Depends on the output of the `CSharpModelsGenerator` generator.
- [`CSharpFastEndpointsGenerator`](#csharpfastendpointsgenerator): Generates abstract
  [FastEndpoints](https://fast-endpoints.com/) endpoint classes, with request DTOs and binding attributes, per
  operation.
  - Depends on the output of the `CSharpModelsGenerator` generator.
- [`CSharpHttpClientsGenerator`](#csharphttpclientsgenerator): Generates typed `HttpClient` clients per service, with
  one method per operation and a registration helper.
  - Depends on the output of the `CSharpModelsGenerator` generator.

Every generator also accepts the shared options described in [Shared Options](#shared-options). Options are passed as
the second argument of `useType`, for example `.useType(CSharpModelsGenerator, { rootNamespace: 'Acme.Pets' })`.

## Shared Options

These options are available to every generator (they come from `CSharpGeneratorConfig`).

| Option                | Default               | Description                                                                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `rootNamespace`       | `'OpenApi.Generated'` | The root namespace of all generated code. Every generator appends its own `namespaceSuffix` to it.                        |
| `typeNameCasing`      | `'pascal'`            | The casing of generated type names.                                                                                       |
| `propertyNameCasing`  | `'pascal'`            | The casing of generated property names.                                                                                   |
| `parameterNameCasing` | `'camel'`             | The casing of generated parameter names.                                                                                  |
| `methodNameCasing`    | `'pascal'`            | The casing of generated method names.                                                                                     |
| `enumValueNameCasing` | `'pascal'`            | The casing of generated enum member names.                                                                                |
| `globalUsings`        | `[]`                  | Namespaces already imported project-wide (for example through `<Using Include="..." />`). No `using` is emitted for them. |
| `includeSourceInDocs` | `false`               | Whether to include the source OpenAPI document path in the generated documentation comments.                              |

Indentation is four spaces by default (`indent` from the core configuration).

### CSharpModelsGenerator

Generates records for every schema of the specification. Output: `<rootNamespace>.Models` in the `Models` directory.

| Option                    | Default                  | Description                                                                                                                                                                                                       |
| ------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namespaceSuffix`         | `'.Models'`              | The suffix appended to `rootNamespace`. Accepts a function of the schema.                                                                                                                                         |
| `modelsDir`               | `'Models'`               | The directory (relative to `outputDir`) the model files are written to.                                                                                                                                           |
| `immutableTypes`          | `true`                   | Properties are `{ get; init; }`, collections are `IReadOnlyList<T>` and `IReadOnlyDictionary<string, T>`. When `false`, properties are `{ get; set; }` and collections are `List<T>` and `Dictionary<string, T>`. |
| `oneOfBehavior`           | `'treat-as-any-of'`      | `'treat-as-any-of'` or `'treat-as-all-of'`: how `oneOf` schemas are treated.                                                                                                                                      |
| `emptyObjectTypeBehavior` | `'generate-empty-class'` | `'use-any'` (use `JsonElement`) or `'generate-empty-class'` for `object` schemas without properties.                                                                                                              |
| `addDataAnnotations`      | `true`                   | Whether to add `System.ComponentModel.DataAnnotations` attributes (`[StringLength]`, `[Range]`, ...).                                                                                                             |

Example output (`Models/Pet.cs`, shortened):

```csharp
namespace OpenApi.Generated.Models;

public sealed record Pet
{
    [JsonPropertyName("id")]
    public required string Id { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("nickname")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Nickname { get; init; }

    [JsonPropertyName("status")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public PetStatus? Status { get; init; }

    [JsonPropertyName("toys")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<Toy>? Toys { get; init; }
}
```

### CSharpControllersGenerator

Generates one abstract `<Service>ControllerBase` per service, with an ASP.NET Core action for every operation. Output:
`<rootNamespace>.Controllers` in the `Controllers` directory.

| Option            | Default              | Description                                                                                                                                        |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namespaceSuffix` | `'.Controllers'`     | The suffix appended to `rootNamespace`. Accepts a function of the service (or `null`).                                                             |
| `controllersDir`  | `'Controllers'`      | The directory (relative to `outputDir`) the controller files are written to.                                                                       |
| `mode`            | `'strict'`           | How responses are treated. In `strict` mode a handler returns the generated result type of its endpoint and can only produce documented responses. |
| `basePath`        | first server of spec | The base path every route of a service is placed under. A string replaces it, a `RegExp` extracts the first match, a function computes it.         |
| `pathModifier`    | none                 | A `RegExp` or a function `(path, endpoint) => string` that modifies the path of an endpoint before it becomes a route.                             |

Example: the result type and an implementation of the handler.

```csharp
// Generated: Controllers/GetPetResult.cs
public abstract record GetPetResult
{
    public static GetPetResult Ok(Pet body) => new OkResponse(body);

    public sealed record OkResponse(Pet Body) : GetPetResult;
}

// Generated: Controllers/PetsControllerBase.cs (excerpt)
[HttpGet("pets/{id}")]
[ProducesResponseType(typeof(Pet), 200, "application/json")]
public async Task<IActionResult> GetPet([FromRoute(Name = "id")] string id, CancellationToken cancellationToken) { ... }

protected abstract Task<GetPetResult> GetPetAsync(string id, CancellationToken cancellationToken);

// Your code: derive from the generated base and implement the handler.
public sealed class PetsController : PetsControllerBase
{
    protected override Task<GetPetResult> GetPetAsync(string id, CancellationToken cancellationToken) =>
        Task.FromResult(GetPetResult.Ok(new Pet { Id = id, Name = "Rex" }));
}
```

### CSharpMinimalApisGenerator

Generates an abstract `<Service>Api` class that declares the handler methods, a static `Map<Service>Api` extension
method that registers the routes, and the result types. Output: `<rootNamespace>.MinimalApis` in the `MinimalApis`
directory.

| Option            | Default              | Description                                                                                                     |
| ----------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `namespaceSuffix` | `'.MinimalApis'`     | The suffix appended to `rootNamespace`. Accepts a function of the service (or `null`).                          |
| `minimalApisDir`  | `'MinimalApis'`      | The directory (relative to `outputDir`) the minimal API files are written to.                                   |
| `mode`            | `'strict'`           | How responses are treated. Only `strict` exists today.                                                          |
| `basePath`        | first server of spec | The base path every route of a service is placed under. Same semantics as for `CSharpControllersGenerator`.     |
| `pathModifier`    | none                 | Modifies the path of an endpoint before it becomes a route. Same semantics as for `CSharpControllersGenerator`. |

### CSharpFastEndpointsGenerator

Generates one abstract FastEndpoints endpoint class per operation, with a generated request DTO that carries the
FastEndpoints binding attributes (`[RouteParam]`, `[QueryParam]`, `[FromHeader]`, `[HttpGet]`, ...), and the result
types. Requires FastEndpoints 8.3.0. Output: `<rootNamespace>.FastEndpoints` in the `FastEndpoints` directory.

| Option             | Default              | Description                                                                                                     |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `namespaceSuffix`  | `'.FastEndpoints'`   | The suffix appended to `rootNamespace`. Accepts a function of the service (or `null`).                          |
| `fastEndpointsDir` | `'FastEndpoints'`    | The directory (relative to `outputDir`) the endpoint files are written to.                                      |
| `mode`             | `'strict'`           | How responses are treated. Only `strict` exists today.                                                          |
| `basePath`         | first server of spec | The base path every route of a service is placed under. Same semantics as for `CSharpControllersGenerator`.     |
| `pathModifier`     | none                 | Modifies the path of an endpoint before it becomes a route. Same semantics as for `CSharpControllersGenerator`. |

### CSharpHttpClientsGenerator

Generates a typed client per service: an `I<Service>Client` interface, a `<Service>Client` class over `HttpClient`, one
method per operation, and an `Add<Service>Client` registration helper. Output: `<rootNamespace>.Clients` in the `Clients`
directory.

Only the `strict` mode exists: the first success (2xx) response defines the return type, every other status throws an
`ApiException`, and documented error responses throw a typed subclass.

| Option            | Default                           | Description                                                                                                                                               |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `namespaceSuffix` | `'.Clients'`                      | The suffix appended to `rootNamespace`.                                                                                                                   |
| `clientsDir`      | `'Clients'`                       | The directory (relative to `outputDir`) the client files are written to.                                                                                  |
| `mode`            | `'strict'`                        | How errors are surfaced. Only `strict` exists today.                                                                                                      |
| `basePath`        | first server of spec, if absolute | The default `HttpClient.BaseAddress` the generated `Add<Service>Client` applies before the `configure` callback runs. A string, a `RegExp` or a function. |
| `pathModifier`    | none                              | A `RegExp` or a function `(path, endpoint) => string` that modifies the path of an endpoint before it is sent.                                            |

## API Documentation 📖

The API documentation can be found [here](https://github.com/MaSch0212/goast/wiki).
