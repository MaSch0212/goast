import {
  OpenApiServicesGenerationProviderContext,
  ApiService,
  DefaultGenerationProviderConfig,
  ApiEndpoint,
} from '@goast/core';

import { KotlinImport } from '../../../common-results';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../../config';
import { KotlinModelsGeneratorOutput } from '../../models';

export type KotlinServicesGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service: ApiService) => string);

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  addSwaggerAnnotations: boolean;
  addJakartaValidationAnnotations: boolean;
};

export const defaultKotlinServicesGeneratorConfig: DefaultGenerationProviderConfig<KotlinServicesGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api',

  addSwaggerAnnotations: true,
  addJakartaValidationAnnotations: true,
};

export type KotlinServicesGeneratorInput = KotlinModelsGeneratorOutput;

export type KotlinServicesGeneratorOutput = {
  services: {
    [serviceId: string]: KotlinServiceGeneratorOutput;
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
