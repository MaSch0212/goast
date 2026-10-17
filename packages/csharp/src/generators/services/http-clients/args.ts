import type { ApiEndpoint, ApiParameter, ApiResponse, ApiSchema, SourceBuilder } from '@goast/core';

import type { cs } from '../../../ast/index.ts';
import type { CSharpClientBody, CSharpClientEndpoint, CSharpClientError, CSharpClientResponseBody } from './models.ts';

export type GetClientFileContent = { endpoints: CSharpClientEndpoint[] };

export type GetInterfaceFileContent = { endpoints: CSharpClientEndpoint[] };

export type GetExtensionsFileContent = object;

export type GetExceptionFileContent = { endpoint: CSharpClientEndpoint; error: CSharpClientError };

export type GetClientInterface = { endpoints: CSharpClientEndpoint[] };

export type GetClientClass = { endpoints: CSharpClientEndpoint[] };

export type GetClientConstructor = object;

export type GetExtensionsClass = object;

export type GetExceptionClass = { endpoint: CSharpClientEndpoint; error: CSharpClientError };

export type GetEndpointMethod = { endpoint: CSharpClientEndpoint; declaration: boolean };

export type GetEndpointMethodDoc = { endpoint: CSharpClientEndpoint };

export type GetEndpointMethodBody = { endpoint: CSharpClientEndpoint };

export type GetEndpointReturnType = { endpoint: CSharpClientEndpoint };

export type GetPathExpression = { endpoint: CSharpClientEndpoint };

export type GetRequestBodyStatements = { endpoint: CSharpClientEndpoint; body: CSharpClientBody };

export type GetErrorHandlingStatements = { endpoint: CSharpClientEndpoint };

export type GetSuccessStatements = { endpoint: CSharpClientEndpoint };

export type GetServiceDocDescription = object;

export type GetParameterStyle = { parameter: ApiParameter };

export type ReferencesDeprecatedType = { schemas: (ApiSchema | undefined)[] };

export type GetEndpoints = object;

export type GetEndpoint = { endpoint: ApiEndpoint; methodBaseName: string };

export type GetParameters = { endpoint: ApiEndpoint; names: Set<string> };

export type GetBody = { endpoint: ApiEndpoint; names: Set<string> };

export type GetResponseBody = { response: ApiResponse; kinds: CSharpClientResponseBody['kind'][] };

export type GetErrors = { endpoint: ApiEndpoint; methodBaseName: string };

export type GetErrorClassName = { methodBaseName: string; response: ApiResponse };

export type GetParameterName = { name: string; names: Set<string> };

export type GetParameterType = { parameter: ApiParameter };

export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  schema: ApiSchema | undefined;
  nullable?: boolean;
  fallback?: cs.Type<TBuilder>;
};

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetPolymorphicBaseType = { schema: ApiSchema | undefined };

export type GetEndpointDocDescription = { endpoint: ApiEndpoint };

export type GetBasePath = object;

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetNamespace = object;

export type GetFilePath = { name: string };

export type GetClientName = object;

export type GetInterfaceName = object;

export type GetExtensionsName = object;

export type GetMethodBaseName = { endpoint: ApiEndpoint; names: Set<string> };

export type GetEndpointSchemas = { endpoint: ApiEndpoint };
