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
 * The configuration of the spring controllers generator. It extends `KotlinGeneratorConfig`, so the common Kotlin
 * options apply as well. This generator reads `typeNameCasing` (interface, controller, delegate and response
 * entity names),
 * `parameterNameCasing` (parameter names), `functionNameCasing` (functions and status code factories),
 * `propertyNameCasing` (the base path property prefix), `constantNameCasing` (path constants), `includeSourceInDocs`
 * (endpoint docs) and `globalImports` (imports).
 *
 * `springBootVersion` (`KotlinGeneratorConfig`, `@default 3`) changes this generator's output in these places only:
 * - `3`: the `T` of a response entity class has no bound, its body parameter is non-null, and the status code factories
 *   without a body take `Unit?`. Responses whose body types differ resolve to `Any?`.
 * - `4`: the `T` of a response entity class is bounded by `Any`, its body parameter is `T?`, the status code factories
 *   without a body take `Unit`, and responses whose body types differ resolve to `Any`. This matches the non-null
 *   `ResponseEntity<T : Any>` bound of Spring Framework 7.
 * The Spring types it references come from the same packages for both values, so the imports do not change.
 * @see KotlinGeneratorConfig
 */
export type KotlinServicesGeneratorConfig = KotlinGeneratorConfig & {
  /**
   * The base package name. Combined with `packageSuffix`, it gives the package of each service's files and of the
   * shared `ApiExceptionHandler`.
   * @default 'com.openapi.generated'
   */
  packageName: string;
  /**
   * The suffix appended to `packageName`, including the leading `.`. A function receives each service and returns the
   * suffix for that service's files. It receives `null` when `ApiExceptionHandler` is placed, because no service is in
   * scope there.
   * @default '.api'
   */
  packageSuffix: string | ((service: ApiService | null) => string);

  /**
   * The base path of each service. It becomes the default of the `${...base-path:...}` placeholder in the
   * `@RequestMapping` annotations, so Spring can still override it with a property. A string replaces the base path
   * verbatim. A regular expression is matched against the base path, and its first match replaces it; without a match
   * the base path is kept. A function receives the base path and the service and returns the new base path. When not
   * set, the first server URL of the service's document is used, or `/` when there is none.
   * @default undefined
   */
  basePath?: string | RegExp | ((basePath: string, service: ApiService) => string);
  /**
   * Rewrites the path of each endpoint before it is written to the path constants of the API interface. A regular
   * expression is matched against the path, and its first match replaces the whole path; without a match the path is
   * kept. A function receives the path and the endpoint and returns the new path.
   * @default undefined
   */
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  /**
   * Whether the API interface gets Swagger annotations: `@Operation`, `@ApiResponses` and `@Parameter` on its functions
   * and parameters, plus the `@Schema` annotations of parameters. Controllers and delegates get none of them.
   * @default true
   */
  addSwaggerAnnotations: boolean;
  /**
   * Whether Jakarta annotations are added. `@Valid` goes on each parameter whose type is not from
   * the `kotlin` or `java` packages, and `@Generated` goes on the controller and the delegate interface.
   * @default true
   */
  addJakartaValidationAnnotations: boolean;
  /**
   * How array types are written for request bodies and response bodies. `'flux'` writes them as `Flux<T>`, and `'list'`
   * keeps them as `List<T>`. Query, path and header parameters are not affected.
   * @default 'flux'
   */
  arrayType: 'list' | 'flux';
  /**
   * Whether the endpoint functions of the API interface and the delegate, and `handleApiException` of
   * `ApiExceptionHandler`, are written with the `suspend` modifier.
   * @default true
   */
  suspendingFunctions: boolean;

  /**
   * Whether each endpoint gets its own `{Endpoint}_ResponseEntity` class, nested in the API interface. The delegate
   * function of that endpoint then returns this class, and its default body is the 501 entity of the class. The
   * endpoint's `strict-response` custom property overrides this setting per endpoint.
   * @default false
   */
  strictResponseEntities: boolean;
  /**
   * The status codes that get a static factory function in each `{Endpoint}_ResponseEntity` class, named after their
   * reason phrase, such as `badRequest`. Code 501 is always added, as are the codes of the endpoint's own responses.
   * Only used when response entity classes are generated, see `strictResponseEntities`.
   * @default [400, 401, 403, 500, 501]
   */
  defaultStatusCodes: number[];
};

/**
 * The default configuration of the spring controllers generator. It extends `defaultKotlinGeneratorConfig`.
 * @see KotlinServicesGeneratorConfig
 */
export const defaultKotlinServicesGeneratorConfig: DefaultGenerationProviderConfig<KotlinServicesGeneratorConfig> = {
  ...defaultKotlinGeneratorConfig,

  packageName: 'com.openapi.generated',
  packageSuffix: '.api',

  addSwaggerAnnotations: true,
  addJakartaValidationAnnotations: true,
  arrayType: 'flux',
  suspendingFunctions: true,

  strictResponseEntities: false,
  defaultStatusCodes: [400, 401, 403, 500, 501],
};

/**
 * The input of the spring controllers generator, which is the output of the models generator. The type of each request
 * and response body is looked up in its `kotlin.models` output.
 * @see KotlinModelsGeneratorOutput
 */
export type KotlinServicesGeneratorInput = KotlinModelsGeneratorOutput;

/**
 * The output of the spring controllers generator, which later generators read from `kotlin.services`.
 * @see KotlinServiceGeneratorOutput
 */
export type KotlinServicesGeneratorOutput = {
  /**
   * The Kotlin output, under which the spring controllers generator publishes `services`.
   */
  kotlin: {
    /**
     * The generated files of each service, keyed by the service id (`ApiService.id`).
     */
    services: {
      [serviceId: string]: KotlinServiceGeneratorOutput;
    };
  };
};

/**
 * The files written for one service. Each entry gives the type name and package of one generated file.
 */
export type KotlinServiceGeneratorOutput = {
  /**
   * The API interface, named after the service with an `_Api` suffix.
   */
  apiInterface: KotlinImport;
  /**
   * The controller class, which implements the API interface and forwards each call to the delegate.
   */
  apiController: KotlinImport;
  /**
   * The delegate interface, which has one function per endpoint for the implementation to override.
   */
  apiDelegate: KotlinImport;
};

/**
 * The context of the spring controllers generator for all services.
 * @see KotlinServicesGeneratorConfig
 */
export type KotlinServicesGeneratorContext = OpenApiServicesGenerationProviderContext<
  KotlinServicesGeneratorInput,
  KotlinServicesGeneratorOutput,
  KotlinServicesGeneratorConfig,
  KotlinServiceGeneratorOutput
> & {
  /**
   * The factories for the references to the shared types, created from the configuration.
   * @see getReferenceFactories
   */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context of the spring controllers generator for one service.
 * @see KotlinServicesGeneratorContext
 */
export type KotlinServiceGeneratorContext = KotlinServicesGeneratorContext & {
  /**
   * The service whose files are generated.
   */
  service: ApiService;
};
