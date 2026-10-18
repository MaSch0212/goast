import type { ApiEndpoint, ApiParameter, ApiSchema, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

/**
 * Arguments of `getClientFileContent`, which builds the content of a client file. It has no properties, because the
 * generator context provides everything the method needs.
 */
export type GetClientFileContent = object;

/**
 * Arguments of `getClientClass`, which builds the client class with its primary constructor, companion object and
 * members. It has no properties.
 */
export type GetClientClass = object;

/**
 * Arguments of `getClientCompanionObject`, which builds the companion object that holds `defaultBasePath`.
 * It has no properties.
 */
export type GetClientCompanionObject = object;

/**
 * Arguments of `getEndpointClientMembers`, which returns the three members generated for one endpoint: the endpoint
 * method, its `WithHttpInfo` method and its private `RequestConfig` method.
 * @property endpoint The endpoint to generate the members for.
 * @property parameters The method parameters of the endpoint, as returned by `getAllParameters`.
 */
export type GetEndpointClientMembers = { endpoint: ApiEndpoint; parameters: ApiParameter[] };

/**
 * Arguments of `getEndpointClientMethod`, which builds the endpoint method that returns the response data directly.
 */
export type GetEndpointClientMethod = {
  /** The endpoint the method is generated for. */
  endpoint: ApiEndpoint;
  /** The method parameters, with required parameters first, as returned by `getAllParameters`. */
  parameters: ApiParameter[];
  /** The schema of the 2xx or default response, or `undefined` when that response has no schema. */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments of `getEndpointClientMethodBody`, which builds the body of the endpoint method. The body calls the
 * `WithHttpInfo` method and returns its data, or throws for error responses.
 */
export type GetEndpointClientMethodBody = {
  /** The endpoint whose method body is generated. */
  endpoint: ApiEndpoint;
  /** The parameters to pass on to the `WithHttpInfo` method, in the same order. */
  parameters: ApiParameter[];
  /** The schema that the successful response data is cast to. `undefined` makes the method return `Unit`. */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments of `getEndpointClientHttpInfoMethod`, which builds the `{name}WithHttpInfo` method. Unlike the endpoint
 * method, it returns the whole `ApiResponse`, not only its data.
 */
export type GetEndpointClientHttpInfoMethod = {
  /** The endpoint the method is generated for. */
  endpoint: ApiEndpoint;
  /** The method parameters, which keep their names and types in the generated method. */
  parameters: ApiParameter[];
  /**
   * The schema of the response data. The data type of the generated return type is always nullable, and `undefined`
   * falls back to `Unit?`.
   */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments of `getEndpointClientHttpInfoMethodBody`, which builds the body of the `WithHttpInfo` method. The body
 * creates the request config with the `RequestConfig` method and sends it with `request`.
 */
export type GetEndpointClientHttpInfoMethodBody = {
  /** The endpoint whose request is sent. */
  endpoint: ApiEndpoint;
  /** The parameters to forward to the private `RequestConfig` method. */
  parameters: ApiParameter[];
  /** The schema used as the response type argument of `request`. `undefined` uses `Unit`. */
  responseSchema: ApiSchema | undefined;
};

/**
 * Arguments of `getEndpointClientRequestConfigMethod`, which builds the private `{name}RequestConfig` method. That
 * method returns the `RequestConfig` for one call of the endpoint.
 */
export type GetEndpointClientRequestConfigMethod = {
  /** The endpoint the request config is built for. */
  endpoint: ApiEndpoint;
  /** The method parameters, including the path parameters that the request path interpolates. */
  parameters: ApiParameter[];
};

/**
 * Arguments of `getEndpointClientRequestConfigMethodBody`, which builds the body of the `RequestConfig` method. It
 * collects the query, header and body values, and sets the HTTP method and the interpolated path.
 */
export type GetEndpointClientRequestConfigMethodBody = {
  /** The endpoint whose HTTP method and path the request config uses. */
  endpoint: ApiEndpoint;
  /** The parameters whose values are written to the query, header or body. Multipart fields carry `multipart` info. */
  parameters: ApiParameterWithMultipartInfo[];
};

/**
 * Arguments of `getParameterToString`, which returns the expression that converts a parameter value into a string.
 */
export type GetParameterToString = {
  /** The endpoint that declares the parameter. */
  endpoint: ApiEndpoint;
  /**
   * The parameter whose value is converted. String enums use `.value`, arrays are joined with `,`, and other values
   * use `.toString()`.
   */
  parameter: ApiParameter;
};

/**
 * Arguments of `getAdditionalClientMembers`, which returns extra members added to every client class, such as the
 * private `encodeURIComponent` helper. It has no properties.
 */
export type GetAdditionalClientMembers = object;

/**
 * Arguments of `getParameterType`, which returns the Kotlin type of a method parameter.
 * @property endpoint The endpoint that declares the parameter.
 * @property parameter The parameter to type. A file part of a multipart request becomes `java.io.File`.
 */
export type GetParameterType = { endpoint: ApiEndpoint; parameter: ApiParameterWithMultipartInfo };

/**
 * Arguments of `getRequestBodyType`, which returns the Kotlin type of the request body. A `multipart/form-data` body
 * becomes a map of part configs.
 * @property endpoint The endpoint whose request body type is returned.
 */
export type GetRequestBodyType = { endpoint: ApiEndpoint };

/**
 * Arguments of `getParameterDefaultValue`, which returns the default value expression of a parameter.
 */
export type GetParameterDefaultValue = {
  /** The endpoint that declares the parameter. */
  endpoint: ApiEndpoint;
  /** The parameter whose default value is returned. Required parameters have no default value. */
  parameter: ApiParameter;
};

/**
 * Arguments of `getTypeUsage`, which returns the Kotlin type used for a schema.
 * @template TBuilder The type of the source builder the type is written to.
 */
export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  /** The schema to map to a Kotlin type. `undefined` uses `fallback`. */
  schema: ApiSchema | undefined;
  /** Whether the type is nullable. When omitted, the nullability of the mapped type is kept. */
  nullable?: boolean;
  /** The type to use when no type is mapped. Defaults to `Any`, nullable when `nullable` is set. */
  fallback?: kt.Type<TBuilder>;
};

/**
 * Arguments of `getPackageName`, which returns the package of the client class. It has no properties.
 */
export type GetPackageName = object;

/**
 * Arguments of `getPathWithInterpolation`, which returns the endpoint path with each path parameter replaced by an
 * `encodeURIComponent` template expression.
 * @property endpoint The endpoint whose path is interpolated.
 */
export type GetPathWithInterpolation = { endpoint: ApiEndpoint };

/**
 * Arguments of `getResponseSchema`, which returns the schema of the successful response.
 * @property endpoint The endpoint whose response schema is looked up. The first 2xx or default response is used.
 */
export type GetResponseSchema = { endpoint: ApiEndpoint };

/**
 * Arguments of `getSchemaType`, which returns the Kotlin type reference of a schema.
 * @property schema The schema to look up in the models output. `undefined` yields `undefined`.
 */
export type GetSchemaType = { schema: ApiSchema | undefined };

/**
 * Arguments of `getAllParameters`, which returns the method parameters of an endpoint.
 * @property endpoint The endpoint whose query, path and header parameters and request body are returned.
 */
export type GetAllParameters = { endpoint: ApiEndpoint };

/**
 * Arguments of `getRequestBodyParamName`, which returns the name of the request body parameter.
 * @property endpoint The endpoint whose request body parameter is named.
 */
export type GetRequestBodyParamName = { endpoint: ApiEndpoint };

/**
 * Arguments of `getEndpointDocDescription`, which returns the doc text of an endpoint method.
 * @property endpoint The endpoint whose description is used. The source path is appended when `includeSourceInDocs`
 * is set.
 */
export type GetEndpointDocDescription = { endpoint: ApiEndpoint };

/**
 * Arguments of `getBasePath`, which returns the base path of a client. It has no properties, because the service is
 * read from the generator context.
 */
export type GetBasePath = object;

/**
 * Arguments of `getEndpointPath`, which returns an endpoint path after `pathModifier` is applied.
 * @property endpoint The endpoint whose path is modified.
 */
export type GetEndpointPath = { endpoint: ApiEndpoint };

/**
 * Arguments of `getFilePath`, which returns the output file path of a client class.
 * @property packageName The package of the client class, which becomes the directory below `outputDir`.
 */
export type GetFilePath = { packageName: string };

/**
 * Arguments of `getApiClientName`, which returns the class name of a client. It has no properties.
 */
export type GetApiClientName = object;
