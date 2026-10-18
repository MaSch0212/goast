import type {
  ApiSchema,
  ApiService,
  DefaultGenerationProviderConfig,
  ExtendedStringCasing,
  Nullable,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import { ts } from '../../../ast/index.ts';
import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../../config.ts';
import type { TypeScriptFileBuilder } from '../../../file-builder.ts';
import type { TypeScriptModelGeneratorOutput } from '../../models/index.ts';
import type { getReferenceFactories } from './refs.ts';

/**
 * The configuration of the `TypeScriptEasyNetworkStubsGenerator`. It extends the common TypeScript generator
 * configuration with the naming, directory and index file settings of the generated stubs.
 * @see TypeScriptEasyNetworkStubsGenerator
 */
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

/**
 * The default configuration of the `TypeScriptEasyNetworkStubsGenerator`. The provider uses these values for every
 * option that is not set in its configuration.
 * @see TypeScriptEasyNetworkStubsGeneratorConfig
 */
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

/**
 * The input of the `TypeScriptEasyNetworkStubsGenerator`. It is the output of the models generator, which the stubs use
 * to reference the request and response model types.
 */
export type TypeScriptEasyNetworkStubsGeneratorInput = {
  /**
   * The TypeScript-specific results of the models generator.
   */
  typescript: {
    /**
     * The generated models, keyed by the ID of their schema (`ApiSchema['id']`).
     */
    models: {
      /**
       * The model output of one schema.
       */
      [schemaId: string]: TypeScriptModelGeneratorOutput;
    };
  };
};

/**
 * The output of the `TypeScriptEasyNetworkStubsGenerator`. It is published under the `typescript` key for subsequent
 * generators.
 */
export type TypeScriptEasyNetworkStubsGeneratorOutput = {
  /**
   * The TypeScript-specific results of the stubs generator.
   */
  typescript: {
    /**
     * The stub classes, keyed by the ID of their service (`ApiService['id']`).
     */
    stubs: {
      /**
       * The stub class that was generated for one service.
       */
      [serviceId: string]: TypeScriptEasyNetworkStubGeneratorOutput;
    };
    /**
     * The paths of the index files.
     */
    indexFiles: {
      /**
       * The path to the index file that exports the stub classes. `null` when `stubsIndexFile` is disabled.
       */
      stubs: Nullable<string>;
    };
  };
};

/**
 * The output of the `TypeScriptEasyNetworkStubGenerator` for one service: the exported stub class and its file.
 * @see TypeScriptExportOutput
 */
export type TypeScriptEasyNetworkStubGeneratorOutput = TypeScriptExportOutput;

/**
 * The context passed to the `TypeScriptEasyNetworkStubsGenerator` methods. It extends the services generator context
 * with the reference factories of the stubs.
 * @see TypeScriptEasyNetworkStubGeneratorContext
 */
export type TypeScriptEasyNetworkStubsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptEasyNetworkStubsGeneratorInput,
  TypeScriptEasyNetworkStubsGeneratorOutput,
  TypeScriptEasyNetworkStubsGeneratorConfig,
  TypeScriptEasyNetworkStubGeneratorOutput
> & {
  /**
   * The factories that create references to the utilities, as returned by `getReferenceFactories`.
   */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context passed to `TypeScriptEasyNetworkStubGenerator.generate` for a single service.
 * @see TypeScriptEasyNetworkStubsGeneratorContext
 */
export type TypeScriptEasyNetworkStubGeneratorContext = TypeScriptEasyNetworkStubsGeneratorContext & {
  /**
   * The API service whose stubs are generated.
   */
  readonly service: ApiService;
};
