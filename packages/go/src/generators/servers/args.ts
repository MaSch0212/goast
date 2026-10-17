import type {
  ApiContent,
  ApiEndpoint,
  ApiParameter,
  ApiResponse,
  ApiSchema,
  AppendValue,
  SourceBuilder,
} from '@goast/core';

import type { go } from '../../ast/index.ts';
import type { GoFileBuilder } from '../../file-builder.ts';
import type {
  GoBodyField,
  GoOperation,
  GoOperationBody,
  GoOperationResponse,
  GoOperationRoute,
  GoValueDecoding,
} from './operation.ts';

/** The arguments for the content of a service file. */
export type GetFileContent = {
  /** The name of the service interface. */
  interfaceName: string;
  /** The name of the register function. */
  registerFunctionName: string;
  /** The operations of the service. */
  operations: GoOperation[];
};

/** The arguments for the declaration of a service interface. */
export type GetServiceInterface = {
  /** The name of the service interface. */
  interfaceName: string;
  /** The operations of the service, one method each. */
  operations: GoOperation[];
};

/** The arguments for the method of the service interface of an operation. */
export type GetServiceMethod = {
  /** The operation the method is for. */
  operation: GoOperation;
};

/** The arguments for the register function of a service. */
export type GetRegisterFunction = {
  /** The name of the service interface, the type of the `svc` parameter. */
  interfaceName: string;
  /** The name of the register function. */
  registerFunctionName: string;
  /** The operations of the service to register. */
  operations: GoOperation[];
};

/** The arguments for building the operation of an endpoint. */
export type GetOperation = {
  /** The endpoint to build the operation for. */
  endpoint: ApiEndpoint;
};

/** The arguments for the declarations of an operation, its request, response and decoding code. */
export type GetOperationDeclarations = {
  /** The operation to declare. */
  operation: GoOperation;
};

/** The arguments for the parameters of an endpoint. */
export type GetParameters = {
  /** The endpoint whose parameters are returned. */
  endpoint: ApiEndpoint;
};

/** The arguments for the route of an endpoint. */
export type GetRoute = {
  /** The endpoint to route. */
  endpoint: ApiEndpoint;
  /** The name of the operation, which prefixes the names of its segment pattern variables. */
  name: string;
};

/** The arguments for the base path of a service. It is computed from the service alone, so none are needed. */
export type GetBasePath = object;

/** The arguments for the request struct of an operation. */
export type GetRequestStruct = {
  /** The operation whose request struct is declared. */
  operation: GoOperation;
};

/** The arguments for the struct of a multipart body. */
export type GetBodyStruct = {
  /** The operation the body belongs to. */
  operation: GoOperation;
  /** The body whose struct is declared. */
  body: GoOperationBody;
};

/** The arguments for the function decoding the request of an operation. */
export type GetDecodeFunction = {
  /** The operation whose request is decoded. */
  operation: GoOperation;
};

/** The arguments for one statement of the decoding function. */
export type GetDecodeStatement = {
  /** What the decoded value is assigned to, e.g. `req.ID`. */
  target: string;
  /** The call returning the value and an error. */
  call: AppendValue<GoFileBuilder>;
};

/** The arguments for the call decoding one value. */
export type GetDecodeCall = {
  /** How the value is decoded. */
  decoding: GoValueDecoding;
  /** Where the value is, for the error: `path`, `query`, `header`, `cookie` or `body`. */
  location: string;
  /** The name of the parameter or field the value comes from, for the error. */
  name: string;
  /** The expression for the raw values. */
  values: AppendValue<GoFileBuilder>;
};

/** The arguments for the expression of the raw values of a parameter. */
export type GetParameterValues = {
  /** The parameter the values are taken from. */
  parameter: ApiParameter;
  /** The route of the operation, which holds the path parameters. */
  route: GoOperationRoute;
  /** How the values are decoded. */
  decoding: GoValueDecoding;
};

/** The arguments for how a parameter is decoded. */
export type GetParameterDecoding = {
  /** The parameter to decode. */
  parameter: ApiParameter;
};

/** The arguments for how a single value is decoded. */
export type GetValueDecoding = {
  /** The schema of the value. */
  schema: ApiSchema | undefined;
  /** Whether the value must be present. */
  required: boolean;
  /** Whether a value that is no primitive may be parsed as JSON. */
  allowJson: boolean;
  /** The type of the field the value is decoded into, if it is given (by a model). */
  fieldType?: go.Type<SourceBuilder>;
};

/** The arguments for the function parsing a single value. */
export type GetParseFunction = {
  /** The schema of the value, which determines how it is parsed. */
  schema: ApiSchema | undefined;
  /** The Go type the value is parsed into. */
  type: go.Type<SourceBuilder>;
};

/** The arguments for the default value of a parameter or field. */
export type GetDefaultValue = {
  /** The schema whose `default` is written as a literal. */
  schema: ApiSchema | undefined;
};

/** The arguments for the request bodies of an operation. */
export type GetBodies = {
  /** The endpoint whose request body is decoded. */
  endpoint: ApiEndpoint;
  /** The name of the operation. */
  name: string;
  /** Names of the request struct the body fields must not use. */
  reservedFieldNames: string[];
};

/** The arguments for the kind of a request body. */
export type GetBodyKind = {
  /** The media type and schema of the body. */
  content: ApiContent;
};

/** The arguments for the type of a request body. */
export type GetBodyType = {
  /** The media type and schema of the body. */
  content: ApiContent;
  /** How the body is decoded. */
  kind: GoOperationBody['kind'];
  /** The name of the operation. */
  name: string;
};

/** The arguments for how a field of a multipart body is decoded. */
export type GetMultipartFieldDecoding = {
  /** The schema of the field. */
  schema: ApiSchema;
  /** Whether the field must be present. */
  required: boolean;
};

/** The arguments for the code decoding the request body of an operation. */
export type GetBodyDecoding = {
  /** The operation whose body is decoded. */
  operation: GoOperation;
};

/** The arguments for the statements of the case that decodes one request body, by its media type. */
export type GetBodyCaseStatements = {
  /** The operation whose bodies are decoded. */
  operation: GoOperation;
  /** The body the case is for. */
  body: GoOperationBody;
};

/** The arguments for the statement decoding one field of a form or multipart body. */
export type GetBodyFieldStatement = {
  /** The body the field belongs to. */
  body: GoOperationBody;
  /** The field to decode. */
  field: GoBodyField;
};

/** The arguments for the responses of an endpoint. */
export type GetResponses = {
  /** The endpoint whose responses are declared. */
  endpoint: ApiEndpoint;
  /** The name of the operation, which prefixes the names of the response structs. */
  name: string;
};

/** The arguments for the body of a response. */
export type GetResponseBody = {
  /** The response whose body is declared. */
  response: ApiResponse;
};

/** The arguments for the response interface of an operation. */
export type GetResponseInterface = {
  /** The operation whose response interface is declared. */
  operation: GoOperation;
};

/** The arguments for the struct of one response of an operation. */
export type GetResponseStruct = {
  /** The operation the response belongs to. */
  operation: GoOperation;
  /** The response whose struct is declared. */
  response: GoOperationResponse;
};

/** The arguments for the method writing one response of an operation. */
export type GetResponseWriteMethod = {
  /** The operation the response belongs to. */
  operation: GoOperation;
  /** The response to write. */
  response: GoOperationResponse;
};

/** The arguments for the Go type of a schema. */
export type GetSchemaType = {
  /** The schema to get the type of. */
  schema: ApiSchema;
};

/** The arguments for resolving a schema. */
export type ResolveSchema = {
  /** The schema to resolve, which may be undefined. */
  schema: ApiSchema | undefined;
};

/** The arguments for getting the object schema of a schema. */
export type GetObjectSchema = {
  /** The schema to get the object schema of, which may be undefined. */
  schema: ApiSchema | undefined;
};

/** The arguments for the doc text of an endpoint. */
export type GetEndpointDocText = {
  /** The endpoint to get the doc text of. */
  endpoint: ApiEndpoint;
};
