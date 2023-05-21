import { OpenApiGeneratorConfig } from '@goast/core';
import {
  SourceBuilderOptions,
  StringCasing,
  StringCasingWithOptions,
  defaultSourceBuilderOptions,
} from '@goast/core/utils';

import { ImportModuleTransformer } from './utils';

type TypeScriptGeneratorConfigAdditions = {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  typeNameCasing: StringCasing | StringCasingWithOptions;
  functionNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  privatePropertyNameCasing: StringCasing | StringCasingWithOptions;

  importModuleTransformer: ImportModuleTransformer;

  preferUnknown: boolean;
  useSingleQuotes: boolean;
};
export type TypeScriptGeneratorConfig = SourceBuilderOptions &
  OpenApiGeneratorConfig &
  TypeScriptGeneratorConfigAdditions;
export type TypeScriptGeneratorConfigOverrides = Partial<SourceBuilderOptions & TypeScriptGeneratorConfigAdditions>;

export const defaultTypeScriptGeneratorConfig: Required<TypeScriptGeneratorConfigOverrides> = {
  ...defaultSourceBuilderOptions,
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 2 },

  fileNameCasing: { casing: 'kebab' },
  typeNameCasing: 'pascal',
  functionNameCasing: 'camel',
  propertyNameCasing: 'camel',
  privatePropertyNameCasing: { casing: 'camel', prefix: '_' },

  importModuleTransformer: 'omit-extension',

  preferUnknown: true,
  useSingleQuotes: true,
};
