# gOAst (@goast/typescript)

[![@goast/typescript NPM Version](https://img.shields.io/npm/v/%40goast%2Ftypescript?logo=npm&label=%40goast%2Ftypescript)](https://www.npmjs.com/package/@goast/typescript)

**gOAst** stands for **g**enerative **O**pen **A**PI **s**pecification **t**ransformer, a tool designed to transform
OpenAPI specifications into various forms with flexibility and extensibility at its core.

For more Information, please visit the [gOAst GitHub Repository](https://github.com/MaSch0212/goast/blob/main).

## Purpose 👍

The `@goast/typescript` package provides generators for [TypeScript](https://www.typescriptlang.org/) code generation
from OpenAPI specifications.

## Usage Example 🚀

```typescript
import { OpenApiGenerator } from '@goast/core';
import { TypeScriptFetchClientsGenerator, TypeScriptModelsGenerator } from '@goast/typescript';

async function main() {
  await new OpenApiGenerator({ outputDir: '.api' })
    .useType(TypeScriptModelsGenerator)
    .useType(TypeScriptFetchClientsGenerator)
    .parseAndGenerateFromDir('.openapi');
}

main();
```

## Available Generators 📚

- [`TypeScriptModelsGenerator`](https://github.com/MaSch0212/goast/wiki/TypeScript%20Models%20Generator): Generates
  TypeScript interfaces or types from schemas in the OpenAPI specification(s).
- [`TypeScriptFetchClientsGenerator`](https://github.com/MaSch0212/goast/wiki/TypeScript%20Fetch%20Clients%20Generator):
  Generates Fetch clients for TypeScript from paths in the OpenAPI specification(s).
  - Depends on the output of the `TypeScriptModelsGenerator` generator.
- [`TypeScriptAngularServicesGenerator`](https://github.com/MaSch0212/goast/wiki/TypeScript%20Angular%20Services%20Generator):
  Generates [Angular](https://angular.dev/) services from paths in the OpenAPI specification(s).
  - Depends on the output of the `TypeScriptModelsGenerator` generator.
- [`TypeScriptEasyNetworkStubsGenerator`](https://github.com/MaSch0212/goast/wiki/TypeScript%20Easy%20Network%20Stubs%20Generator):
  Generates [easy-network-stub](https://github.com/LoaderB0T/easy-network-stub) classes from paths in the OpenAPI
  specification(s).
  - Depends on the output of the `TypeScriptModelsGenerator` generator.
- [`TypeScriptK6ClientsGenerator`](https://github.com/MaSch0212/goast/wiki/TypeScript%20K6%20Clients%20Generator):
  Generates [k6](https://k6.io/) clients from paths in the OpenAPI specification(s).
  - Depends on the output of the `TypeScriptModelsGenerator` generator.

## API Documentation 📖

The API documentation can be found [here](https://github.com/MaSch0212/goast/wiki/TypeScript%20Generators).
