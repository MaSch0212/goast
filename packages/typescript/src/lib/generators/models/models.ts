import { ApiSchema, DefaultGenerationProviderConfig, OpenApiSchemasGenerationProviderContext } from '@goast/core';
import { Nullable, OptionalProperties, StringCasing, StringCasingWithOptions } from '@goast/core/utils';

import { TypeScriptComponentOutput } from '../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../config';

export type TypeScriptModelGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  typeNameCasing: StringCasing | StringCasingWithOptions;

  enumGeneration: 'union' | 'prefer-enum';
  immutableTypes: boolean;
  inlineUnnamedSchemas: boolean;
  modelsDirPath: string;
  typeDeclaration: 'type' | 'prefer-interface';
};

export type TypeScriptModelsGeneratorConfig = TypeScriptModelGeneratorConfig & {
  indexFilePath: string | null;
};

export const defaultTypeScriptModelGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelGeneratorConfig> = {
  ...defaultTypeScriptGeneratorConfig,

  fileNameCasing: 'kebab',
  typeNameCasing: 'pascal',

  enumGeneration: 'union',
  immutableTypes: false,
  inlineUnnamedSchemas: true,
  modelsDirPath: 'models',
  typeDeclaration: 'type',
};

export const defaultTypeScriptModelsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptModelsGeneratorConfig> =
  {
    ...defaultTypeScriptModelGeneratorConfig,

    indexFilePath: 'models.ts',
  };

export type TypeScriptModelsGeneratorInput = {};

export type TypeScriptModelsGeneratorOutput = {
  models: {
    [schemaId: string]: TypeScriptModelGeneratorOutput;
  };
  modelIndexFilePath: Nullable<string>;
};

export type TypeScriptModelGeneratorOutput = OptionalProperties<TypeScriptComponentOutput, 'filePath'>;

export type TypeScriptModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  TypeScriptModelsGeneratorInput,
  TypeScriptModelsGeneratorOutput,
  TypeScriptModelsGeneratorConfig,
  TypeScriptModelGeneratorOutput
>;

export type TypeScriptModelGeneratorContext = TypeScriptModelsGeneratorContext & {
  schema: ApiSchema;
  getSchemaResult(schema: ApiSchema): TypeScriptModelGeneratorOutput;
};
