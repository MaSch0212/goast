import {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { ImportModuleTransformer } from './utils';

export type TypeScriptGeneratorConfig = OpenApiGeneratorConfig & {
  importModuleTransformer: ImportModuleTransformer;

  typeNameCasing: StringCasing | StringCasingWithOptions;
  methodNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  constantCasing: StringCasing | StringCasingWithOptions;

  preferUnknown: boolean;
  useSingleQuotes: boolean;
};

export const defaultTypeScriptGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptGeneratorConfig> = {
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 2 },

  importModuleTransformer: 'omit-extension',

  typeNameCasing: 'pascal',
  methodNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'pascal',
  constantCasing: { casing: 'snake', wordCasing: 'all-upper' },

  preferUnknown: true,
  useSingleQuotes: true,
};
