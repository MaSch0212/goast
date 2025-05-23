import type { ApiEndpoint, ApiParameter, ApiSchema, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

export type GetClientFileContent = object;

export type GetClientClass = object;

export type GetClientCompanionObject = object;

export type GetEndpointClientMembers = { endpoint: ApiEndpoint; parameters: ApiParameter[] };

export type GetEndpointClientMethod = {
  endpoint: ApiEndpoint;
  parameters: ApiParameter[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointClientMethodBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameter[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointClientHttpInfoMethod = {
  endpoint: ApiEndpoint;
  parameters: ApiParameter[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointClientHttpInfoMethodBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameter[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointClientRequestConfigMethod = {
  endpoint: ApiEndpoint;
  parameters: ApiParameter[];
};

export type GetEndpointClientRequestConfigMethodBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
};

export type GetParameterToString = {
  endpoint: ApiEndpoint;
  parameter: ApiParameter;
};

export type GetAdditionalClientMembers = object;

export type GetParameterType = { endpoint: ApiEndpoint; parameter: ApiParameterWithMultipartInfo };

export type GetRequestBodyType = { endpoint: ApiEndpoint };

export type GetParameterDefaultValue = {
  endpoint: ApiEndpoint;
  parameter: ApiParameter;
};

export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  schema: ApiSchema | undefined;
  nullable?: boolean;
  fallback?: kt.Type<TBuilder>;
};

export type GetPackageName = object;

export type GetPathWithInterpolation = { endpoint: ApiEndpoint };

export type GetResponseSchema = { endpoint: ApiEndpoint };

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetAllParameters = { endpoint: ApiEndpoint };

export type GetRequestBodyParamName = { endpoint: ApiEndpoint };

export type GetBasePath = object;

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetFilePath = { packageName: string };

export type GetApiClientName = object;
