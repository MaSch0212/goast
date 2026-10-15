# gOAst (@goast/kotlin)

[![@goast/kotlin NPM Version](https://img.shields.io/npm/v/%40goast%2Fkotlin?logo=npm&label=%40goast%2Fkotlin)](https://www.npmjs.com/package/@goast/kotlin)

**gOAst** stands for **g**enerative **O**pen **A**PI **s**pecification **t**ransformer, a tool designed to transform
OpenAPI specifications into various forms with flexibility and extensibility at its core.

For more Information, please visit the [gOAst GitHub Repository](https://github.com/MaSch0212/goast/blob/main).

## Purpose 👍

The `@goast/kotlin` package provides generators for [Kotlin](https://kotlinlang.org/) code generation from OpenAPI
specifications.

## Usage Example 🚀

```typescript
import { OpenApiGenerator } from '@goast/core';
import { KotlinModelsGenerator, KotlinSpringControllersGenerator } from '@goast/kotlin';

async function main() {
  await new OpenApiGenerator({ outputDir: '.api' })
    .useType(KotlinModelsGenerator)
    .useType(KotlinSpringControllersGenerator)
    .parseAndGenerateFromDir('.openapi');
}

main();
```

## Available Generators 📚

- [`KotlinModelsGenerator`](https://github.com/MaSch0212/goast/wiki/Kotlin%20Models%20Generator): Generates Kotlin data
  classes from schemas in the OpenAPI specification(s).
- [`KotlinSpringControllersGenerator`](https://github.com/MaSch0212/goast/wiki/Kotlin%20Spring%20Controllers%20Generator):
  Generates [Spring](https://spring.io/) controllers for Kotlin from paths in the OpenAPI specification(s).
  - Depends on the output of the `KotlinModelsGenerator` generator.
- [`KotlinOkHttp3ClientsGenerator`](https://github.com/MaSch0212/goast/wiki/Kotlin%20OkHttp3%20Clients%20Generator):
  Generates [OkHttp3](https://square.github.io/okhttp/) clients for Kotlin from paths in the OpenAPI specification(s).
  - Depends on the output of the `KotlinModelsGenerator` generator.

## API Documentation 📖

The API documentation can be found [here](https://github.com/MaSch0212/goast/wiki/Kotlin%20Generators).
