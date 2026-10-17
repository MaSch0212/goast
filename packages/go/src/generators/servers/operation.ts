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

export type GoOperationParameter = {
  parameter: ApiParameter;
  fieldName: string;
  decoding: GoValueDecoding;
  /** The expression for the raw values of the parameter, a `[]string`. */
  values: AppendValue<GoFileBuilder>;
};

/** A field of a struct decoded from a form or multipart body. */
export type GoBodyField = {
  /** The name of the form field (the property name). */
  name: string;
  fieldName: string;
  /** How the value is decoded, `file` and `files` being the files of a multipart field. */
  decoding: GoValueDecoding | { mode: 'file' | 'files'; fieldType: go.Type<SourceBuilder>; required: boolean };
  description: string | undefined;
  deprecated: boolean;
};

export type GoOperationBody = {
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

export type GoOperationResponseHeader = {
  header: ApiHeader;
  fieldName: string;
  type: go.Type<SourceBuilder>;
};

export type GoOperationResponse = {
  /** `null` for the response generated for an operation that declares none. */
  response: ApiResponse | null;
  typeName: string;
  /** The status: a fixed code, or the code a `StatusCode` field falls back to. */
  status: { kind: 'fixed'; code: number } | { kind: 'variable'; fallback: number };
  body: {
    kind: 'json' | 'text' | 'raw';
    type: go.Type<SourceBuilder>;
    contentType: string;
  } | null;
  headers: GoOperationResponseHeader[];
};

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
  endpoint: ApiEndpoint;
  /** The name of the method of the service interface. */
  name: string;
  requestTypeName: string;
  responseTypeName: string;
  decodeFunctionName: string;
  writeMethodName: string;
  route: GoOperationRoute;
  parameters: GoOperationParameter[];
  /** Parameters whose schema is not supported, which are not decoded. */
  skippedParameters: ApiParameter[];
  bodies: GoOperationBody[];
  bodyRequired: boolean;
  responses: GoOperationResponse[];
  /** Whether the types of the operation are declared already (by the file of another service). */
  declared: boolean;
};
