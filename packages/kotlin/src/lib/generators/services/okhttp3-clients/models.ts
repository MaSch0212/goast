import {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import { KotlinImport } from '../../../common-results';
import { KotlinGeneratorConfig, defaultKotlinGeneratorConfig } from '../../../config';
import { KotlinModelsGeneratorOutput } from '../../models';

export type KotlinOkHttp3ClientsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service?: ApiService) => string);
  infrastructurePackageName:
    | string
    | { mode: 'append-package-name' | 'append-full-package-name' | 'replace'; value: string };

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

export const defaultKotlinOkHttp3ClientsGeneratorConfig: DefaultGenerationProviderConfig<KotlinOkHttp3ClientsGeneratorConfig> =
  {
    ...defaultKotlinGeneratorConfig,

    packageName: 'com.openapi.generated',
    packageSuffix: '.api.client',
    infrastructurePackageName: { mode: 'append-full-package-name', value: '.infrastructure' },
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
> & {
  infrastructurePackageName: string;
};

export type KotlinOkHttp3ClientGeneratorContext = KotlinOkHttp3ClientsGeneratorContext & {
  service: ApiService;
};
