import { DefaultGenerationProviderConfig } from '@goast/core';
import { Nullable, StringCasing, StringCasingWithOptions } from '@goast/core/utils';

import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';

export type TypeScriptFetchClientGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  clientNameCasing: StringCasing | StringCasingWithOptions;

  clientDirPath: string;
};

export type TypeScriptFetchClientsGeneratorConfig = TypeScriptFetchClientGeneratorConfig & {
  indexFilePath: Nullable<string>;
};

export const defaultTypeScriptFetchClientGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptFetchClientGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '-client' },
    clientNameCasing: { casing: 'pascal', suffix: 'Client' },

    clientDirPath: 'clients',
  };

export const defaultTypeScriptFetchClientsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptFetchClientsGeneratorConfig> =
  {
    ...defaultTypeScriptFetchClientGeneratorConfig,

    indexFilePath: 'clients.ts',
  };
