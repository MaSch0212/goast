import type {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { KotlinImport } from '../../../common-results.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../../config.ts';
import type { KotlinModelsGeneratorOutput } from '../../models/index.ts';

export type KotlinServicesGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service: ApiService) => string);

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  addSwaggerAnnotations: boolean;
  addJakartaValidationAnnotations: boolean;
  arrayType: 'list' | 'flux';
};

export const defaultKotlinServicesGeneratorConfig: DefaultGenerationProviderConfig<KotlinServicesGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api',

  addSwaggerAnnotations: true,
  addJakartaValidationAnnotations: true,
  arrayType: 'flux',
};

export type KotlinServicesGeneratorInput = KotlinModelsGeneratorOutput;

export type KotlinServicesGeneratorOutput = {
  kotlin: {
    services: {
      [serviceId: string]: KotlinServiceGeneratorOutput;
    };
  };
};

export type KotlinServiceGeneratorOutput = {
  apiInterface: KotlinImport;
  apiController: KotlinImport;
  apiDelegate: KotlinImport;
};

export type KotlinServicesGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinServicesGeneratorInput,
  KotlinServicesGeneratorOutput,
  KotlinServicesGeneratorConfig,
  KotlinServiceGeneratorOutput
>;

export type KotlinServiceGeneratorContext = KotlinServicesGeneratorContext & {
  service: ApiService;
};
