import type {
  ApiService,
  DefaultGenerationProviderConfig,
  ExtendedStringCasing,
  Nullable,
  OpenApiServicesGenerationProviderContext,
} from '@goast/core';

import type { TypeScriptExportOutput } from '../../../common-results.ts';
import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../../config.ts';
import type { TypeScriptModelsGeneratorOutput } from '../../models/models.ts';
import type { getReferenceFactories } from './refs.ts';

/**
 * The configuration of the `TypeScriptFetchClientsGenerator`. It extends the common TypeScript generator configuration
 * with the naming, directory and index file settings of the generated clients and client interfaces.
 * @see TypeScriptFetchClientsGenerator
 */
export type TypeScriptFetchClientsGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * The casing of the client file names. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-client' }
   */
  clientFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the client interface file names. If nullish, the `fileNameCasing` is used.
   * @default undefined
   */
  clientInterfaceFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the client names. If nullish, the `typeNameCasing` is used.
   * @default { casing: 'pascal', suffix: 'Client' }
   */
  clientNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the client interface names. If nullish, the `typeNameCasing` is used.
   * @default { prefix: 'I', casing: 'pascal', suffix: 'Client' }
   */
  clientInterfaceNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * Determines how the client files should be generated.
   * - `interface` - generates only the interface
   * - `class` - generates only the class
   * - `class-and-interface` - generates both the class and the interface
   * @default 'class'
   */
  clientFileKind: 'interface' | 'class' | 'class-and-interface';

  /**
   * The directory where the client files should be saved. The path is relative to the output directory.
   * @default 'clients'
   */
  clientDir: string;

  /**
   * The directory where the client interface files should be saved. The path is relative to the output directory.
   * @default 'clients/interfaces'
   */
  clientInterfaceDir: Nullable<string>;

  /**
   * The index file where all clients should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'clients.ts'
   */
  clientsIndexFile: Nullable<string>;

  /**
   * The index file where all client interfaces should be exported. The path is relative to the output directory. If nullish, no index file will be generated.
   * @default 'clients.ts'
   */
  clientInterfacesIndexFile: Nullable<string>;

  /**
   * The directory where the utilies should be saved. The path is relative to the output directory.
   * @default 'utils'
   */
  utilsDir: string;
};

/**
 * The default configuration of the `TypeScriptFetchClientsGenerator`. The provider uses these values for every option
 * that is not set in its configuration.
 * @see TypeScriptFetchClientsGeneratorConfig
 */
export const defaultTypeScriptFetchClientsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptFetchClientsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    clientFileNameCasing: { casing: 'kebab', suffix: '-client' },
    clientInterfaceFileNameCasing: undefined,

    clientNameCasing: { casing: 'pascal', suffix: 'Client' },
    clientInterfaceNameCasing: { prefix: 'I', casing: 'pascal', suffix: 'Client' },

    clientFileKind: 'class',
    clientDir: 'clients',
    clientInterfaceDir: 'clients/interfaces',
    clientsIndexFile: 'clients.ts',
    clientInterfacesIndexFile: 'clients.ts',
    utilsDir: 'utils',
  };

/**
 * The input of the `TypeScriptFetchClientsGenerator`. It is the output of the models generator, which the generated
 * clients use to reference the request and response model types.
 * @see TypeScriptModelsGeneratorOutput
 */
export type TypeScriptFetchClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

/**
 * The output of the `TypeScriptFetchClientsGenerator`. It is published under the `typescript` key for subsequent
 * generators.
 * @see TypeScriptFetchClientGeneratorOutput
 */
export type TypeScriptFetchClientsGeneratorOutput = {
  /**
   * The TypeScript-specific results of the fetch clients generator.
   */
  typescript: {
    /**
     * The clients, keyed by the ID of their service (`ApiService['id']`).
     */
    clients: {
      /**
       * The client and client interface that were generated for one service.
       */
      [serviceId: string]: TypeScriptFetchClientGeneratorOutput;
    };
    /**
     * The paths of the index files. A value is `null` when its index file is disabled by the configuration.
     */
    indexFiles: {
      /**
       * The path to the index file that exports the client classes.
       */
      clients: Nullable<string>;
      /**
       * The path to the index file that exports the client interfaces.
       */
      clientInterfaces: Nullable<string>;
    };
  };
};

/**
 * The output of the `TypeScriptFetchClientGenerator` for one service. A property is only set when `clientFileKind`
 * generates its kind of file.
 */
export type TypeScriptFetchClientGeneratorOutput = {
  /**
   * The exported client class and the file it was written to. Set when `clientFileKind` generates the class.
   */
  client?: TypeScriptExportOutput;
  /**
   * The exported client interface and the file it was written to. Set when `clientFileKind` generates the interface.
   */
  clientInterface?: TypeScriptExportOutput;
};

/**
 * The context passed to the `TypeScriptFetchClientsGenerator` methods. It extends the services generator context with
 * the reference factories of the generated clients.
 * @see TypeScriptFetchClientGeneratorContext
 */
export type TypeScriptFetchClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptFetchClientsGeneratorInput,
  TypeScriptFetchClientsGeneratorOutput,
  TypeScriptFetchClientsGeneratorConfig,
  TypeScriptFetchClientGeneratorOutput
> & {
  /**
   * The factories that create references to the utilities, as returned by `getReferenceFactories`.
   */
  refs: ReturnType<typeof getReferenceFactories>;
};

/**
 * The context passed to `TypeScriptFetchClientGenerator.generate` for a single service.
 * @see TypeScriptFetchClientsGeneratorContext
 */
export type TypeScriptFetchClientGeneratorContext = TypeScriptFetchClientsGeneratorContext & {
  /**
   * The API service whose client is generated.
   */
  readonly service: ApiService;
};
