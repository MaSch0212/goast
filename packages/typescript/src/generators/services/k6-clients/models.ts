import type {
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
import type { TypeScriptModelsGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

export type TypeScriptK6ClientsGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * The language of the generated clients.
   * @default 'javascript'
   */
  language: 'javascript' | 'typescript';

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
   * The possible status codes that any API endpoint can return.
   * This is only used when `strictResponseTypes` is set to `false`.
   * @default
   * [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
   */
  possibleStatusCodes: number[];

  /**
   * The casing of the client file names. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-client' }
   */
  clientFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the file names for the response models. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-responses' }
   */
  responseModelFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the client names. If nullish, the `typeNameCasing` is used.
   * @default { casing: 'pascal', suffix: 'Client' }
   */
  clientNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The directory where the client files should be saved. The path is relative to the output directory.
   * @default 'clients'
   */
  clientDir: string;

  /**
   * The directory where the response models should be saved. The path is relative to the output directory.
   * @default 'models/responses'
   */
  responseModelsDir: string;

  /**
   * The index file where all clients should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'clients.ts'
   */
  clientsIndexFile: Nullable<string>;

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

  /**
   * Whether to generate clients calling the async API of k6.
   * @default true
   */
  async: boolean;
};

export const defaultTypeScriptK6ClientsGeneratorConfig: DefaultGenerationProviderConfig<
  TypeScriptK6ClientsGeneratorConfig
> = {
  ...defaultTypeScriptGeneratorConfig,

  language: 'javascript',
  strictResponseTypes: true,
  defaultStatusCodeResponseTypes: {
    401: null,
    403: null,
    500: null,
  },
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

  clientFileNameCasing: { casing: 'kebab', suffix: '-client' },
  responseModelFileNameCasing: { casing: 'kebab', suffix: '-responses' },
  clientNameCasing: { casing: 'pascal', suffix: 'Client' },
  clientDir: 'clients',
  responseModelsDir: 'models/responses',
  clientsIndexFile: 'clients.js',
  responseModelsIndexFile: 'responses.ts',
  utilsDir: 'utils',
  async: true,
};

export type TypeScriptK6ClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptK6ClientsGeneratorOutput = {
  typescript: {
    k6Clients: {
      [serviceId: string]: TypeScriptK6ClientGeneratorOutput;
    };
    indexFiles: {
      k6Clients: Nullable<string>;
      k6ResponseModels: Nullable<string>;
    };
  };
};

export type TypeScriptK6ClientGeneratorOutput = TypeScriptExportOutput & {
  responseModels: {
    [operationId: string]: TypeScriptExportOutput;
  };
};

export type TypeScriptK6ClientsGeneratorContext =
  & OpenApiServicesGenerationProviderContext<
    TypeScriptK6ClientsGeneratorInput,
    TypeScriptK6ClientsGeneratorOutput,
    TypeScriptK6ClientsGeneratorConfig,
    TypeScriptK6ClientGeneratorOutput
  >
  & {
    refs: ReturnType<typeof getReferenceFactories>;
  };

export type TypeScriptK6ClientGeneratorContext = TypeScriptK6ClientsGeneratorContext & {
  readonly service: ApiService;
};
