import { ApiEndpoint, ApiParameter, ApiSchema, SourceBuilder } from '@goast/core';

import { kt } from '../../../ast';

export type GetClientFileContent = {};

export type GetClientClass = {};

export type GetClientCompanionObject = {};

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
};

export type GetAdditionalClientMembers = {};

export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  schema: ApiSchema | undefined;
  nullable?: boolean;
  fallback?: kt.Type<TBuilder>;
};

export type GetPackageName = {};

export type GetPathWithInterpolation = { endpoint: ApiEndpoint };

export type GetResponseSchema = { endpoint: ApiEndpoint };

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetAllParameters = { endpoint: ApiEndpoint };

export type GetRequestBodyParamName = { endpoint: ApiEndpoint };

export type GetBasePath = {};

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetFilePath = { packageName: string };

export type GetApiClientName = {};
