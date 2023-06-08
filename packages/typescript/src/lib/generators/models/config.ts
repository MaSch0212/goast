import { DefaultGenerationProviderConfig } from '@goast/core';
import { StringCasing, StringCasingWithOptions } from '@goast/core/utils';

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
