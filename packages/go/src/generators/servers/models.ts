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

/**
 * The configuration of the servers generator. It extends `GoGeneratorConfig`, so the common Go options apply to the
 * servers as well:
 * - `modulePath`: the import path of the servers is `modulePath` followed by `packagePath`. The servers import the
 *   models by it when both are generated into different packages.
 * - `initialisms`: applied to the exported names the servers declare, such as the service interface, the request and
 *   response types, and the fields of the requests (e.g. `PetID`).
 * - `addGeneratedHeader`: whether each service file and `server_runtime.go` starts with the `DO NOT EDIT` header.
 * - `includeSourceInDocs`: whether the doc comment of each operation method ends with the path of the source document.
 * - `outputDir`: the directory the files are written to. The servers go into `{outputDir}/{packagePath}`.
 * - `clearOutputDir`: whether the output directory is cleared before the files are written. It applies to the whole
 *   run, not only to the servers.
 * - `indent`: the indentation of the generated code. Go formats with tabs, which is the default.
 * - `newLine`: the line ending of the generated files.
 * @see GoGeneratorConfig
 */
export type GoServersGeneratorConfig = GoGeneratorConfig & {
  /**
   * The directory of the package for the servers, relative to the output directory and to `modulePath`. When it
   * differs from the package of the models, the servers import the models.
   * @default 'api'
   */
  packagePath: string;

  /**
   * The name of the package for the servers. Derived from the last segment of `packagePath` (or from `modulePath` when
   * `packagePath` is empty) if not set.
   * @default undefined
   */
  packageName?: string;

  /**
   * The path prepended to the path of every operation by default (`ServerOptions.BasePath`). By default it is the
   * path of the first server URL of the API description, or `/` when there is none. A string replaces it, a regular
   * expression picks the matching part of it (the path is kept when nothing matches), and a function computes it from
   * it and the service. Whatever the result is, the scheme and host are removed from it and trailing slashes are
   * dropped. A path that still contains a server variable (`{...}`) becomes empty. The register functions take a
   * `ServerOption` (e.g. `WithBasePath`) to change it at runtime.
   * @default undefined
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);

  /**
   * Rewrites the path of each operation before it becomes a route pattern. A regular expression is matched against the
   * path, and its first match replaces the whole path; without a match the path is kept. A function receives the path
   * and the endpoint and returns the new path. Without a value the path is used as it is. The base path is not
   * affected.
   * @default undefined
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

/**
 * The default configuration of the servers generator. It extends `defaultGoGeneratorConfig`.
 * @see GoServersGeneratorConfig
 */
export const defaultGoServersGeneratorConfig: DefaultGenerationProviderConfig<GoServersGeneratorConfig> = {
  ...defaultGoGeneratorConfig,

  packagePath: 'api',
};

/**
 * The input of the servers generator, which is the output of the models generator. The types of the request and
 * response bodies and of the parameters are the models it declares.
 * @see GoModelsGeneratorOutput
 */
export type GoServersGeneratorInput = GoModelsGeneratorOutput;

/**
 * The output of the servers generator, under which it publishes `go.servers`.
 * @see GoServerGeneratorOutput
 */
export type GoServersGeneratorOutput = {
  go: {
    /** The generated files of each service, keyed by the service id (`ApiService.id`). */
    servers: {
      [serviceId: string]: GoServerGeneratorOutput;
    };
  };
};

/**
 * The result of one service: the interface to implement and the function that registers its operations. Both are
 * references, so other generators can refer to them.
 */
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

/**
 * The context of the servers generator, which is shared by the generators of all services.
 * @see GoServerGeneratorContext
 */
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

/**
 * The context of the generator of one service: the context of the servers generator plus the service.
 * @see GoServersGeneratorContext
 */
export type GoServerGeneratorContext = GoServersGeneratorContext & {
  /** The service (tag) to generate the interface, the operations and the register function for. */
  service: ApiService;
};
