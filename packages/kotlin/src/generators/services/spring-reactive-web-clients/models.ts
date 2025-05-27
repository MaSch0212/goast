import type {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { KotlinImport } from '../../../common-results.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../../config.ts';
import type { KotlinModelsGeneratorOutput } from '../../models/index.ts';

export type KotlinSpringReactiveWebClientsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service?: ApiService) => string);

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
  serializerJsonInclude: 'always' | 'non-null' | 'non-absent' | 'non-default' | 'non-empty' | 'use-defaults';
};

export const defaultKotlinSpringReactiveWebClientsGeneratorConfig: DefaultGenerationProviderConfig<
  KotlinSpringReactiveWebClientsGeneratorConfig
> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api.client',
  serializerJsonInclude: 'non-absent',
};

export type KotlinSpringReactiveWebClientsGeneratorInput = KotlinModelsGeneratorOutput;

export type KotlinSpringReactiveWebClientsGeneratorOutput = {
  kotlin: {
    clients: {
      [serviceId: string]: KotlinSpringReactiveWebClientGeneratorOutput;
    };
  };
};

export type KotlinSpringReactiveWebClientGeneratorOutput = KotlinImport;

export type KotlinSpringReactiveWebClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinSpringReactiveWebClientsGeneratorInput,
  KotlinSpringReactiveWebClientsGeneratorOutput,
  KotlinSpringReactiveWebClientsGeneratorConfig,
  KotlinSpringReactiveWebClientGeneratorOutput
>;

export type KotlinSpringReactiveWebClientGeneratorContext = KotlinSpringReactiveWebClientsGeneratorContext & {
  service: ApiService;
};
