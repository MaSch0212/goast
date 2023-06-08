import { DefaultGenerationProviderConfig } from '@goast/core';
import { StringCasing, StringCasingWithOptions } from '@goast/core/utils';

import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';

export type TypeScriptClientInterfaceGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  interfaceNameCasing: StringCasing | StringCasingWithOptions;
  publicFunctionCasing: StringCasing | StringCasingWithOptions;

  interfaceDirPath: string;
};

export type TypeScriptClientInterfacesGeneratorConfig = TypeScriptClientInterfaceGeneratorConfig & {
  indexFilePath: string | null;
};

export const defaultTypeScriptClientInterfaceGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptClientInterfaceGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '-client' },
    interfaceNameCasing: { casing: 'pascal', suffix: 'Client' },
    publicFunctionCasing: 'camel',

    interfaceDirPath: 'clients',
  };

export const defaultTypeScriptClientInterfacesGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptClientInterfacesGeneratorConfig> =
  {
    ...defaultTypeScriptClientInterfaceGeneratorConfig,

    indexFilePath: 'clients.ts',
  };
