import type { ApiEndpoint, ApiParameter, ApiSchema, SourceBuilder } from '@goast/core';
import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

export type GetClientFileContent = object;

export type GetRequestsObject = object;

export type GetEndpointMembers = { endpoint: ApiEndpoint; parameters: ApiParameterWithMultipartInfo[] };

export type GetEndpointFunctionName = { endpoint: ApiEndpoint };

export type GetEndpointFunction = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointFunctionBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointRequestFunctionName = { endpoint: ApiEndpoint };

export type GetEndpointRequestFunction = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointRequestFunctionBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointFunctionWithHandler = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointFunctionWithHandlerBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
  responseSchema: ApiSchema | undefined;
};

export type GetEndpointUriFunctionName = { endpoint: ApiEndpoint };

export type GetEndpointUriFunction = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
};

export type GetEndpointUriFunctionBody = {
  endpoint: ApiEndpoint;
  parameters: ApiParameterWithMultipartInfo[];
};

export type GetParameterToString = {
  endpoint: ApiEndpoint;
  parameter: ApiParameterWithMultipartInfo;
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

export type GetResponseSchema = { endpoint: ApiEndpoint };

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetAllParameters = { endpoint: ApiEndpoint };

export type GetRequestBodyParamName = { endpoint: ApiEndpoint };

export type GetBasePath = object;

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetFilePath = { packageName: string };

export type GetRequestsObjectName = object;
