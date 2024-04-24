import {
  ApiEndpoint,
  ApiSchema,
  ApiService,
  DefaultGenerationProviderConfig,
  Nullable,
  OpenApiServicesGenerationProviderContext,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { getReferenceFactories } from './refs';
import { ts } from '../../../ast';
import { TypeScriptExportOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptModelGeneratorOutput } from '../../models';

export type TypeScriptAngularServicesGeneratorConfig = TypeScriptGeneratorConfig & {
  responseModelFileNameCasing: StringCasing | StringCasingWithOptions;

  /**
   * How the services should be provided in the Angular application.
   * - `root` - provides all the services using `Injectable({ providedIn: 'root' })`
   * - `provide-fn` - generates a function `provideApiClients` that provides the services
   * - `module` - generates an angular module `ApiClientModule` that provides the services
   * @default 'root'
   */
  provideKind: 'root' | 'provide-fn';
  /**
   * The domain name of the API. Used as a prefix for exported components (e.g. `ApiConfiguration`).
   */
  domainName?: string;
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
      // eslint-disable-next-line @typescript-eslint/ban-types
      type: Exclude<ts.Type<TypeScriptFileBuilder>, Function> | ((schemas: readonly ApiSchema[]) => ApiSchema);
    } | null
  >;
  /**
   * The possible status codes that any API endpoint can return.
   * This is only used when `strictResponseTypes` is set to `false`;
   * @default
   * [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
   */
  possibleStatusCodes: number[];

  rootUrl?: string | RegExp | ((rootUrl: string) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  servicesDirPath: string;
  servicesIndexFilePath: Nullable<string>;
  responseModelsDirPath: string;
  responseModelsIndexFilePath: Nullable<string>;
  utilsDirPath: string;
};

export const defaultTypeScriptAngularServicesGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptAngularServicesGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '.service' },
    responseModelFileNameCasing: { casing: 'kebab', suffix: '-responses.model' },

    provideKind: 'provide-fn',
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

    servicesDirPath: 'services',
    servicesIndexFilePath: 'services.ts',
    responseModelsDirPath: 'models/responses',
    responseModelsIndexFilePath: 'responses.ts',
    utilsDirPath: 'utils',
  };

export type TypeScriptAngularServicesGeneratorInput = {
  models: {
    [schemaId: string]: TypeScriptModelGeneratorOutput;
  };
};

export type TypeScriptAngularServicesGeneratorOutput = {
  services: {
    [serviceId: string]: TypeScriptAngularServiceGeneratorOutput;
  };
  indexFiles: {
    services: Nullable<string>;
    responseModels: Nullable<string>;
  };
};

export type TypeScriptAngularServiceGeneratorOutput = TypeScriptExportOutput & {
  responseModels: {
    [operationId: string]: TypeScriptExportOutput;
  };
};

export type TypeScriptAngularServicesGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptAngularServicesGeneratorInput,
  TypeScriptAngularServicesGeneratorOutput,
  TypeScriptAngularServicesGeneratorConfig,
  TypeScriptAngularServiceGeneratorOutput
> & {
  refs: ReturnType<typeof getReferenceFactories>;
};

export type TypeScriptAngularServiceGeneratorContext = TypeScriptAngularServicesGeneratorContext & {
  readonly service: ApiService;
};
