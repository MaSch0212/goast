import type {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

/** The Spring Boot major version the Kotlin generators target. */
export type SpringBootVersion = 3 | 4;

/**
 * The configuration that all Kotlin generators share. It extends the core `OpenApiGeneratorConfig` with the casing
 * rules for generated names, the imports that are left out of generated files, and the targeted Spring Boot version.
 * @see defaultKotlinGeneratorConfig
 */
export type KotlinGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The casing applied to type names, such as model classes, enums and the types of generated services. It also
   * determines the file names of models, since each model file is named after its type.
   * @default 'pascal'
   * @see StringCasingWithOptions
   */
  typeNameCasing: StringCasing | StringCasingWithOptions;
  /**
   * The casing applied to parameter names. Service generators use it for the parameters of endpoint functions, and the
   * models generator uses it for the parameters of the generated `set` function for `additionalProperties`.
   * @default 'camel'
   */
  parameterNameCasing: StringCasing | StringCasingWithOptions;
  /**
   * The casing applied to function names. Service generators use it for the endpoint functions, and the models
   * generator uses it for the generated `set` and `getMap` functions for `additionalProperties`.
   * @default 'camel'
   */
  functionNameCasing: StringCasing | StringCasingWithOptions;
  /**
   * The casing applied to property names. The models generator uses it for the properties of models, the `value`
   * property of enums and the `additionalProperties` property.
   * @default 'camel'
   */
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  /**
   * The casing applied to the names of enum constants. With the default casing, the value `available` becomes
   * `AVAILABLE`, because `snake` writes words in upper case unless `wordCasing` is given.
   * @default 'snake'
   * @example
   * ```ts
   * enumValueNameCasing: 'snake'; // 'pending review' => 'PENDING_REVIEW'
   * enumValueNameCasing: { casing: 'snake', wordCasing: 'all-lower' }; // 'pending review' => 'pending_review'
   * ```
   */
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  /**
   * The casing applied to constant names. The models generator does not write constants, and the spring-controller
   * generator uses it for the path constants of endpoints.
   * @default 'snake'
   */
  constantNameCasing: StringCasing | StringCasingWithOptions;

  /**
   * The imports that are left out of generated files, because Kotlin already imports these packages implicitly. An
   * entry ending in `.*` excludes a whole package, but not its subpackages. Any other entry excludes one type by its
   * fully qualified name, such as `com.example.Shared`.
   * @default
   * [
   *   'kotlin.*',
   *   'kotlin.annotation.*',
   *   'kotlin.collections.*',
   *   'kotlin.comparisons.*',
   *   'kotlin.io.*',
   *   'kotlin.ranges.*',
   *   'kotlin.sequences.*',
   *   'kotlin.text.*',
   *   'java.lang.*',
   *   'kotlin.jvm.*',
   * ]
   * @example
   * ```ts
   * // With globalImports: ['kotlin.*', 'kotlin.collections.*', 'com.example.Shared']
   * // 'kotlin.String' is not imported, because the package 'kotlin' is excluded.
   * // 'kotlin.collections.List' is not imported, because the package 'kotlin.collections' is excluded.
   * // 'com.example.Shared' is not imported, because the type is excluded by its full name.
   * // 'kotlin.time.Duration' is imported, because 'kotlin.*' does not exclude subpackages.
   * ```
   */
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

/**
 * The default values of the Kotlin generator configuration. Each property's `@default` tag in `KotlinGeneratorConfig`
 * gives the same value. `indent` is four spaces here, while the core default is two.
 * @see KotlinGeneratorConfig
 */
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
