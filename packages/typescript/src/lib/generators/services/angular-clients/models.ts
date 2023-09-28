import {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  Nullable,
  OpenApiServicesGenerationProviderContext,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { TypeScriptComponentOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptModelsGeneratorOutput } from '../../models';

export type TypeScriptAngularClientsGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;

  exposeResponseMethods: boolean;
  clientMethodFlavor: 'default' | 'response-handler';
  responseTypesFileNameCasing: StringCasing | StringCasingWithOptions;
  responseTypesDirPath: string;

  rootUrl?: string | RegExp | ((rootUrl: string) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  clientDirPath: string;
  utilsDirPath: string;
  indexFilePath: Nullable<string>;
};

export const defaultTypeScriptAngularClientsGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptAngularClientsGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '.service' },

    exposeResponseMethods: false,
    clientMethodFlavor: 'default',
    responseTypesFileNameCasing: { casing: 'kebab', suffix: '-responses.model' },
    responseTypesDirPath: 'models/responses',

    clientDirPath: 'services',
    utilsDirPath: 'utils',
    indexFilePath: 'services.ts',
  };

export type TypeScriptAngularClientsGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptAngularClientsGeneratorOutput = {
  clients: {
    [serviceId: string]: TypeScriptAngularClientGeneratorOutput;
  };
  clientIndexFilePath: string | undefined;
};

export type TypeScriptAngularClientGeneratorOutput = Omit<TypeScriptComponentOutput, 'additionalImports'>;

export type TypeScriptAngularClientsGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptAngularClientsGeneratorInput,
  TypeScriptAngularClientsGeneratorOutput,
  TypeScriptAngularClientsGeneratorConfig,
  TypeScriptAngularClientGeneratorOutput
>;

export type TypeScriptAngularClientGeneratorContext = TypeScriptAngularClientsGeneratorContext & {
  readonly service: ApiService;
};
