import {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

export type KotlinGeneratorConfig = OpenApiGeneratorConfig & {
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
};

export const defaultKotlinGeneratorConfig: DefaultGenerationProviderConfig<KotlinGeneratorConfig> = {
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 4 },

  propertyNameCasing: 'camel',
  enumValueNameCasing: 'snake',
};
