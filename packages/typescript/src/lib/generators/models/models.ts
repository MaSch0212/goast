import {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  Nullable,
} from '@goast/core';

import { TypeScriptComponentOutput } from '../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../config';

export type TypeScriptModelGeneratorConfig = TypeScriptGeneratorConfig & {
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
  indexFiles: {
    models: Nullable<string>;
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
