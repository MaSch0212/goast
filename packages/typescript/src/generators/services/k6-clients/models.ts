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

/**
 * The configuration of the `TypeScriptK6ClientsGenerator`. It extends the common TypeScript generator configuration
 * with the language, response type, naming, directory and index file settings of the generated k6 clients.
 * @see TypeScriptK6ClientsGenerator
 */
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
   * @default 'clients.js'
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

/**
 * The default configuration of the `TypeScriptK6ClientsGenerator`. The provider uses these values for every option that
 * is not set in its configuration.
 * @see TypeScriptK6ClientsGeneratorConfig
 */
export const defaultTypeScriptK6ClientsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptK6ClientsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    language: 'javascript',
    strictResponseTypes: true,
    defaultStatusCodeResponseTypes: {
      401: null,
      403: null,
      500: null,
    },
    possibleStatusCodes: [
      100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308,
      400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 421, 422, 423, 424, 425,
      426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
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

/**
 * The input of the `TypeScriptK6ClientsGenerator`. It is the output of the models generator, which the clients use to
 * reference the request and response model types.
 * @see TypeScriptModelsGeneratorOutput
 */
export type TypeScriptK6ClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

/**
 * The output of the `TypeScriptK6ClientsGenerator`. It is published under the `typescript` key for subsequent
 * generators.
 * @see TypeScriptK6ClientGeneratorOutput
 */
export type TypeScriptK6ClientsGeneratorOutput = {
  /**
   * The TypeScript-specific results of the k6 clients generator.
   */
  typescript: {
    /**
     * The clients, keyed by the ID of their service (`ApiService['id']`).
     */
    k6Clients: {
      /**
       * The client and response models that were generated for one service.
       */
      [serviceId: string]: TypeScriptK6ClientGeneratorOutput;
    };
    /**
     * The paths of the index files. A value is `null` when its index file is disabled by the configuration.
     */
    indexFiles: {
      /**
       * The path to the index file that exports the client classes.
       */
      k6Clients: Nullable<string>;
      /**
       * The path to the index file that exports the response model types.
       */
      k6ResponseModels: Nullable<string>;
    };
  };
};

/**
 * The output of the `TypeScriptK6ClientGenerator` for one service: the exported client class and its file, plus the
 * response model types of its endpoints.
 * @see TypeScriptExportOutput
 */
export type TypeScriptK6ClientGeneratorOutput = TypeScriptExportOutput & {
  /**
   * The response model types of the service, keyed by the ID of their endpoint (`ApiEndpoint['id']`).
   */
  responseModels: {
    /**
     * The exported response model type and the file it was written to.
     */
    [operationId: string]: TypeScriptExportOutput;
  };
};

/**
 * The context passed to the `TypeScriptK6ClientsGenerator` methods. It extends the services generator context with the
 * reference factories of the generated clients.
 * @see TypeScriptK6ClientGeneratorContext
 */
export type TypeScriptK6ClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptK6ClientsGeneratorInput,
  TypeScriptK6ClientsGeneratorOutput,
  TypeScriptK6ClientsGeneratorConfig,
  TypeScriptK6ClientGeneratorOutput
> & {
  /**
   * The factories that create references to the utilities, as returned by `getReferenceFactories`.
   */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context passed to `TypeScriptK6ClientGenerator.generate` for a single service.
 * @see TypeScriptK6ClientsGeneratorContext
 */
export type TypeScriptK6ClientGeneratorContext = TypeScriptK6ClientsGeneratorContext & {
  /**
   * The API service whose client is generated.
   */
  readonly service: ApiService;
};
