import type {
  ApiEndpoint,
  ApiService,
  AppendValue,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { KotlinImport } from '../../../common-results.ts';
import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../../config.ts';
import type { KotlinFileBuilder } from '../../../file-builder.ts';
import type { KotlinModelsGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

export type KotlinOkHttp3ClientsGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service?: ApiService) => string);
  infrastructurePackageName:
    | string
    | { mode: 'append-package-name' | 'append-full-package-name' | 'replace'; value: string };

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
  serializerJsonInclude: 'always' | 'non-null' | 'non-absent' | 'non-default' | 'non-empty' | 'use-defaults';
  /**
   * Determines how the serializer is provided to the client.
   * - `static`: A static instance is created in the infrastructure package and used by all clients.
   * - `parameter`: The serializer is provided as a required constructor parameter to the client.
   * - `{ mode: 'static', factory: ... }`: A static instance is created using the provided factory function.
   * @default 'static'
   */
  serializer: 'static' | 'parameter' | { mode: 'static'; factory: AppendValue<KotlinFileBuilder> };
};

export const defaultKotlinOkHttp3ClientsGeneratorConfig: DefaultGenerationProviderConfig<
  KotlinOkHttp3ClientsGeneratorConfig
> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api.client',
  infrastructurePackageName: { mode: 'append-full-package-name', value: '.infrastructure' },
  serializerJsonInclude: 'non-absent',
  serializer: 'static',
};

export type KotlinOkHttp3ClientsGeneratorInput = KotlinModelsGeneratorOutput;

export type KotlinOkHttp3ClientsGeneratorOutput = {
  kotlin: {
    clients: {
      [serviceId: string]: KotlinOkHttp3ClientGeneratorOutput;
    };
  };
};

export type KotlinOkHttp3ClientGeneratorOutput = KotlinImport;

export type KotlinOkHttp3ClientsGeneratorContext =
  & OpenApiServicesGenerationProviderContext<
    KotlinOkHttp3ClientsGeneratorInput,
    KotlinOkHttp3ClientsGeneratorOutput,
    KotlinOkHttp3ClientsGeneratorConfig,
    KotlinOkHttp3ClientGeneratorOutput
  >
  & {
    infrastructurePackageName: string;
    refs: ReturnType<typeof getReferenceFactories>;
  };

export type KotlinOkHttp3ClientGeneratorContext = KotlinOkHttp3ClientsGeneratorContext & {
  service: ApiService;
};
