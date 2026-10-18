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

export type CSharpMinimalApisGeneratorConfig = CSharpServerGeneratorConfig & {
  /**
   * The directory (relative to `outputDir`) the minimal API files are written to.
   * @default 'MinimalApis'
   */
  minimalApisDir: string;
};

export const defaultCSharpMinimalApisGeneratorConfig: DefaultGenerationProviderConfig<CSharpMinimalApisGeneratorConfig> =
  {
    ...defaultCSharpServerGeneratorConfig,

    namespaceSuffix: '.MinimalApis',
    minimalApisDir: 'MinimalApis',
  };

export type CSharpMinimalApisGeneratorInput = CSharpServerGeneratorInput;

export type CSharpMinimalApisGeneratorOutput = {
  csharp: {
    minimalApis: {
      [serviceId: string]: CSharpMinimalApiGeneratorOutput;
    };
  };
};

export type CSharpMinimalApiGeneratorOutput = {
  /** The abstract API class of the service, which declares the handler methods. */
  api: cs.Reference<SourceBuilder>;
  /** The static class with the `Map<Tag>Api` extension method of the service. */
  extensions: cs.Reference<SourceBuilder>;
  /** The result type of every endpoint of the service, by endpoint id. */
  results: { [endpointId: string]: cs.Reference<SourceBuilder> };
};

export type CSharpMinimalApisGeneratorContext = OpenApiServicesGenerationProviderContext<
  CSharpMinimalApisGeneratorInput,
  CSharpMinimalApisGeneratorOutput,
  CSharpMinimalApisGeneratorConfig,
  CSharpMinimalApiGeneratorOutput
>;

export type CSharpMinimalApiGeneratorContext = CSharpMinimalApisGeneratorContext & {
  service: ApiService;
};
