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

/**
 * The configuration of the `KotlinOkHttp3ClientsGenerator`. It extends the common Kotlin generator configuration with
 * the client-specific options declared below.
 *
 * Of the common options, `typeNameCasing` names the client classes, `functionNameCasing` names the endpoint methods,
 * `parameterNameCasing` names their parameters, `includeSourceInDocs` adds the source path to the endpoint docs, and
 * `springBootVersion` selects the Jackson packages in the infrastructure files.
 * @see defaultKotlinOkHttp3ClientsGeneratorConfig
 */
export type KotlinOkHttp3ClientsGeneratorConfig = KotlinGeneratorConfig & {
  /**
   * The base package name for the generated client classes.
   * Each client file is placed in `{outputDir}/{packagePath}`, where `packagePath` is `packageName` followed by
   * `packageSuffix`, with the dots replaced by slashes. The same package is written as the `package` declaration.
   * @default 'com.openapi.generated'
   */
  packageName: string;

  /**
   * The suffix appended to `packageName` for the generated client classes. Include the leading `.`, because the suffix
   * is appended as written. A function receives the service and returns the suffix for it, so each service can be
   * placed in its own package. The infrastructure package also uses the suffix when `infrastructurePackageName` is in
   * `append-full-package-name` mode, and then the function is called without a service.
   * @default '.api.client'
   */
  packageSuffix: string | ((service?: ApiService) => string);

  /**
   * The package of the shared infrastructure files, such as `ApiClient`, `ApiResponse` and `Serializer`. The files are
   * written to `{outputDir}/{infrastructurePackagePath}`, and the client classes refer to their types by this package.
   * - A string is used as the package name as written.
   * - `{ mode: 'append-package-name', value }` appends `value` to `packageName`.
   * - `{ mode: 'append-full-package-name', value }` appends `value` to `packageName` followed by `packageSuffix`.
   * - `{ mode: 'replace', value }` uses `value` as written.
   * @default { mode: 'append-full-package-name', value: '.infrastructure' }
   */
  infrastructurePackageName:
    | string
    | { mode: 'append-package-name' | 'append-full-package-name' | 'replace'; value: string };

  /**
   * The base path that the generated clients use as the prefix of every request URL. It is the fallback of the
   * `defaultBasePath` property in each client's companion object, which the system property named by
   * `ApiClient.baseUrlKey` overrides at runtime.
   * - A string replaces the base path as written.
   * - A RegExp replaces the base path with the text it matches, and keeps the base path when nothing matches.
   * - A function receives the base path and the service, and returns the new base path.
   * @default The URL of the first server in the source OpenAPI document, or `'/'` when it defines none.
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);

  /**
   * Changes the path of each endpoint before its request URL is built. The `{name}` placeholders of path parameters
   * must remain in the modified path, because the path parameters are substituted into them afterwards.
   * - A string replaces the path as written.
   * - A RegExp replaces the path with the text it matches, and keeps the path when nothing matches.
   * - A function receives the path and the endpoint, and returns the new path.
   * @default undefined, so the endpoint path is used as written.
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  /**
   * The Jackson inclusion rule of the default `Serializer` object, which decides which null or empty values are left
   * out of the serialized JSON. The value becomes a `JsonInclude.Include` constant in upper snake case, so
   * `non-absent` becomes `NON_ABSENT`. It only applies to the default factory of a `'static'` serializer. It has no
   * effect when `serializer` is `'parameter'`, or when it provides its own factory.
   * @default 'non-absent'
   */
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

/**
 * The default configuration of the `KotlinOkHttp3ClientsGenerator`. It is merged with the common Kotlin defaults from
 * `defaultKotlinGeneratorConfig`, and the options passed to the generator are merged on top of these.
 * @see KotlinOkHttp3ClientsGeneratorConfig
 */
export const defaultKotlinOkHttp3ClientsGeneratorConfig: DefaultGenerationProviderConfig<KotlinOkHttp3ClientsGeneratorConfig> =
  {
    ...defaultKotlinGeneratorConfig,

    packageName: 'com.openapi.generated',
    packageSuffix: '.api.client',
    infrastructurePackageName: { mode: 'append-full-package-name', value: '.infrastructure' },
    serializerJsonInclude: 'non-absent',
    serializer: 'static',
  };

/**
 * The input of the `KotlinOkHttp3ClientsGenerator`, which is the output of the `KotlinModelsGenerator`. The client
 * methods use the model types it publishes under `kotlin.models` for their parameter and response types.
 */
export type KotlinOkHttp3ClientsGeneratorInput = KotlinModelsGeneratorOutput;

/**
 * The output of the `KotlinOkHttp3ClientsGenerator`. Later generators read the generated clients from `kotlin.clients`.
 */
export type KotlinOkHttp3ClientsGeneratorOutput = {
  /** The Kotlin results of the generator. */
  kotlin: {
    /** The generated client classes, keyed by service id. Each entry holds the type name and package of its client. */
    clients: {
      [serviceId: string]: KotlinOkHttp3ClientGeneratorOutput;
    };
  };
};

/**
 * The result of generating the client for one service: the name and package of the generated client class. It is the
 * entry stored under `kotlin.clients[serviceId]`.
 */
export type KotlinOkHttp3ClientGeneratorOutput = KotlinImport;

/**
 * The context of the `KotlinOkHttp3ClientsGenerator`. It extends the services generation context with the resolved
 * infrastructure package name and the reference factories for the infrastructure types.
 */
export type KotlinOkHttp3ClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinOkHttp3ClientsGeneratorInput,
  KotlinOkHttp3ClientsGeneratorOutput,
  KotlinOkHttp3ClientsGeneratorConfig,
  KotlinOkHttp3ClientGeneratorOutput
> & {
  /** The package of the shared infrastructure files, resolved from `infrastructurePackageName`. */
  infrastructurePackageName: string;
  /** The reference factories for the types in the infrastructure package, from `getReferenceFactories`. */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context of the `DefaultKotlinOkHttp3Generator` for one service. It extends the clients context with the service.
 */
export type KotlinOkHttp3ClientGeneratorContext = KotlinOkHttp3ClientsGeneratorContext & {
  /** The service to generate the client class for, with its endpoints. */
  service: ApiService;
};
