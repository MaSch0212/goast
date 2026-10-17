import type {
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import type { cs } from '../../../ast/index.ts';
import {
  type CSharpServerGeneratorConfig,
  type CSharpServerGeneratorInput,
  defaultCSharpServerGeneratorConfig,
} from '../shared/server-config.ts';

export type CSharpFastEndpointsGeneratorConfig = CSharpServerGeneratorConfig & {
  /**
   * The directory (relative to `outputDir`) the endpoint files are written to.
   * @default 'FastEndpoints'
   */
  fastEndpointsDir: string;
};

export const defaultCSharpFastEndpointsGeneratorConfig: DefaultGenerationProviderConfig<CSharpFastEndpointsGeneratorConfig> =
  {
    ...defaultCSharpServerGeneratorConfig,

    namespaceSuffix: '.FastEndpoints',
    fastEndpointsDir: 'FastEndpoints',
  };

export type CSharpFastEndpointsGeneratorInput = CSharpServerGeneratorInput;

export type CSharpFastEndpointsGeneratorOutput = {
  csharp: {
    fastEndpoints: {
      [serviceId: string]: CSharpFastEndpointGeneratorOutput;
    };
  };
};

export type CSharpFastEndpointGeneratorOutput = {
  /** The abstract endpoint class of every endpoint of the service, by endpoint id. */
  endpoints: { [endpointId: string]: cs.Reference<SourceBuilder> };
  /** The result type of every endpoint of the service, by endpoint id. */
  results: { [endpointId: string]: cs.Reference<SourceBuilder> };
};

export type CSharpFastEndpointsGeneratorContext = OpenApiServicesGenerationProviderContext<
  CSharpFastEndpointsGeneratorInput,
  CSharpFastEndpointsGeneratorOutput,
  CSharpFastEndpointsGeneratorConfig,
  CSharpFastEndpointGeneratorOutput
>;

export type CSharpFastEndpointGeneratorContext = CSharpFastEndpointsGeneratorContext & {
  service: ApiService;
};
