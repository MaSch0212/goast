import { DefaultGenerationProviderConfig, ExtendedStringCasing, OpenApiGeneratorConfig } from '@goast/core';

import { ImportModuleTransformer } from './utils';

export type TypeScriptGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The transformer to use for transforming import module paths.
   * @default 'omit-extension'
   */
  importModuleTransformer: ImportModuleTransformer;

  /**
   * The casing to use for file names.
   * @default 'kebab'
   */
  fileNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for type names.
   * @default 'pascal'
   */
  typeNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for function names.
   * @default 'camel'
   */
  functionNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for property names.
   * @default 'camel'
   */
  propertyNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for enum value names.
   * @default 'pascal'
   */
  enumValueNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for constant names.
   * @default { casing: 'snake', wordCasing: 'all-upper' }
   */
  constantNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for generic parameter names.
   * @default { casing: 'pascal', prefix: 'T' }
   */
  genericParamNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for parameter names.
   * @default 'camel'
   */
  paramNameCasing: ExtendedStringCasing;

  /**
   * Whether to prefer `unknown` over `any`.
   * @default true
   */
  preferUnknown: boolean;

  /**
   * Whether to use single quotes for strings.
   * @default true
   */
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
