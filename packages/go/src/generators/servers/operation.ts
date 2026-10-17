import type {
  ApiContent,
  ApiEndpoint,
  ApiHeader,
  ApiParameter,
  ApiResponse,
  AppendValue,
  SourceBuilder,
} from '@goast/core';

import type { go } from '../../ast/index.ts';
import type { GoFileBuilder } from '../../file-builder.ts';

/**
 * How a value from the request (a parameter, or a field of a form or multipart body) is decoded into a field:
 * - `required`: a single value that must be present.
 * - `optional`: a single value, `nil` when absent.
 * - `default`: a single value, `defaultValue` when absent.
 * - `array`: all values, `nil` when absent and not required.
 */
export type GoValueDecoding = {
  /** How the value is decoded, see the list above. */
  mode: 'required' | 'optional' | 'default' | 'array';
  /** The type of the field. */
  fieldType: go.Type<SourceBuilder>;
  /** The function parsing one value, e.g. `parseInt[int32]`. */
  parse: AppendValue<GoFileBuilder>;
  /** The literal of the value used when the value is absent (`mode: 'default'`). */
  defaultValue?: string;
  /** Whether the value must be present (`mode: 'array'`). */
  required: boolean;
};

/** A parameter of an operation, decoded into a field of its request struct. */
export type GoOperationParameter = {
  /** The parameter in the API description, from the path, query, header or cookie. */
  parameter: ApiParameter;
  /** The name of the field of the request struct the value is decoded into. */
  fieldName: string;
  /** How the value is decoded into the field. */
  decoding: GoValueDecoding;
  /** The expression for the raw values of the parameter, a `[]string`. */
  values: AppendValue<GoFileBuilder>;
};

/** A field of a struct decoded from a form or multipart body. */
export type GoBodyField = {
  /** The name of the form field (the property name). */
  name: string;
  /** The name of the field of the struct. */
  fieldName: string;
  /** How the value is decoded, `file` and `files` being the files of a multipart field. */
  decoding: GoValueDecoding | { mode: 'file' | 'files'; fieldType: go.Type<SourceBuilder>; required: boolean };
  /** The description of the property in the API description, `undefined` if it has none. */
  description: string | undefined;
  /** Whether the property is marked as deprecated in the API description. */
  deprecated: boolean;
};

/** A request body of an operation, one for each media type the request body declares. */
export type GoOperationBody = {
  /** The media type and schema of the body in the API description. */
  content: ApiContent;
  /** How the body is decoded, by its media type. */
  kind: 'json' | 'form' | 'multipart' | 'text' | 'raw';
  /** The field of the request the body is decoded into. Several media types can share a field. */
  fieldName: string;
  /** The type of the decoded body. */
  type: go.Type<SourceBuilder>;
  /** The type of the field, a pointer to `type` if the body is optional. */
  fieldType: go.Type<SourceBuilder>;
  /** The fields of a form or multipart body decoded into a struct, `null` if it is decoded as a whole. */
  fields: GoBodyField[] | null;
  /** The struct the generator declares for a multipart body, `null` for other bodies. */
  declaredStructName: string | null;
};

/** A header of a response, written to a field of the response struct. */
export type GoOperationResponseHeader = {
  /** The header in the API description. */
  header: ApiHeader;
  /** The name of the field of the response struct. */
  fieldName: string;
  /** The type of the field: a pointer to the header's type, unless the header is required or the type is nilable. */
  type: go.Type<SourceBuilder>;
};

/** A response of an operation, one for each status the operation declares. */
export type GoOperationResponse = {
  /** `null` for the response generated for an operation that declares none. */
  response: ApiResponse | null;
  /** The name of the response struct. */
  typeName: string;
  /** The status: a fixed code, or the code a `StatusCode` field falls back to. */
  status: { kind: 'fixed'; code: number } | { kind: 'variable'; fallback: number };
  /**
   * The body of the response, taken from its first JSON media type or else from its first media type. `null` if the
   * response has no body.
   */
  body: {
    kind: 'json' | 'text' | 'raw';
    type: go.Type<SourceBuilder>;
    contentType: string;
  } | null;
  /** The headers of the response, without `Content-Type`. */
  headers: GoOperationResponseHeader[];
};

/** How the path of an operation is routed on the `*http.ServeMux`. */
export type GoOperationRoute = {
  /** The pattern for `http.ServeMux`, without method and base path, e.g. `/pets/{id}`. */
  pattern: string;
  /** For each path parameter, how its raw value is taken from the matched path. */
  parameters: Map<string, { wildcard: string } | { wildcard: string; patternVariable: string; group: number }>;
  /** Package-level regular expressions for path segments that contain a parameter and other text. */
  segmentPatterns: { variable: string; regex: string }[];
};

/** Everything generated for one endpoint. */
export type GoOperation = {
  /** The endpoint of the API description the operation is generated for. */
  endpoint: ApiEndpoint;
  /** The name of the method of the service interface. */
  name: string;
  /** The name of the request struct. */
  requestTypeName: string;
  /** The name of the response interface, which every response struct implements. */
  responseTypeName: string;
  /** The name of the function decoding the request from an `*http.Request`. */
  decodeFunctionName: string;
  /** The name of the method writing a response, derived from `responseTypeName`. */
  writeMethodName: string;
  /** How the operation is routed on the `*http.ServeMux`. */
  route: GoOperationRoute;
  /** The parameters decoded into the request struct. */
  parameters: GoOperationParameter[];
  /** Parameters whose schema is not supported, which are not decoded. */
  skippedParameters: ApiParameter[];
  /** The request bodies, one for each media type. */
  bodies: GoOperationBody[];
  /** Whether the request body is required, by the `required` flag of the API description. */
  bodyRequired: boolean;
  /** The responses, one for each declared status. */
  responses: GoOperationResponse[];
  /** Whether the types of the operation are declared already (by the file of another service). */
  declared: boolean;
};
