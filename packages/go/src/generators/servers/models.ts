import type {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
  SourceBuilder,
} from '@goast/core';

import type { go } from '../../ast/index.ts';
import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import type { GoPackageInfo } from '../file-generator.ts';
import type { GoModelsGeneratorOutput } from '../models/index.ts';
import type { GoOperation } from './operation.ts';

export type GoServersGeneratorConfig = GoGeneratorConfig & {
  /**
   * The directory of the package for the servers, relative to the output directory and to `modulePath`. When it
   * differs from the package of the models, the servers import the models.
   * @default 'api'
   */
  packagePath: string;

  /**
   * The name of the package for the servers. Derived from the last segment of `packagePath` if not set.
   */
  packageName?: string;

  /**
   * The path prepended to the path of every operation by default (`ServerOptions.BasePath`). By default it is the
   * path of the first server URL of the API description. A string replaces it, a regular expression picks the
   * matching part of it, and a function computes it from it.
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);

  /** Changes the path of an operation before it becomes a route pattern. */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

export const defaultGoServersGeneratorConfig: DefaultGenerationProviderConfig<GoServersGeneratorConfig> = {
  ...defaultGoGeneratorConfig,

  packagePath: 'api',
};

export type GoServersGeneratorInput = GoModelsGeneratorOutput;

export type GoServersGeneratorOutput = {
  go: {
    servers: {
      [serviceId: string]: GoServerGeneratorOutput;
    };
  };
};

export type GoServerGeneratorOutput = {
  /** The interface the service has to implement. */
  serviceInterface: go.Reference<SourceBuilder>;
  /** The function that registers the handlers of the service on a `*http.ServeMux`. */
  registerFunction: go.Reference<SourceBuilder>;
};

/**
 * The names of the top-level identifiers of the server runtime (e.g. `ServerOptions`) in the package, by their name
 * in the runtime. An exported identifier is renamed if the package already declares it (e.g. a schema `ServerOption`).
 */
export type GoServerRuntimeNames = Record<string, string>;

export type GoServersGeneratorContext = OpenApiServicesGenerationProviderContext<
  GoServersGeneratorInput,
  GoServersGeneratorOutput,
  GoServersGeneratorConfig,
  GoServerGeneratorOutput
> & {
  /** The package the servers are generated into. */
  package: GoPackageInfo;
  /** The names of the exported identifiers of the server runtime in the package. */
  runtimeNames: GoServerRuntimeNames;
  /**
   * The operations by endpoint id. An endpoint with several tags belongs to several services, but its types are
   * declared once, by the first service.
   */
  operations: Map<string, GoOperation>;
};

export type GoServerGeneratorContext = GoServersGeneratorContext & {
  service: ApiService;
};
