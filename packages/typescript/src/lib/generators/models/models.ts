import {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  Nullable,
  ExtendedStringCasing,
} from '@goast/core';

import { TypeScriptComponentOutput } from '../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../config';

export type TypeScriptModelGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * Determines how to generate enums.
   * - 'union': Generate enums as union types.
   * - 'prefer-enum': Generate enums as enums if possible, otherwise as union types.
   * @default 'union'
   */
  enumGeneration: 'union' | 'prefer-enum';

  /**
   * Whether to generate immutable types.
   * @default false
   */
  immutableTypes: boolean;

  /**
   * Whether to inline unnamed schemas. If false, unnamed schemas will be generated as separate types.
   * @default true
   */
  inlineUnnamedSchemas: boolean;

  /**
   * The directory where the models should be saved. The path is relative to the output directory.
   * @default 'models'
   */
  modelsDir: string;

  /**
   * The casing of the model file names. If nullish, the `fileNameCasing` is used.
   * @default undefined
   */
  modelFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * Determines how to declare types.
   * - 'type': Always declare types as `type`.
   * - 'prefer-interface': Prefer `interface` over `type` if possible.
   * @default 'type'
   */
  typeDeclaration: 'type' | 'prefer-interface';
};

export type TypeScriptModelsGeneratorConfig = TypeScriptModelGeneratorConfig & {
  /**
   * The path to the index file where all models should be exported. If nullish, no index file will be generated.
   * @default 'models.ts'
   */
  modelsIndexFile: Nullable<string>;
};

export const defaultTypeScriptModelGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelGeneratorConfig> = {
  ...defaultTypeScriptGeneratorConfig,

  enumGeneration: 'union',
  immutableTypes: false,
  inlineUnnamedSchemas: true,
  modelsDir: 'models',
  modelFileNameCasing: undefined,
  typeDeclaration: 'type',
};

export const defaultTypeScriptModelsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelsGeneratorConfig> =
  {
    ...defaultTypeScriptModelGeneratorConfig,

    modelsIndexFile: 'models.ts',
  };

export type TypeScriptModelsGeneratorInput = {};

export type TypeScriptModelsGeneratorOutput = {
  typescript: {
    models: {
      [schemaId: string]: TypeScriptModelGeneratorOutput;
    };
    indexFiles: {
      models: Nullable<string>;
    };
  };
};

export type TypeScriptModelGeneratorOutput = TypeScriptComponentOutput;

export type TypeScriptModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  TypeScriptModelsGeneratorInput,
  TypeScriptModelsGeneratorOutput,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelGeneratorOutput
>;

export type TypeScriptModelGeneratorContext = TypeScriptModelsGeneratorContext & {
  schema: ApiSchema;
};
