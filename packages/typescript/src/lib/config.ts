import {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { ImportModuleTransformer } from './utils';

export type TypeScriptGeneratorConfig = OpenApiGeneratorConfig & {
  importModuleTransformer: ImportModuleTransformer;

  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;

  preferUnknown: boolean;
  useSingleQuotes: boolean;
};

export const defaultTypeScriptGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptGeneratorConfig> = {
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 2 },

  importModuleTransformer: 'omit-extension',

  propertyNameCasing: 'camel',
  enumValueNameCasing: 'pascal',

  preferUnknown: true,
  useSingleQuotes: true,
};
