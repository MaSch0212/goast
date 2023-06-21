import { OpenApiServicesGenerationProviderContext, ApiService, DefaultGenerationProviderConfig } from '@goast/core';

import { KotlinImport } from '../../../common-results';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../../config';
import { KotlinModelsGeneratorOutput } from '../../models';

export type KotlinServicesGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string;
};

export const defaultKotlinServicesGeneratorConfig: DefaultGenerationProviderConfig<KotlinServicesGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api',
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
