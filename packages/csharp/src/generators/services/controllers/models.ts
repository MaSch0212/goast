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

export type CSharpControllersGeneratorConfig = CSharpServerGeneratorConfig & {
  /**
   * The directory (relative to `outputDir`) the controller files are written to.
   * @default 'Controllers'
   */
  controllersDir: string;
};

export const defaultCSharpControllersGeneratorConfig: DefaultGenerationProviderConfig<CSharpControllersGeneratorConfig> =
  {
    ...defaultCSharpServerGeneratorConfig,

    namespaceSuffix: '.Controllers',
    controllersDir: 'Controllers',
  };

export type CSharpControllersGeneratorInput = CSharpServerGeneratorInput;

export type CSharpControllersGeneratorOutput = {
  csharp: {
    controllers: {
      [serviceId: string]: CSharpControllerGeneratorOutput;
    };
  };
};

export type CSharpControllerGeneratorOutput = {
  /** The abstract controller of the service. */
  controller: cs.Reference<SourceBuilder>;
  /** The result type of every endpoint of the service, by endpoint id. */
  results: { [endpointId: string]: cs.Reference<SourceBuilder> };
};

export type CSharpControllersGeneratorContext = OpenApiServicesGenerationProviderContext<
  CSharpControllersGeneratorInput,
  CSharpControllersGeneratorOutput,
  CSharpControllersGeneratorConfig,
  CSharpControllerGeneratorOutput
>;

export type CSharpControllerGeneratorContext = CSharpControllersGeneratorContext & {
  service: ApiService;
};
