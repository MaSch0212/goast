import { ApiService, DefaultGenerationProviderConfig, OpenApiServicesGenerationProviderContext } from '@goast/core';

import { KotlinImport } from '../../../common-results';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../../config';
import { KotlinModelsGeneratorOutput } from '../../models';

export type KotlinOkHttp3ClientsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string;
  infrastructurePackageName: string;
};

export const defaultKotlinOkHttp3ClientsGeneratorConfig: DefaultGenerationProviderConfig<KotlinOkHttp3ClientsGeneratorConfig> =
  {
    ...defaultKotlinGeneratorConfig,

    packageName: 'com.openapi.generated',
    packageSuffix: '.client',
    infrastructurePackageName: 'com.openapi.client.infrastructure',
  };

export type KotlinOkHttp3ClientsGeneratorInput = KotlinModelsGeneratorOutput;

export type KotlinOkHttp3ClientsGeneratorOutput = {
  clients: {
    [serviceId: string]: KotlinOkHttp3ClientGeneratorOutput;
  };
};

export type KotlinOkHttp3ClientGeneratorOutput = KotlinImport;

export type KotlinOkHttp3ClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinOkHttp3ClientsGeneratorInput,
  KotlinOkHttp3ClientsGeneratorOutput,
  KotlinOkHttp3ClientsGeneratorConfig,
  KotlinOkHttp3ClientGeneratorOutput
>;

export type KotlinOkHttp3ClientGeneratorContext = KotlinOkHttp3ClientsGeneratorContext & {
  service: ApiService;
};
