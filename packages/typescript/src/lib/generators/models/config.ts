import {
  TypeScriptGeneratorConfig,
  TypeScriptGeneratorConfigOverrides,
  defaultTypeScriptGeneratorConfig,
} from '../../config';

type TypeScriptModelGeneratorConfigAdditions = {
  enumGeneration: 'union' | 'prefer-enum';
  immutableTypes: boolean;
  inlineUnnamedSchemas: boolean;
  modelsDirPath: string;
  typeDeclaration: 'type' | 'prefer-interface';
};
export type TypeScriptModelGeneratorConfig = TypeScriptGeneratorConfig & TypeScriptModelGeneratorConfigAdditions;
export type TypeScriptModelGeneratorConfigOverrides = TypeScriptGeneratorConfigOverrides &
  TypeScriptModelGeneratorConfigAdditions;

type TypeScriptModelsGeneratorConfigAdditions = {
  indexFilePath: string | null;
};
export type TypeScriptModelsGeneratorConfig = TypeScriptModelGeneratorConfig & TypeScriptModelsGeneratorConfigAdditions;
export type TypeScriptModelsGeneratorConfigOverrides = TypeScriptModelGeneratorConfigOverrides &
  TypeScriptModelsGeneratorConfigAdditions;

export const defaultTypeScriptModelGeneratorConfig: Required<TypeScriptModelGeneratorConfigOverrides> = {
  ...defaultTypeScriptGeneratorConfig,
  fileNameCasing: { casing: 'kebab', suffix: '.model' },

  enumGeneration: 'union',
  immutableTypes: false,
  inlineUnnamedSchemas: true,
  modelsDirPath: 'models',
  typeDeclaration: 'type',
};

export const defaultTypeScriptModelsGeneratorConfig: Required<TypeScriptModelsGeneratorConfigOverrides> = {
  ...defaultTypeScriptModelGeneratorConfig,

  indexFilePath: 'models.ts',
};
