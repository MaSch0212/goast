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

/**
 * The configuration of the `KotlinSpringReactiveWebClientsGenerator`. Extends the common Kotlin generator options
 * (`outputDir`, the casing options, `globalImports` and so on) with the options below.
 *
 * `springBootVersion` is inherited but has no effect on this generator, because the generated WebFlux client
 * references no Spring Boot version specific type.
 */
export type KotlinSpringReactiveWebClientsGeneratorConfig = KotlinGeneratorConfig & {
  /**
   * The base package name of the generated client files. Each service's requests object is placed in the package
   * `packageName + packageSuffix`, and the default infrastructure package is derived from it.
   * @default 'com.openapi.generated'
   */
  packageName: string;
  /**
   * The suffix appended to `packageName`, including the leading `.`. Together they form the package of each service's
   * requests object, which is written to the matching directory under `{outputDir}`. A function receives the service,
   * so each service can get its own package.
   * @default '.api.client'
   */
  packageSuffix: string | ((service?: ApiService) => string);
  /**
   * The package of the shared `ApiRequestFile` helper, which clients import for file parameters. A string is used as
   * written. An object is resolved by its `mode`:
   * - `append-package-name`: `packageName` followed by `value`.
   * - `append-full-package-name`: `packageName` and `packageSuffix` followed by `value`.
   * - `replace`: `value` as written.
   *
   * The helper is written to `{outputDir}/{package path}/ApiRequestFile.kt`. With a function-valued `packageSuffix`,
   * the `append-full-package-name` mode calls it without a service.
   * @default { mode: 'append-full-package-name', value: '.infrastructure' }, which resolves to
   * 'com.openapi.generated.api.client.infrastructure'.
   */
  infrastructurePackageName:
    | string
    | { mode: 'append-package-name' | 'append-full-package-name' | 'replace'; value: string };

  /**
   * Has no effect on this generator. The request URIs are relative to the `WebClient` the caller passes in, which
   * supplies the base URL, so no base path is written into the generated Kotlin code.
   * @default undefined
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  /**
   * Rewrites each endpoint path before it is written into the URI template passed to `WebClient.uri` and into the
   * `<endpoint>Uri` helper. A function receives the path without its leading slashes and the endpoint, and returns the
   * new path. A `RegExp` replaces the path with its first match, or keeps the path when nothing matches.
   * @default undefined
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);
  /**
   * Has no effect on this generator. Only the OkHttp3 client generator reads it, to configure the serializer it emits.
   * This generator emits no serializer, so its output does not depend on this value.
   * @default 'non-absent'
   */
  serializerJsonInclude: 'always' | 'non-null' | 'non-absent' | 'non-default' | 'non-empty' | 'use-defaults';

  /**
   * Whether the generated request functions pass the URI template (e.g. `pets/{id}`) to `WebClient` instead of an
   * already expanded URI string. Only with the template does Spring populate
   * `ClientRequestObservationContext.uriTemplate`, which keeps the `uri` tag of `http.client.requests` bounded by the
   * number of endpoints instead of by the number of distinct path parameter values.
   *
   * Note that path parameter values are then encoded as URI variables, i.e. reserved characters (`/`, `?`, `#`, `%`)
   * inside a value are percent-encoded. Values consisting of unreserved characters are unaffected, so for those the
   * request is byte-identical to the expanded form.
   *
   * The `<endpoint>Uri(...)` helper functions are generated either way.
   * @default true
   */
  preserveUriTemplate: boolean;
};

/**
 * The default configuration of the `KotlinSpringReactiveWebClientsGenerator`. It is merged over the common Kotlin
 * defaults from `defaultKotlinGeneratorConfig`.
 */
export const defaultKotlinSpringReactiveWebClientsGeneratorConfig: DefaultGenerationProviderConfig<KotlinSpringReactiveWebClientsGeneratorConfig> =
  {
    ...defaultKotlinGeneratorConfig,

    packageName: 'com.openapi.generated',
    packageSuffix: '.api.client',
    infrastructurePackageName: { mode: 'append-full-package-name', value: '.infrastructure' },
    serializerJsonInclude: 'non-absent',
    preserveUriTemplate: true,
  };

/**
 * The input of the `KotlinSpringReactiveWebClientsGenerator`: the output of the `KotlinModelsGenerator`. Each parameter
 * and response type is resolved through `kotlin.models`, so the models generator must run before this generator.
 */
export type KotlinSpringReactiveWebClientsGeneratorInput = KotlinModelsGeneratorOutput;

/**
 * The output of the `KotlinSpringReactiveWebClientsGenerator`. It is published under the `kotlin` key, and its
 * `clients` record lets later generators import the requests object of each service.
 */
export type KotlinSpringReactiveWebClientsGeneratorOutput = {
  /**
   * The Kotlin results of this generator.
   */
  kotlin: {
    /**
     * The generated requests objects, keyed by service id.
     */
    clients: {
      [serviceId: string]: KotlinSpringReactiveWebClientGeneratorOutput;
    };
  };
};

/**
 * The output of the `DefaultKotlinSpringReactiveWebClientGenerator` for one service: the name and package of the
 * generated requests object, stored under `kotlin.clients` for the service's id.
 */
export type KotlinSpringReactiveWebClientGeneratorOutput = KotlinImport;

/**
 * The context of the `KotlinSpringReactiveWebClientsGenerator`. It extends the services generation context with the
 * resolved infrastructure package and the reference factories.
 */
export type KotlinSpringReactiveWebClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinSpringReactiveWebClientsGeneratorInput,
  KotlinSpringReactiveWebClientsGeneratorOutput,
  KotlinSpringReactiveWebClientsGeneratorConfig,
  KotlinSpringReactiveWebClientGeneratorOutput
> & {
  /**
   * The resolved package of the shared `ApiRequestFile` helper, as computed from `infrastructurePackageName`.
   */
  infrastructurePackageName: string;
  /**
   * The reference factories this generator uses. `apiRequestFile` references `ApiRequestFile` in the infrastructure
   * package, so the generated code imports it automatically.
   */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context of the `DefaultKotlinSpringReactiveWebClientGenerator`: the services context plus the service to
 * generate a requests object for.
 */
export type KotlinSpringReactiveWebClientGeneratorContext = KotlinSpringReactiveWebClientsGeneratorContext & {
  /**
   * The service whose endpoints are generated into one requests object.
   */
  service: ApiService;
};
