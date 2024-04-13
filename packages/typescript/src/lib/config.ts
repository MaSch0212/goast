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
  methodNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  constantCasing: StringCasing | StringCasingWithOptions;
  genericParamCasing: StringCasing | StringCasingWithOptions;

  preferUnknown: boolean;
  useSingleQuotes: boolean;
};

export const defaultTypeScriptGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptGeneratorConfig> = {
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 2 },

  importModuleTransformer: 'omit-extension',

  fileNameCasing: 'kebab',
  typeNameCasing: 'pascal',
  methodNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'pascal',
  constantCasing: { casing: 'snake', wordCasing: 'all-upper' },
  genericParamCasing: { casing: 'pascal', prefix: 'T' },

  preferUnknown: true,
  useSingleQuotes: true,
};
