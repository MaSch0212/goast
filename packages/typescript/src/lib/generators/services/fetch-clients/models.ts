import {
  ApiService,
  DefaultGenerationProviderConfig,
  OpenApiServicesGenerationProviderContext,
  StringCasing,
  StringCasingWithOptions,
  Nullable,
} from '@goast/core';

import { TypeScriptComponentOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptModelsGeneratorOutput } from '../../models/models';

export type TypeScriptFetchClientsGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  interfaceFileNameCasing: Nullable<StringCasing | StringCasingWithOptions>;

  classNameCasing: StringCasing | StringCasingWithOptions;
  interfaceNameCasing: StringCasing | StringCasingWithOptions;
  methodCasing: StringCasing | StringCasingWithOptions;

  clientFileKind: 'interface' | 'class' | 'class-and-interface';
  clientDirPath: string;
  clientInterfaceDirPath: Nullable<string>;
  indexFilePath: Nullable<string>;
  interfaceIndexFilePath: Nullable<string>;
  utilsDirPath: string;
};

export const defaultTypeScriptFetchClientsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptFetchClientsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '-client' },
    interfaceFileNameCasing: null,

    classNameCasing: { casing: 'pascal', suffix: 'Client' },
    interfaceNameCasing: { prefix: 'I', casing: 'pascal', suffix: 'Client' },
    methodCasing: 'camel',

    clientFileKind: 'class',
    clientDirPath: 'clients',
    clientInterfaceDirPath: 'clients/interfaces',
    indexFilePath: 'clients.ts',
    interfaceIndexFilePath: 'clients.ts',
    utilsDirPath: 'utils',
  };

export type TypeScriptFetchClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptFetchClientsGeneratorOutput = {
  clients: {
    [serviceId: string]: TypeScriptFetchClientGeneratorOutput;
  };
  clientIndexFilePath: string | undefined;
  clientInterfaceIndexFilePath: string | undefined;
};

export type TypeScriptFetchClientGeneratorOutput = {
  class?: Omit<TypeScriptComponentOutput, 'additionalImports'>;
  interface?: Omit<TypeScriptComponentOutput, 'additionalImports'>;
};

export type TypeScriptFetchClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptFetchClientsGeneratorInput,
  TypeScriptFetchClientsGeneratorOutput,
  TypeScriptFetchClientsGeneratorConfig,
  TypeScriptFetchClientGeneratorOutput
>;

export type TypeScriptFetchClientGeneratorContext = TypeScriptFetchClientsGeneratorContext & {
  readonly service: ApiService;
};
