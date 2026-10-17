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

export type GetFileContent = {
  interfaceName: string;
  registerFunctionName: string;
  operations: GoOperation[];
};

export type GetServiceInterface = {
  interfaceName: string;
  operations: GoOperation[];
};

export type GetServiceMethod = {
  operation: GoOperation;
};

export type GetRegisterFunction = {
  interfaceName: string;
  registerFunctionName: string;
  operations: GoOperation[];
};

export type GetOperation = {
  endpoint: ApiEndpoint;
};

export type GetOperationDeclarations = {
  operation: GoOperation;
};

export type GetParameters = {
  endpoint: ApiEndpoint;
};

export type GetRoute = {
  endpoint: ApiEndpoint;
  /** The name of the operation. */
  name: string;
};

export type GetBasePath = object;

export type GetRequestStruct = {
  operation: GoOperation;
};

export type GetBodyStruct = {
  operation: GoOperation;
  body: GoOperationBody;
};

export type GetDecodeFunction = {
  operation: GoOperation;
};

export type GetDecodeStatement = {
  /** What the decoded value is assigned to, e.g. `req.ID`. */
  target: string;
  /** The call returning the value and an error. */
  call: AppendValue<GoFileBuilder>;
};

export type GetDecodeCall = {
  decoding: GoValueDecoding;
  /** Where the value is, for the error: `path`, `query`, `header`, `cookie` or `body`. */
  location: string;
  name: string;
  /** The expression for the raw values. */
  values: AppendValue<GoFileBuilder>;
};

export type GetParameterValues = {
  parameter: ApiParameter;
  route: GoOperationRoute;
  decoding: GoValueDecoding;
};

export type GetParameterDecoding = {
  parameter: ApiParameter;
};

export type GetValueDecoding = {
  schema: ApiSchema | undefined;
  required: boolean;
  /** Whether a value that is no primitive may be parsed as JSON. */
  allowJson: boolean;
  /** The type of the field the value is decoded into, if it is given (by a model). */
  fieldType?: go.Type<SourceBuilder>;
};

export type GetParseFunction = {
  schema: ApiSchema | undefined;
  type: go.Type<SourceBuilder>;
};

export type GetDefaultValue = {
  schema: ApiSchema | undefined;
};

export type GetBodies = {
  endpoint: ApiEndpoint;
  name: string;
  /** Names of the request struct the body fields must not use. */
  reservedFieldNames: string[];
};

export type GetBodyKind = {
  content: ApiContent;
};

export type GetBodyType = {
  content: ApiContent;
  kind: GoOperationBody['kind'];
  /** The name of the operation. */
  name: string;
};

export type GetMultipartFieldDecoding = {
  schema: ApiSchema;
  required: boolean;
};

export type GetBodyDecoding = {
  operation: GoOperation;
};

export type GetBodyCaseStatements = {
  operation: GoOperation;
  body: GoOperationBody;
};

export type GetBodyFieldStatement = {
  body: GoOperationBody;
  field: GoBodyField;
};

export type GetResponses = {
  endpoint: ApiEndpoint;
  name: string;
};

export type GetResponseBody = {
  response: ApiResponse;
};

export type GetResponseInterface = {
  operation: GoOperation;
};

export type GetResponseStruct = {
  operation: GoOperation;
  response: GoOperationResponse;
};

export type GetResponseWriteMethod = {
  operation: GoOperation;
  response: GoOperationResponse;
};

export type GetSchemaType = {
  schema: ApiSchema;
};

export type ResolveSchema = {
  schema: ApiSchema | undefined;
};

export type GetObjectSchema = {
  schema: ApiSchema | undefined;
};

export type GetEndpointDocText = {
  endpoint: ApiEndpoint;
};
