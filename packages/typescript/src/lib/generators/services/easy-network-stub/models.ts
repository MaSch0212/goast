import {
  ApiSchema,
  ApiService,
  DefaultGenerationProviderConfig,
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

  stubsDirPath: string;
  stubsIndexFilePath: Nullable<string>;
  utilsDirPath: string;
};

export const defaultTypeScriptEasyNetworkStubsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptEasyNetworkStubsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '.stubs' },

    defaultStatusCodeResponseTypes: {
      401: ts.refs.never(),
      403: ts.refs.never(),
      500: ts.refs.never(),
    },

    stubsDirPath: 'stubs',
    stubsIndexFilePath: 'stubs.ts',
    utilsDirPath: 'utils',
  };

export type TypeScriptEasyNetworkStubsGeneratorInput = {
  models: {
    [schemaId: string]: TypeScriptModelGeneratorOutput;
  };
};

export type TypeScriptEasyNetworkStubsGeneratorOutput = {
  stubs: {
    [serviceId: string]: TypeScriptEasyNetworkStubGeneratorOutput;
  };
  indexFiles: {
    stubs: Nullable<string>;
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
