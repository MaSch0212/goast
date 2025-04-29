import type { ApiEndpoint, ApiResponse, ApiSchema, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

// #region API Response Entities
export type GenerateApiResponseEntitiesFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiResponseEntitiesFileContent = { packageName: string };

export type GetApiResponseEntities = object;
// #endregion

// #region API Interface
export type GenerateApiInterfaceFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiInterfaceFileContent = { interfaceName: string };

export type GetApiInterface = { interfaceName: string };

export type GetApiInterfaceEndpointMethod = { endpoint: ApiEndpoint };

export type GetApiResponseEntityClass = { endpoint: ApiEndpoint };
// #endregion

// #region API Controller
export type GenerateApiControllerFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiControllerFileContent = { controllerName: string };

export type GetApiController = { controllerName: string };
// #endregion

// #region API Delegate Interface
export type GenerateApiDelegateInterfaceFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiDelegateInterfaceFileContent = { delegateInterfaceName: string };

export type GetApiDelegateInterface = { delegateInterfaceName: string };

export type GetApiDelegateInterfaceEndpointMethod = { endpoint: ApiEndpoint };
// #endregion

export type GetParameterType = {
  endpoint: ApiEndpoint;
  parameter: ApiParameterWithMultipartInfo;
  type?: kt.Reference<SourceBuilder>;
};

export type GetResponseType = { endpoint: ApiEndpoint; response?: ApiResponse };

export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  schema: ApiSchema | undefined;
  nullable?: boolean;
  fallback?: kt.Type<TBuilder>;
  type?: kt.Reference<TBuilder>;
};

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetControllerRequestMapping = { prefix?: string };

export type GetBasePath = object;

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetDirectoryPath = { packageName: string };

export type GetPathConstantName = { endpoint: ApiEndpoint };

export type GetPackageName = object;

export type GetApiResponseEntityName = { endpoint: ApiEndpoint };

export type GetApiInterfaceName = object;

export type GetApiDelegateInterfaceName = object;

export type GetApiControllerName = object;

export type GetAllParameters = { endpoint: ApiEndpoint };
