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
import type { GoClientOperation } from './operation.ts';

/**
 * The configuration of the clients generator. It extends `GoGeneratorConfig`, so the common Go options apply to the
 * clients as well:
 * - `modulePath`: the import path of the clients is `modulePath` followed by `packagePath`. The clients import the
 *   models by it when both are generated into different packages, so set it to the import path of your module.
 * - `initialisms`: applied to the exported names the clients declare, such as the client types, their methods and the
 *   fields of the params structs (e.g. `PetID`).
 * - `addGeneratedHeader`: whether each client file and `client_runtime.go` starts with the `DO NOT EDIT` header.
 * - `includeSourceInDocs`: whether the doc comment of each operation method ends with the path of the source document.
 * - `outputDir`: the directory the files are written to. The clients go into `{outputDir}/{packagePath}`.
 * - `clearOutputDir`: whether the output directory is cleared before the files are written. It applies to the whole
 *   run, not only to the clients.
 * - `indent`: the indentation of the generated code. Go formats with tabs, which is the default.
 * - `newLine`: the line ending of the generated files.
 * @see GoGeneratorConfig
 */
export type GoClientsGeneratorConfig = GoGeneratorConfig & {
  /**
   * The directory of the package for the clients, relative to the output directory and to `modulePath`. When it
   * differs from the package of the models, the clients import the models.
   * @default 'client'
   */
  packagePath: string;

  /**
   * The name of the package for the clients. Derived from the last segment of `packagePath` (or from `modulePath` when
   * `packagePath` is empty) if not set.
   * @default undefined
   */
  packageName?: string;

  /**
   * The base URL a client uses when its constructor gets none, which is the constant `{Client}DefaultBaseURL` (e.g.
   * `PetsClientDefaultBaseURL`). By default it is the first server URL of the API description, with its server
   * variables replaced by their default values, or empty when the description has no server. A string replaces it, a
   * regular expression picks the matching part of it (it is kept when nothing matches), and a function computes it from
   * it and the service. A relative result (e.g. `/v1`) is kept as it is. A call whose URL has neither scheme nor host
   * returns an error instead of sending the request.
   * @default undefined
   */
  baseUrl?: string | RegExp | ((baseUrl: string, service: ApiService) => string);

  /**
   * Rewrites the path of each operation before it is appended to the base URL. A regular expression is matched against
   * the path, and its first match replaces the whole path; without a match the path is kept. A function receives the
   * path and the endpoint and returns the new path. Without a value the path is used as it is. It works like the
   * option of the servers generator, so a client and a server generated with the same value agree on the URLs.
   * @default undefined
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
};

/**
 * The default configuration of the clients generator. It extends `defaultGoGeneratorConfig`.
 * @see GoClientsGeneratorConfig
 */
export const defaultGoClientsGeneratorConfig: DefaultGenerationProviderConfig<GoClientsGeneratorConfig> = {
  ...defaultGoGeneratorConfig,

  packagePath: 'client',
};

/**
 * The input of the clients generator, which is the output of the models generator. The types of the request and
 * response bodies and of the parameters are the models it declares.
 * @see GoModelsGeneratorOutput
 */
export type GoClientsGeneratorInput = GoModelsGeneratorOutput;

/**
 * The output of the clients generator, under which it publishes `go.clients`.
 * @see GoClientGeneratorOutput
 */
export type GoClientsGeneratorOutput = {
  go: {
    /** The generated files of each service, keyed by the service id (`ApiService.id`). */
    clients: {
      [serviceId: string]: GoClientGeneratorOutput;
    };
  };
};

/**
 * The result of one service: the client type and its constructor. Both are references, so other generators can refer
 * to them.
 */
export type GoClientGeneratorOutput = {
  /** The type of the client, with a method per operation. */
  client: go.Reference<SourceBuilder>;
  /** The function creating a client. */
  constructor: go.Reference<SourceBuilder>;
};

/**
 * The names of the top-level identifiers of the client runtime (e.g. `ClientOption`) in the package, by their name in
 * the runtime. An exported identifier is renamed if the package already declares it (e.g. a schema `ClientOption`).
 */
export type GoClientRuntimeNames = Record<string, string>;

/**
 * The context of the clients generator, which is shared by the generators of all services.
 * @see GoClientGeneratorContext
 */
export type GoClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  GoClientsGeneratorInput,
  GoClientsGeneratorOutput,
  GoClientsGeneratorConfig,
  GoClientGeneratorOutput
> & {
  /** The package the clients are generated into. */
  package: GoPackageInfo;
  /** The names of the identifiers of the client runtime in the package. */
  runtimeNames: GoClientRuntimeNames;
  /**
   * The operations by endpoint id. An endpoint with several tags belongs to several services, but its params and form
   * types are declared once, by the first service.
   */
  operations: Map<string, GoClientOperation>;
};

/**
 * The context of the generator of one service: the context of the clients generator plus the service.
 * @see GoClientsGeneratorContext
 */
export type GoClientGeneratorContext = GoClientsGeneratorContext & {
  /** The service (tag) to generate the client for. */
  service: ApiService;
};
