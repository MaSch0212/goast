import type {
  ApiEndpoint,
  ApiSchema,
  ApiService,
  DefaultGenerationProviderConfig,
  ExtendedStringCasing,
  Nullable,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { ts } from '../../../ast/index.ts';
import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../../config.ts';
import type { TypeScriptFileBuilder } from '../../../file-builder.ts';
import type { TypeScriptModelGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

export type TypeScriptAngularServicesGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * How the services should be provided in the Angular application.
   * - `root` - provides all the services using `Injectable({ providedIn: 'root' })`
   * - `provide-fn` - generates a function `provideApiClients` that provides the services
   * @default 'root'
   */
  provideKind: 'root' | 'provide-fn';

  /**
   * The domain name of the API. Used as a prefix for exported components (e.g. `ApiConfiguration`).
   * @default undefined
   */
  domainName: Nullable<string>;

  /**
   * Whether to use strict response types for the services.
   * If enabled only the status codes are included that are defined in the OpenAPI specification or the `defaultStatusCodeResponseTypes` option.
   * @default true
   */
  strictResponseTypes: boolean;

  /**
   * The default response types for status codes that are not defined in the OpenAPI specification.
   * @example
   * {
   *   400: {
   *     parser: 'json',
   *     type: schemas =>
   *       schemas.find(s => s.name === 'BadRequestResponse')
   *         ?? throwExp('BadRequestResponse not found'),
   *   },
   *   404: null,
   *   500: {
   *     parser: 'json',
   *     type: ts.refs.any(),
   *   },
   * }
   * @default
   * {
   *   401: null,
   *   403: null,
   *   500: null,
   * }
   */
  defaultStatusCodeResponseTypes: Record<
    number,
    {
      parser: 'text' | 'json';
      // deno-lint-ignore ban-types
      type: Exclude<ts.Type<TypeScriptFileBuilder>, Function> | ((schemas: readonly ApiSchema[]) => ApiSchema);
    } | null
  >;

  /**
   * The default content type which is used for the request. If not defined the first one defined in the OpenApi specification is used.
   * @default undefined
   */
  defaultRequestContentType: Nullable<string>;

  /**
   * The default content type which is used for the success response. If not defined the first one defined in the OpenApi specification is used.
   * @default undefined
   */
  defaultSuccessResponseContentType: Nullable<string>;

  /**
   * The possible status codes that any API endpoint can return.
   * This is only used when `strictResponseTypes` is set to `false`.
   * @default
   * [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
   */
  possibleStatusCodes: number[];

  /**
   * Explicitly set the root URL of the API. If `undefined`, the root URL is taken from the first `server` in the OpenAPI specification.
   * @default undefined
   */
  rootUrl: Nullable<string | RegExp | ((rootUrl: string) => string)>;

  /**
   * Modifier that is applied to the path of each endpoint.
   * @default undefined
   */
  pathModifier: Nullable<RegExp | ((path: string, endpoint: ApiEndpoint) => string)>;

  /**
   * The directory where the services should be saved. The path is relative to the output directory.
   * @default 'services'
   */
  servicesDir: string;

  /**
   * The casing of the file names for the services. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '.service' }
   */
  serviceFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The path to the index file where all services should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'services.ts'
   */
  servicesIndexFile: Nullable<string>;

  /**
   * The directory where the response models should be saved. The path is relative to the output directory.
   * @default 'models/responses'
   */
  responseModelsDir: string;

  /**
   * The casing of the file names for the response models. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-responses.model' }
   */
  responseModelFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The path to the index file where all response models should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'responses.ts'
   */
  responseModelsIndexFile: Nullable<string>;

  /**
   * The directory where the utilies should be saved. The path is relative to the output directory.
   * @default 'utils'
   */
  utilsDir: string;
};

export const defaultTypeScriptAngularServicesGeneratorConfig: DefaultGenerationProviderConfig<
  TypeScriptAngularServicesGeneratorConfig
> = {
  ...defaultTypeScriptGeneratorConfig,

  provideKind: 'provide-fn',
  domainName: undefined,
  strictResponseTypes: true,
  defaultStatusCodeResponseTypes: {
    401: null,
    403: null,
    500: null,
  },
  defaultSuccessResponseContentType: undefined,
  possibleStatusCodes: [
    100,
    101,
    102,
    103,
    200,
    201,
    202,
    203,
    204,
    205,
    206,
    207,
    208,
    226,
    300,
    301,
    302,
    303,
    304,
    305,
    306,
    307,
    308,
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    408,
    409,
    410,
    411,
    412,
    413,
    414,
    415,
    416,
    417,
    421,
    422,
    423,
    424,
    425,
    426,
    428,
    429,
    431,
    451,
    500,
    501,
    502,
    503,
    504,
    505,
    506,
    507,
    508,
    510,
    511,
  ],
  rootUrl: undefined,
  pathModifier: undefined,

  servicesDir: 'services',
  serviceFileNameCasing: { casing: 'kebab', suffix: '.service' },
  servicesIndexFile: 'services.ts',
  responseModelsDir: 'models/responses',
  responseModelFileNameCasing: { casing: 'kebab', suffix: '-responses.model' },
  responseModelsIndexFile: 'responses.ts',
  utilsDir: 'utils',
};

export type TypeScriptAngularServicesGeneratorInput = {
  typescript: {
    models: {
      [schemaId: string]: TypeScriptModelGeneratorOutput;
    };
  };
};

export type TypeScriptAngularServicesGeneratorOutput = {
  typescript: {
    services: {
      [serviceId: string]: TypeScriptAngularServiceGeneratorOutput;
    };
    indexFiles: {
      services: Nullable<string>;
      responseModels: Nullable<string>;
    };
  };
};

export type TypeScriptAngularServiceGeneratorOutput = TypeScriptExportOutput & {
  responseModels: {
    [operationId: string]: TypeScriptExportOutput;
  };
};

export type TypeScriptAngularServicesGeneratorContext =
  & OpenApiServicesGenerationProviderContext<
    TypeScriptAngularServicesGeneratorInput,
    TypeScriptAngularServicesGeneratorOutput,
    TypeScriptAngularServicesGeneratorConfig,
    TypeScriptAngularServiceGeneratorOutput
  >
  & {
    refs: ReturnType<typeof getReferenceFactories>;
  };

export type TypeScriptAngularServiceGeneratorContext = TypeScriptAngularServicesGeneratorContext & {
  readonly service: ApiService;
};
