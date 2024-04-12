import {
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

  globalImports: string[];
};

export const defaultKotlinGeneratorConfig: DefaultGenerationProviderConfig<KotlinGeneratorConfig> = {
  charsTreatedAsEmptyLine: ['{'],
  indent: { type: 'spaces', count: 4 },

  typeNameCasing: 'pascal',
  parameterNameCasing: 'camel',
  functionNameCasing: 'camel',
  propertyNameCasing: 'camel',
  enumValueNameCasing: 'snake',

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
