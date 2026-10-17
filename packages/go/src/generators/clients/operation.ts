import type { ApiContent, ApiEndpoint, ApiParameter, AppendValue, SourceBuilder } from '@goast/core';

import type { go } from '../../ast/index.ts';
import type { GoFileBuilder } from '../../file-builder.ts';

/**
 * A parameter of an operation that the client sends: a path parameter, or a query, header or cookie parameter. It is
 * passed as an argument of the method, or as a field of the params struct if it is optional.
 */
export type GoClientParameter = {
  /** The parameter in the API description. */
  parameter: ApiParameter;
  /**
   * The Go identifier of the parameter: the unexported name of the method argument for a path parameter or a required
   * one, or the exported name of the field of the params struct for an optional one.
   */
  name: string;
  /** The type of the value: a slice for an array, otherwise the type of the schema. */
  type: go.Type<SourceBuilder>;
  /** The function formatting one value, e.g. `formatInt`, without type arguments. */
  format: AppendValue<GoFileBuilder>;
  /** The function formatting one item of an array, with its type arguments, e.g. `formatInt[int32]`. */
  itemFormat: AppendValue<GoFileBuilder>;
  /** Whether the value is an array, which is sent as several values. */
  array: boolean;
};

/**
 * A field of a form or multipart body, which is sent as a form field or as a part:
 * - `value`: a value of a primitive type, formatted as text.
 * - `array`: a list of primitive values, sent as one field per value.
 * - `json`: any other value, sent as its JSON text.
 * - `file`: a file of a multipart body.
 * - `files`: a list of files of a multipart body.
 */
export type GoClientFormField = {
  /** The name of the form field, which is the name of the property. */
  name: string;
  /** The name of the field of the struct the value is read from. */
  fieldName: string;
  /** The type of that field. */
  type: go.Type<SourceBuilder>;
  /** How the field is sent, see the list above. */
  kind: 'value' | 'array' | 'json' | 'file' | 'files';
  /** The function formatting one value, e.g. `formatString`, without type arguments. */
  format: AppendValue<GoFileBuilder>;
  /** The function formatting one item of an array, with its type arguments, e.g. `formatString[string]`. */
  itemFormat: AppendValue<GoFileBuilder>;
  /** Whether the property is required. */
  required: boolean;
  /** The description of the property in the API description, `undefined` if it has none. */
  description: string | undefined;
  /** Whether the property is marked as deprecated in the API description. */
  deprecated: boolean;
};

/** The request body of an operation, taken from the media type the client prefers. */
export type GoClientBody = {
  /** The media type and schema of the body in the API description. */
  content: ApiContent;
  /** How the body is encoded, by its media type. */
  kind: 'json' | 'form' | 'multipart' | 'text' | 'raw';
  /** The type of the body, as the caller passes it, without the pointer of an optional body. */
  type: go.Type<SourceBuilder>;
  /** Whether the body is optional, in which case the method takes it behind a pointer and `nil` sends no body. */
  optional: boolean;
  /**
   * The fields of a form or multipart body that is built field by field, `null` if the body is sent as a whole (a
   * `url.Values` form, or a body of another kind).
   */
  fields: GoClientFormField[] | null;
};

/** What a response with a body is decoded into. */
export type GoClientSuccessBody = {
  /** The status of the response: a code, `range2` for `2XX`, or `default`. */
  status: number | 'range2' | 'default';
  /** How the body is decoded: `json` into a model, `text` into a string, `raw` into bytes. */
  kind: 'json' | 'text' | 'raw';
  /** The type the body is decoded into, a pointer if the model is a struct. */
  type: go.Type<SourceBuilder>;
};

/** The success response of an operation: the responses the client returns the body of. */
export type GoClientSuccess = {
  /**
   * The type the method returns: the type all success bodies share, `any` if they differ, or `null` if no success
   * response has a body, in which case the method returns only an error.
   */
  type: go.Type<SourceBuilder> | null;
  /** Whether the returned type is a pointer to a struct. */
  pointer: boolean;
  /** The success responses that have a body, one for each status. */
  byStatus: GoClientSuccessBody[];
};

/** A response whose body is decoded into `ResponseError.Value`. */
export type GoClientErrorResponse = {
  /** The status of the response: a code, a class (`{ range: 4 }` for `4XX`), or `default`. */
  status: number | { range: number } | 'default';
  /** The type of the JSON body of the response. */
  type: go.Type<SourceBuilder>;
};

/** Everything generated for one endpoint. */
export type GoClientOperation = {
  /** The endpoint of the API description the operation is generated for. */
  endpoint: ApiEndpoint;
  /** The name of the method of the client. */
  name: string;
  /** The name of the params struct, `null` if the operation has no optional parameters. */
  paramsTypeName: string | null;
  /** The name of the struct of a multipart body, `null` if the body is no multipart body with fields. */
  formTypeName: string | null;
  /** The path as literal text and path parameters, after the path modifier. */
  pathParts: (string | GoClientParameter)[];
  /** The arguments of the method after the context: the path parameters, then the required other parameters. */
  positional: GoClientParameter[];
  /** The optional query, header and cookie parameters, which are the fields of the params struct. */
  optional: GoClientParameter[];
  /** Parameters whose schema is not supported, which are not sent. */
  skippedParameters: ApiParameter[];
  /** The request body, `null` if the operation has none. */
  body: GoClientBody | null;
  /** The success response, which the method returns. */
  success: GoClientSuccess;
  /** The responses whose bodies are decoded into `ResponseError.Value`. */
  errors: GoClientErrorResponse[];
  /** Whether the params and form types of the operation are declared already (by the file of another service). */
  declared: boolean;
};
