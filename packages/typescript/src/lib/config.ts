import {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { ImportModuleTransformer } from './utils';

export type TypeScriptGeneratorConfig = OpenApiGeneratorConfig & {
  importModuleTransformer: ImportModuleTransformer;

  fileNameCasing: StringCasing | StringCasingWithOptions;
  typeNameCasing: StringCasing | StringCasingWithOptions;
  functionNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  constantNameCasing: StringCasing | StringCasingWithOptions;
  paramNameCasing: StringCasing | StringCasingWithOptions;
  genericParamNameCasing: StringCasing | StringCasingWithOptions;

  preferUnknown: boolean;
  useSingleQuotes: boolean;
};

export const defaultTypeScriptGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptGeneratorConfig> = {
  indent: { type: 'spaces', count: 2 },

  importModuleTransformer: 'omit-extension',

  fileNameCasing: 'kebab',
  typeNameCasing: 'pascal',
  functionNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'pascal',
  constantNameCasing: { casing: 'snake', wordCasing: 'all-upper' },
  genericParamNameCasing: { casing: 'pascal', prefix: 'T' },
  paramNameCasing: 'camel',

  preferUnknown: true,
  useSingleQuotes: true,
};
