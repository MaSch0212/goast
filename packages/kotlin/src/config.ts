import type {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

/** The Spring Boot major version the Kotlin generators target. */
export type SpringBootVersion = 3 | 4;

export type KotlinGeneratorConfig = OpenApiGeneratorConfig & {
  typeNameCasing: StringCasing | StringCasingWithOptions;
  parameterNameCasing: StringCasing | StringCasingWithOptions;
  functionNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  constantNameCasing: StringCasing | StringCasingWithOptions;

  globalImports: string[];

  /**
   * Whether to include the source OpenAPI document path in the generated documentation comments.
   * @default false
   */
  includeSourceInDocs: boolean;

  /**
   * The targeted Spring Boot major version. Controls Jackson package names, Kotlin generic bounds, and
   * `ResponseEntity` nullability so the generated code compiles against the matching framework generation.
   * - `3`: Spring Boot 3 (Spring Framework 6 / Jackson 2). Produces output identical to previous versions.
   * - `4`: Spring Boot 4 (Spring Framework 7 / Jackson 3 / JSpecify null-safety).
   * @default 3
   */
  springBootVersion: SpringBootVersion;
};

export const defaultKotlinGeneratorConfig: DefaultGenerationProviderConfig<KotlinGeneratorConfig> = {
  indent: { type: 'spaces', count: 4 },

  typeNameCasing: 'pascal',
  parameterNameCasing: 'camel',
  functionNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'snake',
  constantNameCasing: 'snake',

  globalImports: [
    'kotlin.*',
    'kotlin.annotation.*',
    'kotlin.collections.*',
    'kotlin.comparisons.*',
    'kotlin.io.*',
    'kotlin.ranges.*',
    'kotlin.sequences.*',
    'kotlin.text.*',
    'java.lang.*',
    'kotlin.jvm.*',
  ],
  includeSourceInDocs: false,
  springBootVersion: 3,
};
