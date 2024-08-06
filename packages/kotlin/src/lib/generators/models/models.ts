import {
  ApiSchema,
  DefaultGenerationProviderConfig,
  OpenApiSchemasGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import { kt } from '../../ast';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../config';

export type KotlinModelsGeneratorConfig = KotlinGeneratorConfig & {
  /**
   * The package name for generated models.
   * @default 'com.openapi.generated'
   */
  packageName: string;

  /**
   * The suffix to append to the package name for generated models.
   * @default '.model'
   */
  packageSuffix: string | ((schema: ApiSchema) => string);

  /**
   * Determines how `oneOf` schemas should be treated.
   * - `treat-as-any-of`: Treat `oneOf` schemas as `anyOf` schemas.
   * - `treat-as-all-of`: Treat `oneOf` schemas as `allOf` schemas.
   * @default 'treat-as-any-of'
   */
  oneOfBehavior: 'treat-as-any-of' | 'treat-as-all-of';

  /**
   * Determines how schemas of type `object` without properties should be treated.
   * - `use-any`: Generate `Any` type for empty object schemas.
   * - `generate-empty-class`: Generate an empty class for empty object schemas.
   * @default 'generate-empty-class'
   */
  emptyObjectTypeBehavior: 'use-any' | 'generate-empty-class';

  /**
   * Whether to add Jackson annotations to generated models.
   * @default true
   */
  addJacksonAnnotations: boolean;

  /**
   * Whether to add Jakarta Validation annotations to generated models.
   * @default true
   */
  addJakartaValidationAnnotations: boolean;

  /**
   * Whether to add Swagger annotations to generated models.
   * @default true
   */
  addSwaggerAnnotations: boolean;
};

export const defaultKotlinModelsGeneratorConfig: DefaultGenerationProviderConfig<KotlinModelsGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.model',
  oneOfBehavior: 'treat-as-any-of',

  emptyObjectTypeBehavior: 'generate-empty-class',

  addJacksonAnnotations: true,
  addJakartaValidationAnnotations: true,
  addSwaggerAnnotations: true,
};

export type KotlinModelsGeneratorInput = {};

export type KotlinModelsGeneratorOutput = {
  kotlin: {
    models: {
      [schemaId: string]: KotlinModelGeneratorOutput;
    };
  };
};

export type KotlinModelGeneratorOutput = { type: kt.Reference<SourceBuilder> };

export type KotlinModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  KotlinModelsGeneratorInput,
  KotlinModelsGeneratorOutput,
  KotlinModelsGeneratorConfig,
  KotlinModelGeneratorOutput
>;

export type KotlinModelGeneratorContext = KotlinModelsGeneratorContext & {
  schema: ApiSchema;
};
