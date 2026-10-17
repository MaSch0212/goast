import type {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import type { kt } from '../../ast/index.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';

/**
 * The configuration of the `KotlinModelsGenerator`. It extends the common Kotlin generator configuration with the
 * model-specific options declared below.
 *
 * The common options are declared on `KotlinGeneratorConfig`. Their effect on the generated models is:
 * - `outputDir`: The root directory of the model files, which are placed in a package-based subdirectory.
 *   Default `'generated'`.
 * - `clearOutputDir`: Empties `outputDir` once before any model is written, so it also removes files written by other
 *   generators. Default `true`.
 * - `existingFileBehavior`: What happens when a model file already exists at its path. Default `'error'`.
 * - `indent`: The indentation of the generated Kotlin code. Default four spaces (`{ type: 'spaces', count: 4 }`).
 * - `newLine`: The line separator of the generated files. Default `os.EOL`.
 * - `typeNameCasing`: The casing of type names, which also determines the model file names. Default `'pascal'`.
 * - `parameterNameCasing`: The casing of the parameters of the generated `set` function for `additionalProperties`.
 *   Default `'camel'`.
 * - `functionNameCasing`: The casing of the generated `set` and `getMap` functions for `additionalProperties`.
 *   Default `'camel'`.
 * - `propertyNameCasing`: The casing of property names, the `value` property of enums and `additionalProperties`.
 *   Default `'camel'`.
 * - `enumValueNameCasing`: The casing of enum constant names, so the value `available` becomes `AVAILABLE`.
 *   Default `'snake'`.
 * - `constantNameCasing`: No effect on this generator. Default `'snake'`.
 * - `globalImports`: Imports that are not written to the generated files, such as the standard `kotlin.*`,
 *   `java.lang.*` and `kotlin.jvm.*` packages. Default: `defaultKotlinGeneratorConfig.globalImports`.
 * - `includeSourceInDocs`: Adds the source document path to the doc comments of generated classes, interfaces, enums
 *   and interface properties. Default `false`.
 * - `springBootVersion`: No effect on this generator, because the Jackson annotations it writes are the same for both
 *   versions. Default `3`.
 * @see defaultKotlinModelsGeneratorConfig
 */
export type KotlinModelsGeneratorConfig = KotlinGeneratorConfig & {
  /**
   * The package name for generated models.
   * The model files are placed in `{outputDir}/{packagePath}`, where `packagePath` is `packageName` followed by
   * `packageSuffix` with the dots replaced by slashes. The same package is written as the `package` declaration.
   * @default 'com.openapi.generated'
   */
  packageName: string;

  /**
   * The suffix to append to the package name for generated models.
   * Include the leading `.`, because the suffix is appended as written. A function receives the schema of each model
   * and returns the suffix for it, which allows models to be split across packages. The resulting package determines
   * the model's file path and its `package` declaration.
   * @default '.model'
   */
  packageSuffix: string | ((schema: ApiSchema) => string);

  /**
   * Determines how `oneOf` schemas should be treated.
   * This changes which properties the generated class or interface declares. Under `treat-as-any-of` the properties of
   * the branches are merged as optional properties, and under `treat-as-all-of` they are merged as `allOf` members.
   * - `treat-as-any-of`: Treat `oneOf` schemas as `anyOf` schemas.
   * - `treat-as-all-of`: Treat `oneOf` schemas as `allOf` schemas.
   * @default 'treat-as-any-of'
   */
  oneOfBehavior: 'treat-as-any-of' | 'treat-as-all-of';

  /**
   * Determines how schemas of type `object` without properties should be treated.
   * Empty object schemas that allow additional properties always become `Map<String, ...>`, and discriminated base
   * schemas always get their own file, regardless of this setting.
   * - `use-any`: Generate `Any` type for empty object schemas. No file is generated for them.
   * - `generate-empty-class`: Generate an empty class for empty object schemas. The class is not a `data class`.
   * @default 'generate-empty-class'
   */
  emptyObjectTypeBehavior: 'use-any' | 'generate-empty-class';

  /**
   * Whether to add Jackson annotations to generated models.
   * When `true`, classes and interfaces get `@JsonClassDescription`, interfaces also get `@JsonTypeInfo` and
   * `@JsonSubTypes`, and properties get `@JsonProperty`, `@JsonPropertyDescription` and `@JsonInclude` where
   * applicable. When `false`, these are omitted. Enum constants keep their `@JsonProperty` annotation, and
   * `additionalProperties` keep `@JsonIgnore`, `@JsonAnySetter` and `@JsonAnyGetter` either way.
   * @default true
   */
  addJacksonAnnotations: boolean;

  /**
   * Whether to add Jakarta Validation annotations to generated models.
   * When `true`, constructor parameters of generated classes get `@Pattern`, `@NotEmpty`, `@Size`, `@Min` and `@Max`
   * from the property's constraints, and `@Valid` when the property refers to a generated model. Interface properties
   * do not receive them. When `false`, none of these are added.
   * @default true
   */
  addJakartaValidationAnnotations: boolean;

  /**
   * Whether to add Swagger annotations to generated models.
   * When `true`, each constructor parameter of a generated class gets a `@Schema` annotation with its example,
   * `required` flag, description and deprecation. Interface properties do not receive it. When `false`, none is added.
   * @default true
   */
  addSwaggerAnnotations: boolean;
};

/**
 * The default configuration of the `KotlinModelsGenerator`. Options passed to the generator are merged on top of these.
 * It includes the common Kotlin defaults from `defaultKotlinGeneratorConfig`.
 * @see KotlinModelsGeneratorConfig
 */
export const defaultKotlinModelsGeneratorConfig: DefaultGenerationProviderConfig<KotlinModelsGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.model',
  oneOfBehavior: 'treat-as-any-of',

  emptyObjectTypeBehavior: 'generate-empty-class',

  addJacksonAnnotations: true,
  addJakartaValidationAnnotations: true,
  addSwaggerAnnotations: true,
};

/**
 * The input of the `KotlinModelsGenerator`. The generator does not use any input data, so this type has no properties.
 */
export type KotlinModelsGeneratorInput = {};

/**
 * The output of the `KotlinModelsGenerator`. It is merged into the generation result, where the models are published
 * under the `kotlin.models` key.
 * @see KotlinModelGeneratorOutput
 */
export type KotlinModelsGeneratorOutput = {
  /**
   * The Kotlin results of the generator, grouped under the `kotlin` key.
   */
  kotlin: {
    /**
     * The generated models, keyed by the ID of their schema. Each entry describes the Kotlin type the schema maps to.
     */
    models: {
      /**
       * The result for the schema with the given ID. Schemas that get no file are included as well.
       */
      [schemaId: string]: KotlinModelGeneratorOutput;
    };
  };
};

/**
 * The result of generating one schema. Its `type` property is the Kotlin type the schema maps to: for a model with
 * its own file, a reference to the generated class, interface or enum in its package. For any other schema, the
 * built-in type it was mapped to, such as `String`, `List<...>`, `Map<String, ...>` or `Any`. The file path is not
 * part of the result.
 * @see KotlinModelsGeneratorOutput
 */
export type KotlinModelGeneratorOutput = { type: kt.Reference<SourceBuilder> };

/**
 * The context of the `KotlinModelsGenerator`. Besides the generator configuration (`config`) and the parsed document
 * (`data`), it holds the `output` being built, which contains the `kotlin.models` entries, and the results already
 * generated per schema (`existingSchemaResults`).
 * @see KotlinModelGeneratorContext
 */
export type KotlinModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  KotlinModelsGeneratorInput,
  KotlinModelsGeneratorOutput,
  KotlinModelsGeneratorConfig,
  KotlinModelGeneratorOutput
>;

/**
 * The context passed to a `KotlinModelGenerator` for one schema. It extends the `KotlinModelsGeneratorContext` with
 * the schema to generate.
 * @see KotlinModelsGeneratorContext
 */
export type KotlinModelGeneratorContext = KotlinModelsGeneratorContext & {
  /**
   * The schema to generate the model for. Its `$src` path identifies where it appears in the document.
   */
  schema: ApiSchema;
};
