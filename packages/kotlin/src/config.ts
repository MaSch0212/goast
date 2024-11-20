import type {
  DefaultGenerationProviderConfig,
  OpenApiGeneratorConfig,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

export type KotlinGeneratorConfig = OpenApiGeneratorConfig & {
  typeNameCasing: StringCasing | StringCasingWithOptions;
  parameterNameCasing: StringCasing | StringCasingWithOptions;
  functionNameCasing: StringCasing | StringCasingWithOptions;
  propertyNameCasing: StringCasing | StringCasingWithOptions;
  enumValueNameCasing: StringCasing | StringCasingWithOptions;
  constantNameCasing: StringCasing | StringCasingWithOptions;

  globalImports: string[];
};

export const defaultKotlinGeneratorConfig: DefaultGenerationProviderConfig<KotlinGeneratorConfig> = {
  indent: { type: 'spaces', count: 4 },

  typeNameCasing: 'pascal',
  parameterNameCasing: 'camel',
  functionNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'snake',
  constantNameCasing: 'snake',

  globalImports: [
    'kotlin.*',
    'kotlin.annotation.*',
    'kotlin.collections.*',
    'kotlin.comparisons.*',
    'kotlin.io.*',
    'kotlin.ranges.*',
    'kotlin.sequences.*',
    'kotlin.text.*',
    'java.lang.*',
    'kotlin.jvm.*',
  ],
};
