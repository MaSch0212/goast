import type { DefaultGenerationProviderConfig, ExtendedStringCasing, OpenApiGeneratorConfig } from '@goast/core';

import type { ImportModuleTransformer } from './utils.ts';

/**
 * The configuration that is shared by all TypeScript generators, on top of the `OpenApiGeneratorConfig` options.
 * It controls the casing of generated names, how import module paths are written, and some output style settings.
 * @see defaultTypeScriptGeneratorConfig
 */
export type TypeScriptGeneratorConfig = OpenApiGeneratorConfig & {
  /**
   * The transformer to use for transforming import module paths.
   * It only applies to imports of project files (paths ending in `.ts`, `.js` or `.json`) into a file with a known
   * path.
   * A function receives the relative path, such as `../models/user.ts`, and returns the path to write.
   * @example
   * ```ts
   * // Importing `src/models/user.ts` from `src/services/api.ts` produces:
   * // 'omit-extension': '../models/user'
   * // 'with-extension': '../models/user.ts'
   * // 'js-extension': '../models/user.js'
   * ```
   * @default 'omit-extension'
   */
  importModuleTransformer: ImportModuleTransformer;

  /**
   * The casing to use for file names.
   * @example
   * ```ts
   * // With 'kebab', a model named `UserProfile` is written to `user-profile.ts`.
   * ```
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
   * @example
   * ```ts
   * // With the default, `fooBar` is written as `FOO_BAR`.
   * ```
   * @default { casing: 'snake', wordCasing: 'all-upper' }
   */
  constantNameCasing: ExtendedStringCasing;

  /**
   * The casing to use for generic parameter names.
   * @example
   * ```ts
   * // With the default, the discriminator property `kind` gets the generic parameter `TKind`.
   * ```
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

  /**
   * Whether to include the source OpenAPI document path in the generated documentation comments.
   * @default false
   */
  includeSourceInDocs: boolean;
};

/**
 * The default values of the common TypeScript generator configuration. A generator uses these values for every
 * property that is not set explicitly.
 * @see TypeScriptGeneratorConfig
 */
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
  includeSourceInDocs: false,
};
