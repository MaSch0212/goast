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

export type TypeScriptAngularServicesGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;

  exposeResponseMethods: boolean;
  exposePathProperties: boolean;
  clientMethodFlavor: 'default' | 'response-handler';
  responseTypesFileNameCasing: StringCasing | StringCasingWithOptions;
  responseTypesDirPath: string;

  rootUrl?: string | RegExp | ((rootUrl: string) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  clientDirPath: string;
  utilsDirPath: string;
  indexFilePath: Nullable<string>;
};

export const defaultTypeScriptAngularServicesGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptAngularServicesGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '.service' },

    exposeResponseMethods: false,
    exposePathProperties: false,
    clientMethodFlavor: 'default',
    responseTypesFileNameCasing: { casing: 'kebab', suffix: '-responses.model' },
    responseTypesDirPath: 'models/responses',

    clientDirPath: 'services',
    utilsDirPath: 'utils',
    indexFilePath: 'services.ts',
  };

export type TypeScriptAngularServicesGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptAngularServicesGeneratorOutput = {
  services: {
    [serviceId: string]: TypeScriptAngularServiceGeneratorOutput;
  };
  servicesIndexFilePath: string | undefined;
};

export type TypeScriptAngularServiceGeneratorOutput = Omit<TypeScriptComponentOutput, 'additionalImports'>;

export type TypeScriptAngularServicesGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptAngularServicesGeneratorInput,
  TypeScriptAngularServicesGeneratorOutput,
  TypeScriptAngularServicesGeneratorConfig,
  TypeScriptAngularServiceGeneratorOutput
>;

export type TypeScriptAngularServiceGeneratorContext = TypeScriptAngularServicesGeneratorContext & {
  readonly service: ApiService;
};
