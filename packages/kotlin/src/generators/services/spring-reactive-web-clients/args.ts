import type { ApiEndpoint, ApiParameter, ApiSchema, SourceBuilder } from '@goast/core';
import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

/**
 * Empty arguments for `getClientFileContent`. The file content is derived from the generation context alone.
 */
export type GetClientFileContent = object;

/**
 * Empty arguments for `getRequestsObject`, which builds the Kotlin `object` declaration from the service's endpoints.
 */
export type GetRequestsObject = object;

/**
 * Arguments for `getEndpointMembers`, which returns the four functions generated for one endpoint. `endpoint` is the
 * operation, and `parameters` are its query, path, header and request body parameters as collected by
 * `getAllParameters`.
 */
export type GetEndpointMembers = { endpoint: ApiEndpoint; parameters: ApiParameterWithMultipartInfo[] };

/**
 * Arguments for `getEndpointFunctionName`. `endpoint` is the operation whose `name` is cased with `functionNameCasing`
 * to name the `suspend` function.
 */
export type GetEndpointFunctionName = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointDeprecatedAnnotations`. `endpoint` is the operation whose `deprecated` flag decides whether
 * its functions receive a `@Deprecated("")` annotation.
 */
export type GetEndpointDeprecatedAnnotations = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointFunction`, which generates the `suspend` function that returns the awaited response body.
 */
export type GetEndpointFunction = {
  /**
   * The operation the `suspend` function is generated for.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters of the function, in the order they appear in its Kotlin signature.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The schema of the response body the function returns, or `undefined` when the operation has no response body.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointFunctionBody`, which generates the call chain of the `suspend` function.
 */
export type GetEndpointFunctionBody = {
  /**
   * The operation whose function body is generated.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters the body forwards to the request builder function, in signature order.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The response body schema. When present the body awaits it with `awaitBody` and returns it, otherwise it awaits
   * `awaitBodilessEntity`.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointRequestFunctionName`. `endpoint` is the operation whose name, with the `Request` suffix
 * added, names the request builder function.
 */
export type GetEndpointRequestFunctionName = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointRequestFunction`, which generates the plain function that builds the
 * `WebClient.RequestHeadersSpec` for one operation.
 */
export type GetEndpointRequestFunction = {
  /**
   * The operation whose request builder is generated.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters of the request builder, in the order they appear in its Kotlin signature.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The response body schema. When present the request builder sets an `Accept: application/json` header.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointRequestFunctionBody`, which builds the chain of `WebClient` calls for one operation.
 */
export type GetEndpointRequestFunctionBody = {
  /**
   * The operation whose request chain is built.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters that feed the URI, body, multipart and header calls of the chain.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The response body schema. When present the chain adds `accept(MediaType.APPLICATION_JSON)`.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointFunctionWithHandler`, which generates the overload of the `suspend` function that takes a
 * `responseHandler` and returns its result.
 */
export type GetEndpointFunctionWithHandler = {
  /**
   * The operation the response handler overload is generated for.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters of the overload, in signature order, before the `responseHandler` parameter.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The response body schema. The overload does not use it, but it is part of the shared argument set.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointFunctionWithHandlerBody`, which forwards the call of the response handler overload to the
 * request builder function.
 */
export type GetEndpointFunctionWithHandlerBody = {
  /**
   * The operation whose overload body is generated.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters forwarded to the request builder function, in signature order.
   */
  parameters: ApiParameterWithMultipartInfo[];
  /**
   * The response body schema. The body does not read it and forwards only the endpoint and the parameters.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments for `getEndpointUriCall`, which builds the `uri(...)` call of a request builder function.
 */
export type GetEndpointUriCall = {
  /**
   * The operation whose URI call is generated.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters passed to the `<endpoint>Uri` helper. Only used when `preserveUriTemplate` is `false`, in which
   * case the expanded URI is built by the helper.
   */
  parameters: ApiParameterWithMultipartInfo[];
};

/**
 * Arguments for `getUriPathVariablesValue`. `endpoint` is the operation whose path parameters become a `mapOf` of URI
 * variables, or nothing when it has no path parameters.
 */
export type GetUriPathVariablesValue = { endpoint: ApiEndpoint };

/**
 * Arguments for `getUriQueryParameterCalls`. `endpoint` is the operation whose query parameters become `queryParam`
 * calls, or nothing when it has no query parameters.
 */
export type GetUriQueryParameterCalls = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointUriFunctionName`. `endpoint` is the operation whose name, with the `Uri` suffix
 * added, names the URI helper function.
 */
export type GetEndpointUriFunctionName = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointUriFunction`, which generates the `<endpoint>Uri` helper that returns the expanded URI.
 */
export type GetEndpointUriFunction = {
  /**
   * The operation the URI helper is generated for.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameters of the helper, filtered to the path and query parameters.
   */
  parameters: ApiParameterWithMultipartInfo[];
};

/**
 * Arguments for `getEndpointUriFunctionBody`, which builds the `UriComponentsBuilder` chain of the URI helper.
 */
export type GetEndpointUriFunctionBody = {
  /**
   * The operation whose path and query parameters the URI helper expands.
   */
  endpoint: ApiEndpoint;
  /**
   * Not read by the body, which takes the path and query parameters from the endpoint itself.
   */
  parameters: ApiParameterWithMultipartInfo[];
};

/**
 * Arguments for `getParameterToString`, which returns the suffix that converts a parameter value to a string, such as
 * `.toString()`, `.value` or `.joinToString(",")`.
 */
export type GetParameterToString = {
  /**
   * The operation the parameter belongs to.
   */
  endpoint: ApiEndpoint;
  /**
   * The path, query or header parameter whose value is converted.
   */
  parameter: ApiParameterWithMultipartInfo;
};

/**
 * Empty arguments for a `getAdditionalClientMembers` hook. The default generator does not define this method, so the
 * type exists only for subclasses that add it.
 */
export type GetAdditionalClientMembers = object;

/**
 * Arguments for `getParameterType`, which returns the Kotlin type of a parameter. `endpoint` is the operation
 * the parameter belongs to, and `parameter` is the one whose type is needed. File parts resolve to `ApiRequestFile`.
 */
export type GetParameterType = { endpoint: ApiEndpoint; parameter: ApiParameterWithMultipartInfo };

/**
 * Arguments for a `getRequestBodyType` hook. `endpoint` is the operation whose request body type is wanted. The default
 * generator does not define or call this method, so the type exists only for subclasses that add it.
 */
export type GetRequestBodyType = { endpoint: ApiEndpoint };

/**
 * Arguments for `getParameterDefaultValue`, which returns the default value expression of an optional parameter.
 */
export type GetParameterDefaultValue = {
  /**
   * The operation the parameter belongs to.
   */
  endpoint: ApiEndpoint;
  /**
   * The parameter whose default value expression is needed. Required parameters have no default.
   */
  parameter: ApiParameter;
};

/**
 * Arguments for `getTypeUsage`, which returns the Kotlin type a schema is used as, with the nullability adjusted.
 *
 * @template TBuilder The type of the source builder the Kotlin type is written to.
 */
export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  /**
   * The schema to map to a Kotlin type. An `undefined` schema uses the fallback.
   */
  schema: ApiSchema | undefined;
  /**
   * Overrides the nullability of the mapped type. When omitted the mapped type keeps its own nullability.
   */
  nullable?: boolean;
  /**
   * The type used when the schema maps to no model type.
   * @default kt.refs.any({ nullable }), i.e. `Any` with the given nullability
   */
  fallback?: kt.Type<TBuilder>;
};

/**
 * Empty arguments for `getPackageName`, which combines `packageName` and `packageSuffix` into the service's package.
 */
export type GetPackageName = object;

/**
 * Arguments for `getResponseSchema`. `endpoint` is the operation whose first successful response (a 2xx or unspecified
 * status) supplies the schema of the response body.
 */
export type GetResponseSchema = { endpoint: ApiEndpoint };

/**
 * Arguments for `getSchemaType`. `schema` is the schema whose Kotlin model reference is looked up in `kotlin.models`,
 * or `undefined` when there is no schema.
 */
export type GetSchemaType = { schema: ApiSchema | undefined };

/**
 * Arguments for `getAllParameters`. `endpoint` is the operation whose query, path and header parameters are collected,
 * together with its request body, or with the fields of a multipart request body.
 */
export type GetAllParameters = { endpoint: ApiEndpoint };

/**
 * Arguments for `getRequestBodyParamName`. `endpoint` is the operation whose request body parameter is named after its
 * model type, or `body` when there is no model type or it is `Any`.
 */
export type GetRequestBodyParamName = { endpoint: ApiEndpoint };

/**
 * Arguments for `getEndpointDocDescription`. `endpoint` is the operation whose description, and its source line when
 * `includeSourceInDocs` is set, becomes the KDoc of its functions.
 */
export type GetEndpointDocDescription = { endpoint: ApiEndpoint };

/**
 * Empty arguments for `getBasePath`, which derives a base path from the service's first server URL. The default
 * generator does not call it, so the base path it returns is not written into the generated code.
 */
export type GetBasePath = object;

/**
 * Arguments for `getEndpointPath`. `endpoint` is the operation whose path, without its leading slashes and after
 * `pathModifier`, becomes the URI template.
 */
export type GetEndpointPath = { endpoint: ApiEndpoint };

/**
 * Arguments for `getFilePath`. `packageName` is the package whose directory, under `outputDir`, receives the requests
 * object file.
 */
export type GetFilePath = { packageName: string };

/**
 * Empty arguments for `getRequestsObjectName`, which names the requests object after the service, cased with
 * `typeNameCasing`.
 */
export type GetRequestsObjectName = object;
