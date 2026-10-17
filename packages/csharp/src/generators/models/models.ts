import type {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import type { cs } from '../../ast/index.ts';
import { type CSharpGeneratorConfig, defaultCSharpGeneratorConfig } from '../../config.ts';

export type CSharpModelsGeneratorConfig = CSharpGeneratorConfig & {
  /**
   * The suffix to append to the root namespace for generated models.
   * @default '.Models'
   */
  namespaceSuffix: string | ((schema: ApiSchema) => string);

  /**
   * The directory (relative to `outputDir`) the model files are written to.
   * @default 'Models'
   */
  modelsDir: string;

  /**
   * Whether models are immutable: properties are `{ get; init; }` and collections are `IReadOnlyList<T>` and
   * `IReadOnlyDictionary<string, T>`. When `false`, properties are `{ get; set; }` and collections are `List<T>` and
   * `Dictionary<string, T>`.
   * @default true
   */
  immutableTypes: boolean;

  /**
   * Determines how `oneOf` schemas should be treated.
   * - `treat-as-any-of`: Treat `oneOf` schemas as `anyOf` schemas.
   * - `treat-as-all-of`: Treat `oneOf` schemas as `allOf` schemas.
   * @default 'treat-as-any-of'
   */
  oneOfBehavior: 'treat-as-any-of' | 'treat-as-all-of';

  /**
   * Determines how schemas of type `object` without properties should be treated.
   * - `use-any`: Use `JsonElement` for empty object schemas.
   * - `generate-empty-class`: Generate an empty record for empty object schemas.
   * @default 'generate-empty-class'
   */
  emptyObjectTypeBehavior: 'use-any' | 'generate-empty-class';

  /**
   * Whether to add `System.ComponentModel.DataAnnotations` attributes (`[StringLength]`, `[Range]`, ...) to generated
   * models.
   * @default true
   */
  addDataAnnotations: boolean;
};

export const defaultCSharpModelsGeneratorConfig: DefaultGenerationProviderConfig<CSharpModelsGeneratorConfig> = {
  ...defaultCSharpGeneratorConfig,

  namespaceSuffix: '.Models',
  modelsDir: 'Models',
  immutableTypes: true,
  oneOfBehavior: 'treat-as-any-of',
  emptyObjectTypeBehavior: 'generate-empty-class',
  addDataAnnotations: true,
};

export type CSharpModelsGeneratorInput = {};

export type CSharpModelsGeneratorOutput = {
  csharp: {
    models: {
      [schemaId: string]: CSharpModelGeneratorOutput;
    };
  };
};

export type CSharpModelGeneratorOutput = { type: cs.Reference<SourceBuilder> };

export type CSharpModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  CSharpModelsGeneratorInput,
  CSharpModelsGeneratorOutput,
  CSharpModelsGeneratorConfig,
  CSharpModelGeneratorOutput
>;

export type CSharpModelGeneratorContext = CSharpModelsGeneratorContext & {
  schema: ApiSchema;
};
