import type { ApiContent, ApiEndpoint, ApiParameter, ApiSchema, AppendValue, SourceBuilder } from '@goast/core';

import type { go } from '../../ast/index.ts';
import type { GoFileBuilder } from '../../file-builder.ts';
import type { GoClientFormField, GoClientOperation, GoClientParameter } from './operation.ts';

/** The arguments for the content of a client file. */
export type GetFileContent = {
  /** The name of the client type. */
  clientName: string;
  /** The name of the constructor of the client. */
  constructorName: string;
  /** The name of the constant holding the default base URL. */
  baseUrlName: string;
  /** The operations of the service, one method each. */
  operations: GoClientOperation[];
};

/** The arguments for the constant holding the default base URL. */
export type GetBaseUrlConstant = {
  /** The name of the client type. */
  clientName: string;
  /** The name of the constructor of the client. */
  constructorName: string;
  /** The name of the constant. */
  baseUrlName: string;
};

/** The arguments for the default base URL of a service. It is computed from the service alone, so none are needed. */
export type GetBaseUrl = object;

/** The arguments for the declaration of the client type. */
export type GetClientStruct = {
  /** The name of the client type. */
  clientName: string;
};

/** The arguments for the constructor of the client. */
export type GetConstructor = {
  /** The name of the client type. */
  clientName: string;
  /** The name of the constructor. */
  constructorName: string;
  /** The name of the constant holding the default base URL. */
  baseUrlName: string;
};

/** The arguments for building the operation of an endpoint. */
export type GetOperation = {
  /** The endpoint to build the operation for. */
  endpoint: ApiEndpoint;
};

/** The arguments for the declarations of an operation, its params struct and its multipart struct. */
export type GetOperationDeclarations = {
  /** The operation to declare. */
  operation: GoClientOperation;
};

/** The arguments for the parameters of an endpoint. */
export type GetParameters = {
  /** The endpoint whose parameters are returned. */
  endpoint: ApiEndpoint;
};

/** The arguments for how a parameter is encoded. */
export type GetParameterEncoding = {
  /** The parameter to encode. */
  parameter: ApiParameter;
};

/** The arguments for the function formatting a single value. */
export type GetFormatFunction = {
  /** The schema of the value, which determines how it is formatted. */
  schema: ApiSchema | undefined;
  /** The Go type the value is held in. */
  type: go.Type<SourceBuilder>;
};

/** The arguments for the parts of the path of an operation. */
export type GetPathParts = {
  /** The path of the endpoint after the path modifier. */
  path: string;
  /** The named parameters of the operation. */
  parameters: GoClientParameter[];
};

/** The arguments for the params struct of an operation. */
export type GetParamsStruct = {
  /** The operation whose params struct is declared. */
  operation: GoClientOperation;
};

/** The arguments for the method of an operation. */
export type GetMethod = {
  /** The name of the client type, the receiver of the method. */
  clientName: string;
  /** The operation the method is for. */
  operation: GoClientOperation;
};

/** The arguments for the parameters and results of the method of an operation. */
export type GetMethodSignature = {
  /** The operation the method is for. */
  operation: GoClientOperation;
};

/** The arguments for the documentation of the method of an operation. */
export type GetMethodDocText = {
  /** The operation the method is for. */
  operation: GoClientOperation;
};

/** The arguments for the body of the method of an operation. */
export type GetMethodBody = {
  /** The operation the method is for. */
  operation: GoClientOperation;
};

/** The arguments for the values a method returns. */
export type GetZeroValues = {
  /** The operation the method is for. */
  operation: GoClientOperation;
  /** The expression of the error, e.g. `nil` or `err`. */
  error: AppendValue<GoFileBuilder>;
};

/** The arguments for the zero value of a type. */
export type GetZeroValue = {
  /** The type whose zero value is taken. */
  type: go.Type<SourceBuilder>;
  /** The schema of the type, if there is one. */
  schema?: ApiSchema | undefined;
};

/** The arguments for the request body of an operation. */
export type GetBody = {
  /** The endpoint of the operation. */
  endpoint: ApiEndpoint;
  /** The name of the operation, which prefixes the name of the multipart struct. */
  name: string;
};

/** The arguments for a URL-encoded form body. */
export type GetFormBody = {
  /** The media type and schema of the body. */
  content: ApiContent;
};

/** The arguments for the fields of a multipart body. */
export type GetMultipartFields = {
  /** The object schema of the body. */
  object: ApiSchema<'object'>;
};

/** The arguments for one field of a form or multipart body. */
export type GetFormField = {
  /** The name of the field in the form, which is the name of the property. */
  name: string;
  /** The name of the field of the struct the value is read from. */
  fieldName: string;
  /** The type of that field, if a model gives it. Otherwise the field is typed by the schema. */
  fieldType?: go.Type<SourceBuilder>;
  /** The schema of the property. */
  schema: ApiSchema;
  /** Whether the property is required. */
  required: boolean;
};

/** The arguments for the struct of a multipart body. */
export type GetFormStruct = {
  /** The operation whose multipart struct is declared. */
  operation: GoClientOperation;
};

/** The arguments for the success response of an endpoint. */
export type GetSuccess = {
  /** The endpoint of the operation. */
  endpoint: ApiEndpoint;
};

/** The arguments for the error responses of an endpoint. */
export type GetErrorResponses = {
  /** The endpoint of the operation. */
  endpoint: ApiEndpoint;
};

/** The arguments for the Go type of a schema. */
export type GetSchemaType = {
  /** The schema whose type is taken. */
  schema: ApiSchema;
};

/** The arguments for resolving a schema. */
export type ResolveSchema = {
  /** The schema to resolve. */
  schema: ApiSchema | undefined;
};

/** The arguments for the object a schema describes. */
export type GetObjectSchema = {
  /** The schema of the object. */
  schema: ApiSchema | undefined;
};

/** The arguments for the documentation text of an endpoint. */
export type GetEndpointDocText = {
  /** The endpoint whose documentation is taken. */
  endpoint: ApiEndpoint;
};

/** The arguments for the statements creating the request of an operation. */
export type GetRequestStatements = {
  /** The operation of the request. */
  operation: GoClientOperation;
};

/** The arguments for the expression of the path of an operation. */
export type GetPathExpression = {
  /** The operation whose path is built. */
  operation: GoClientOperation;
};

/** The arguments for the expression of the values of a parameter. */
export type GetParameterValues = {
  /** The parameter whose values are built. */
  parameter: GoClientParameter;
  /** The Go expression of the value of the parameter, e.g. `id` or `*params.Limit`. */
  expression: string;
};

/** The arguments for the statement adding a parameter to the request. */
export type GetParameterStatement = {
  /** The query, header or cookie parameter to add. */
  parameter: GoClientParameter;
  /** The Go expression of the value of the parameter, e.g. `q` or `*params.Limit`. */
  expression: string;
};

/** The arguments for the statement setting the body of the request. */
export type GetBodyStatement = {
  /** The operation whose body is set. */
  operation: GoClientOperation;
};

/** The arguments for the statement writing a multipart body. */
export type GetMultipartStatement = {
  /** The operation whose multipart body is written. */
  operation: GoClientOperation;
};

/** The arguments for the statement adding one field of a form or multipart body. */
export type GetFormFieldStatement = {
  /** The operation the body belongs to. */
  operation: GoClientOperation;
  /** The field to add. */
  field: GoClientFormField;
  /** Whether the field is written as a part of a multipart body, rather than added to the values of a form. */
  multipart: boolean;
};

/** The arguments for the statements sending the request and handling the response. */
export type GetResponseStatements = {
  /** The operation of the method. */
  operation: GoClientOperation;
};

/** The arguments for the function decoding the body of an error response. */
export type GetErrorValueFunction = {
  /** The operation of the method, whose error responses are matched. */
  operation: GoClientOperation;
};

/** The arguments for the statement decoding the success response. */
export type GetSuccessStatement = {
  /** The operation of the method, whose success response is decoded. */
  operation: GoClientOperation;
};
