import { ApiSchema, DefaultGenerationProviderConfig, OpenApiSchemasGenerationProviderContext } from '@goast/core';

import { KotlinImport } from '../../common-results';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../config';

export type KotlinModelsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((schema: ApiSchema) => string);
  oneOfBehavior: 'treat-as-any-of' | 'treat-as-all-of';

  addJacksonAnnotations: boolean;
  addJakartaValidationAnnotations: boolean;
  addSwaggerAnnotations: boolean;
};

export const defaultKotlinModelsGeneratorConfig: DefaultGenerationProviderConfig<KotlinModelsGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.model',
  oneOfBehavior: 'treat-as-any-of',

  addJacksonAnnotations: true,
  addJakartaValidationAnnotations: true,
  addSwaggerAnnotations: true,
};

export type KotlinModelsGeneratorInput = {};

export type KotlinModelsGeneratorOutput = {
  models: {
    [schemaId: string]: KotlinModelGeneratorOutput;
  };
};

export type KotlinModelGeneratorOutput = KotlinImport & {
  additionalImports: KotlinImport[];
};

export type KotlinModelsGeneratorContext = OpenApiSchemasGenerationProviderContext<
  KotlinModelsGeneratorInput,
  KotlinModelsGeneratorOutput,
  KotlinModelsGeneratorConfig,
  KotlinModelGeneratorOutput
>;

export type KotlinModelGeneratorContext = KotlinModelsGeneratorContext & {
  schema: ApiSchema;
};
