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

export type KotlinServicesGeneratorConfig = KotlinGeneratorConfig & {
  packageName: string;
  packageSuffix: string | ((service: ApiService | null) => string);

  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  addSwaggerAnnotations: boolean;
  addJakartaValidationAnnotations: boolean;
  arrayType: 'list' | 'flux';

  strictResponseEntities: boolean;
  defaultStatusCodes: number[];
};

export const defaultKotlinServicesGeneratorConfig: DefaultGenerationProviderConfig<KotlinServicesGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api',

  addSwaggerAnnotations: true,
  addJakartaValidationAnnotations: true,
  arrayType: 'flux',

  strictResponseEntities: false,
  defaultStatusCodes: [400, 401, 403, 500, 501],
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

export type KotlinServicesGeneratorContext =
  & OpenApiServicesGenerationProviderContext<
    KotlinServicesGeneratorInput,
    KotlinServicesGeneratorOutput,
    KotlinServicesGeneratorConfig,
    KotlinServiceGeneratorOutput
  >
  & {
    refs: ReturnType<typeof getReferenceFactories>;
  };

export type KotlinServiceGeneratorContext = KotlinServicesGeneratorContext & {
  service: ApiService;
};
