import type {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { KotlinImport } from '../../../common-results.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../../config.ts';
import type { KotlinModelsGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

export type KotlinSpringReactiveWebClientsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service?: ApiService) => string);
  infrastructurePackageName:
    | string
    | { mode: 'append-package-name' | 'append-full-package-name' | 'replace'; value: string };

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
  infrastructurePackageName: { mode: 'append-full-package-name', value: '.infrastructure' },
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

export type KotlinSpringReactiveWebClientsGeneratorContext =
  & OpenApiServicesGenerationProviderContext<
    KotlinSpringReactiveWebClientsGeneratorInput,
    KotlinSpringReactiveWebClientsGeneratorOutput,
    KotlinSpringReactiveWebClientsGeneratorConfig,
    KotlinSpringReactiveWebClientGeneratorOutput
  >
  & {
    infrastructurePackageName: string;
    refs: ReturnType<typeof getReferenceFactories>;
  };

export type KotlinSpringReactiveWebClientGeneratorContext = KotlinSpringReactiveWebClientsGeneratorContext & {
  service: ApiService;
};
