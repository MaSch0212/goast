# gOAst (@goast/core)

[![@goast/core NPM Version](https://img.shields.io/npm/v/%40goast%2Fcore?logo=npm&label=%40goast%2Fcore)](https://www.npmjs.com/package/@goast/core)

**gOAst** stands for **g**enerative **O**pen **A**PI **s**pecification **t**ransformer, a tool designed to transform
OpenAPI specifications into various forms with flexibility and extensibility at its core.

For more Information, please visit the [gOAst GitHub Repository](https://github.com/MaSch0212/goast/blob/main).

## Purpose 👍

The `@goast/core` package provides:

- entry points for using the **gOAst** library
- base classes for creating custom generators
- utilities for parsing and transforming OpenAPI specifications

## Usage Example 🚀

```typescript
import { OpenApiGenerator } from '@goast/core';

class MyGenerator implements OpenApiGenerationProvider {
  generate(
    context: OpenApiGeneratorContext<OpenApiGeneratorInput>,
    config?: Partial<Readonly<Record<string, unknown>>>,
  ): Record<string, unknown> {
    // Do something
    return {};
  }
}

async function main() {
  const generator = new OpenApiGenerator()
    // Add a generator using a class
    .useType(MyGenerator)
    // Add a generator using a function
    .useFn((ctx, cfg) => {
      // Do the generation
      return {}; // Return information about the generated files so it can be used by other generators
    })
    // Add a generator using an object implementing `OpenApiGenerationProvider`
    .useValue({ generate: (ctx, cfg) => ({}) });

  // Generate for one of more OpenAPI specification files
  await generator.parseAndGenerate('path/to/openapi.json', 'path/to/another/openapi.yaml');

  // Alternatively, you can generate output for all specifications in a directory.
  // By default, it will only consider files within the directory (non-recursively) with the extensions: .json, .yaml, .yml.
  await generator.parseAndGenerateFromDir('path/to/openapi/specs');
}

main();
```

## Available Generator Packages 📚

[![@goast/typescript NPM Version](https://img.shields.io/npm/v/%40goast%2Ftypescript?logo=npm&label=%40goast%2Ftypescript)](https://www.npmjs.com/package/@goast/typescript)
[![@goast/kotlin NPM Version](https://img.shields.io/npm/v/%40goast%2Fkotlin?logo=npm&label=%40goast%2Fkotlin)](https://www.npmjs.com/package/@goast/kotlin)

## API Documentation 📖

The API documentation can be found [here](https://github.com/MaSch0212/goast/wiki).
