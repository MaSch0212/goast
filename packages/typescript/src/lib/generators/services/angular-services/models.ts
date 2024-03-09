import {
  ApiEndpoint,
  ApiService,
  DefaultGenerationProviderConfig,
  Nullable,
  OpenApiServicesGenerationProviderContext,
  RequiredProperties,
  StringCasing,
  StringCasingWithOptions,
} from '@goast/core';

import { TypeScriptComponentOutput } from '../../../common-results';
import { TypeScriptGeneratorConfig, defaultTypeScriptGeneratorConfig } from '../../../config';
import { TypeScriptModelsGeneratorOutput } from '../../models';

export type TypeScriptAngularServicesGeneratorConfig = TypeScriptGeneratorConfig & {
  fileNameCasing: StringCasing | StringCasingWithOptions;
  responseModelsFileNameCasing: StringCasing | StringCasingWithOptions;

  exposeResponseMethods: boolean;
  exposePathProperties: boolean;
  clientMethodFlavor: 'default' | 'response-handler';

  rootUrl?: string | RegExp | ((rootUrl: string) => string);
  pathModifier?: RegExp | ((path: string, endpoint: ApiEndpoint) => string);

  servicesDirPath: string;
  responseModelsDirPath: Nullable<string>;
  utilsDirPath: string;
  indexFilePath: Nullable<string>;
  responseModelsIndexFilePath: Nullable<string>;
};

export const defaultTypeScriptAngularServicesGeneratorConfig: DefaultGenerationProviderConfig<TypeScriptAngularServicesGeneratorConfig> =
  {
    ...defaultTypeScriptGeneratorConfig,

    fileNameCasing: { casing: 'kebab', suffix: '.service' },
    responseModelsFileNameCasing: { casing: 'kebab', suffix: '-responses.model' },

    exposeResponseMethods: false,
    exposePathProperties: false,
    clientMethodFlavor: 'default',

    servicesDirPath: 'services',
    responseModelsDirPath: 'models/responses',
    utilsDirPath: 'utils',
    indexFilePath: 'services.ts',
    responseModelsIndexFilePath: 'responses.ts',
  };

export type TypeScriptAngularServicesGeneratorInput = TypeScriptModelsGeneratorOutput;

export type TypeScriptAngularServicesGeneratorOutput = {
  services: {
    [serviceId: string]: TypeScriptAngularServiceGeneratorOutput;
  };
  servicesIndexFilePath: string | undefined;
  responseModelsIndexFilePath: string | undefined;
};

export type x = Omit<TypeScriptComponentOutput, 'additionalImports'>;

export type TypeScriptAngularServiceGeneratorOutput = RequiredProperties<TypeScriptComponentOutput, 'filePath'> & {
  responseModels: {
    [operationId: string]: TypeScriptComponentOutput & {
      statusCodes: { [statusCode: string]: TypeScriptComponentOutput };
    };
  };
};

export type TypeScriptAngularServicesGeneratorContext = OpenApiServicesGenerationProviderContext<
  TypeScriptAngularServicesGeneratorInput,
  TypeScriptAngularServicesGeneratorOutput,
  TypeScriptAngularServicesGeneratorConfig,
  TypeScriptAngularServiceGeneratorOutput
>;

export type TypeScriptAngularServiceGeneratorContext = TypeScriptAngularServicesGeneratorContext & {
  readonly service: ApiService;
};
