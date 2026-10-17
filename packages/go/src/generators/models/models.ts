import type {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import type { go } from '../../ast/index.ts';
import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import type { GoPackageInfo } from '../file-generator.ts';

export type GoModelsGeneratorConfig = GoGeneratorConfig & {
  /**
   * The directory of the package for the models, relative to the output directory and to `modulePath`.
   * @default 'api'
   */
  packagePath: string;

  /**
   * The name of the package for the models. Derived from the last segment of `packagePath` if not set.
   */
  packageName?: string;

  /**
   * Determines how `oneOf` schemas should be treated. Go has no union types, so either way the result is one struct.
   * - `treat-as-any-of`: Merge the properties of all branches, each optional.
   * - `treat-as-all-of`: Merge the properties of all branches, keeping which ones are required.
   * @default 'treat-as-any-of'
   */
  oneOfBehavior: 'treat-as-any-of' | 'treat-as-all-of';

  /**
   * Determines how schemas of type `object` without properties should be treated.
   * - `use-any`: Use `any` for empty object schemas.
   * - `generate-empty-struct`: Generate an empty struct for empty object schemas.
   * @default 'generate-empty-struct'
   */
  emptyObjectTypeBehavior: 'use-any' | 'generate-empty-struct';

  /**
   * Whether to generate an `IsValid` method for enum types, which reports whether a value is one of the enum values.
   * @default true
   */
  addEnumValidation: boolean;
};

export const defaultGoModelsGeneratorConfig: DefaultGenerationProviderConfig<GoModelsGeneratorConfig> = {
  ...defaultGoGeneratorConfig,

  packagePath: 'api',
  oneOfBehavior: 'treat-as-any-of',
  emptyObjectTypeBehavior: 'generate-empty-struct',
  addEnumValidation: true,
};

export type GoModelsGeneratorInput = {};

export type GoModelsGeneratorOutput = {
  go: {
    models: {
      [schemaId: string]: GoModelGeneratorOutput;
    };
  };
};

export type GoModelGeneratorOutput = {
  /** The type to use for the schema, e.g. a reference to the declared struct, or `[]string`. */
  type: go.Type<SourceBuilder>;
  /** The fields of the declared struct by property name, if the schema is declared as a struct. */
  fields?: { [propertyName: string]: GoModelFieldOutput };
};

export type GoModelFieldOutput = {
  /** The name of the field. */
  name: string;
  /** The type of the field, a pointer if the property may be absent. */
  type: go.Type<SourceBuilder>;
};

export type GoModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  GoModelsGeneratorInput,
  GoModelsGeneratorOutput,
  GoModelsGeneratorConfig,
  GoModelGeneratorOutput
> & {
  /** The packages that need the JSON helpers for additional properties, by import path. */
  packagesWithAdditionalProperties: Map<string, GoPackageInfo>;
};

export type GoModelGeneratorContext = GoModelsGeneratorContext & {
  schema: ApiSchema;
};
