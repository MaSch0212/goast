import {
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
  Nullable,
  ExtendedStringCasing,
} from '@goast/core';

import { getReferenceFactories } from './refs';
import { TypeScriptExportOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptModelsGeneratorOutput } from '../../models/models';

export type TypeScriptFetchClientsGeneratorConfig = TypeScriptGeneratorConfig & {
  /**
   * The casing of the client file names. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-client' }
   */
  clientFileNameCasing: Nullable<ExtendedStringCasing>;

  /**
   * The casing of the client interface file names. If nullish, the `fileNameCasing` is used.
   * @default { casing: 'kebab', suffix: '-client' }
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

export type TypeScriptFetchClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptFetchClientsGeneratorOutput = {
  typescript: {
    clients: {
      [serviceId: string]: TypeScriptFetchClientGeneratorOutput;
    };
    indexFiles: {
      clients: Nullable<string>;
      clientInterfaces: Nullable<string>;
    };
  };
};

export type TypeScriptFetchClientGeneratorOutput = {
  client?: TypeScriptExportOutput;
  clientInterface?: TypeScriptExportOutput;
};

export type TypeScriptFetchClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptFetchClientsGeneratorInput,
  TypeScriptFetchClientsGeneratorOutput,
  TypeScriptFetchClientsGeneratorConfig,
  TypeScriptFetchClientGeneratorOutput
> & {
  refs: ReturnType<typeof getReferenceFactories>;
};

export type TypeScriptFetchClientGeneratorContext = TypeScriptFetchClientsGeneratorContext & {
  readonly service: ApiService;
};
