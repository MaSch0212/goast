import {
  ApiSchema,
  ApiService,
  DefaultGenerationProviderConfig,
  ExtendedStringCasing,
  Nullable,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import { getReferenceFactories } from './refs';
import { ts } from '../../../ast';
import { TypeScriptExportOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptFileBuilder } from '../../../file-builder';
import { TypeScriptModelGeneratorOutput } from '../../models';

export type TypeScriptEasyNetworkStubsGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * The domain name of the API. Used as a prefix for exported components (e.g. `ApiStubs`).
   * @default undefined
   */
  domainName: Nullable<string>;

  /**
   * The default response types for status codes that are not defined in the OpenAPI specification.
   * @example
   * {
   *   400: schemas =>
   *     schemas.find(s => s.name === 'BadRequestResponse')
   *       ?? throwExp('BadRequestResponse not found'),
   *   404: 'never',
   *   500: ts.refs.any(),
   * }
   * @default
   * {
   *   401: ts.refs.never(),
   *   403: ts.refs.never(),
   *   500: ts.refs.never(),
   * }
   */
  defaultStatusCodeResponseTypes: Record<
    number,
    // eslint-disable-next-line @typescript-eslint/ban-types
    Exclude<ts.Type<TypeScriptFileBuilder>, Function> | ((schemas: readonly ApiSchema[]) => ApiSchema)
  >;

  /**
   * The directory where the stubs should be saved. The path is relative to the output directory.
   * @default 'stubs'
   */
  stubsDir: string;

  /**
   * The casing of the stub file names. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '.stubs' }
   */
  stubFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The index file where all stubs should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'stubs.ts'
   */
  stubsIndexFile: Nullable<string>;

  /**
   * The directory where the utilies should be saved. The path is relative to the output directory.
   * @default 'utils'
   */
  utilsDir: string;
};

export const defaultTypeScriptEasyNetworkStubsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptEasyNetworkStubsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    domainName: undefined,
    defaultStatusCodeResponseTypes: {
      401: ts.refs.never(),
      403: ts.refs.never(),
      500: ts.refs.never(),
    },

    stubsDir: 'stubs',
    stubFileNameCasing: { casing: 'kebab', suffix: '.stubs' },
    stubsIndexFile: 'stubs.ts',
    utilsDir: 'utils',
  };

export type TypeScriptEasyNetworkStubsGeneratorInput = {
  typescript: {
    models: {
      [schemaId: string]: TypeScriptModelGeneratorOutput;
    };
  };
};

export type TypeScriptEasyNetworkStubsGeneratorOutput = {
  typescript: {
    stubs: {
      [serviceId: string]: TypeScriptEasyNetworkStubGeneratorOutput;
    };
    indexFiles: {
      stubs: Nullable<string>;
    };
  };
};

export type TypeScriptEasyNetworkStubGeneratorOutput = TypeScriptExportOutput;

export type TypeScriptEasyNetworkStubsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptEasyNetworkStubsGeneratorInput,
  TypeScriptEasyNetworkStubsGeneratorOutput,
  TypeScriptEasyNetworkStubsGeneratorConfig,
  TypeScriptEasyNetworkStubGeneratorOutput
> & {
  refs: ReturnType<typeof getReferenceFactories>;
};

export type TypeScriptEasyNetworkStubGeneratorContext = TypeScriptEasyNetworkStubsGeneratorContext & {
  readonly service: ApiService;
};
