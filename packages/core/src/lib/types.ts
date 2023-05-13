import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

import { Combine, OptionalProperties } from './type.utils.js';

export type ReferenceObject = Combine<
  [OpenAPIV2.ReferenceObject, OpenAPIV3.ReferenceObject, OpenAPIV3_1.ReferenceObject]
>;
type _Deref<T> = {
  [K in keyof T]: Deref<T[K]>;
};
export type Deref<T> = T extends object
  ? T extends (infer A)[]
    ? Deref<A>[]
    : _Deref<Exclude<T, ReferenceObject>> & ApiComponent
  : T;

export type OpenApiData = {
  services: ApiService[];
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
};

export type OpenApiVersion = '2.0' | '3.0' | '3.1';
export type ApiMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export type ApiParameterTarget = 'path' | 'query' | 'header' | 'cookie' | 'body' | 'form';

type TypeByApiVersion<V extends OpenApiVersion, T2, T3, T3_1> = V extends '2.0'
  ? T2
  : V extends '3.0'
  ? T3
  : V extends '3.1'
  ? T3_1
  : never;
export type ApiComponentSource<V extends OpenApiVersion, T2, T3, T3_1> = {
  file: string;
  path: string;
  version: V;
  component: TypeByApiVersion<V, T2, T3, T3_1>;
  reference?: TypeByApiVersion<V, OpenAPIV2.ReferenceObject, OpenAPIV3.ReferenceObject, OpenAPIV3_1.ReferenceObject>;
};

export type ApiComponent<T2 = unknown, T3 = unknown, T3_1 = unknown> = {
  id: string;
  $src: ApiComponentSource<OpenApiVersion, T2, T3, T3_1>;
};

export type ApiServiceComponent = OptionalProperties<
  ApiComponent<OpenAPIV2.TagObject, OpenAPIV3.TagObject, OpenAPIV3_1.TagObject>,
  '$src'
>;
export type ApiService = ApiServiceComponent & {
  name: string;
  description?: string;
  endpoints: ApiEndpoint[];
};

export type ApiPathComponent = ApiComponent<
  OpenAPIV2.PathItemObject,
  OpenAPIV3.PathItemObject,
  OpenAPIV3_1.PathItemObject
>;
export type ApiPath = ApiPathComponent & {
  summary?: string;
  description?: string;
  path: string;
  parameters: ApiParameter[];
} & { [K in ApiMethod]?: ApiEndpoint };

export type ApiEndpointComponent = ApiComponent<
  OpenAPIV2.OperationObject,
  OpenAPIV3.OperationObject,
  OpenAPIV3_1.OperationObject
>;
export type ApiEndpoint = ApiEndpointComponent & {
  name: string;
  path: string;
  pathInfo: ApiPath;
  method: ApiMethod;
  summary?: string;
  description?: string;
  parameters: ApiParameter[];
  deprecated: boolean;
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  tags: string[];
  custom: Record<string, unknown>;
};

export type ApiParameterComponent = ApiComponent<
  OpenAPIV2.ParameterObject,
  OpenAPIV3.ParameterObject,
  OpenAPIV3_1.ParameterObject
>;
export type ApiParameter = ApiParameterComponent & {
  name: string;
  target: ApiParameterTarget;
  description?: string;
  required: boolean;
  deprecated: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: ApiSchema;
};

export type ApiRequestBodyComponent = ApiComponent<never, OpenAPIV3.RequestBodyObject, OpenAPIV3_1.RequestBodyObject>;
export type ApiRequestBody = ApiRequestBodyComponent & {
  description?: string;
  content: ApiContent[];
  required: boolean;
};

export type ApiContentComponent = ApiComponent<never, OpenAPIV3.MediaTypeObject, OpenAPIV3_1.MediaTypeObject>;
export type ApiContent = ApiContentComponent & {
  type: string;
  schema?: ApiSchema;
};

export type ApiExampleComponent = ApiComponent<
  OpenAPIV2.ResponseObject,
  OpenAPIV3.ResponseObject,
  OpenAPIV3_1.ResponseObject
>;
export type ApiResponse = ApiExampleComponent & {
  statusCode?: number;
  description?: string;
  headers: ApiHeader[];
  contentOptions: ApiContent[];
};

export type ApiHeaderComponent = ApiComponent<OpenAPIV2.HeaderObject, OpenAPIV3.HeaderObject, OpenAPIV3_1.HeaderObject>;
export type ApiHeader = ApiHeaderComponent & Omit<ApiParameter, 'target'>;

export type ApiSchemaType = 'string' | 'number' | 'integer' | 'array' | 'boolean' | 'null' | 'object' | string;
export type ApiSchemaKind =
  | 'oneOf'
  | 'multi-type'
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'null'
  | 'object'
  | 'combined'
  | 'unknown';
export type ApiSchemaAccessibility = 'all' | 'readOnly' | 'writeOnly' | 'none';
export type ApiSchemaProperty = {
  name: string;
  schema: ApiSchema;
};
export type ApiSchemaComponent = ApiComponent<OpenAPIV2.SchemaObject, OpenAPIV3.SchemaObject, OpenAPIV3_1.SchemaObject>;
export type ApiSchemaBase = ApiSchemaComponent & {
  name: string;
  isNameGenerated: boolean;
  description?: string;
  deprecated: boolean;
  accessibility: ApiSchemaAccessibility;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  format?: string;
  nullable?: boolean;
  required: Set<string>;
  custom: Record<string, unknown>;
};
export type ApiSchema<T extends ApiSchemaKind = ApiSchemaKind> = ApiSchemaBase & ApiSchemaExtensions<T>;
type AdditionalCombinedSchemaProperties = {
  allOf: ApiSchema[];
  anyOf: ApiSchema[];
};
type AdditionalArraySchemaProperties = {
  items?: ApiSchema;
  minItems?: number;
  maxItems?: number;
};
type AdditionalObjectSchemaProperties = {
  properties: Map<string, ApiSchemaProperty>;
  additionalProperties?: boolean | ApiSchema;
} & AdditionalCombinedSchemaProperties;
type AdditionalNumberSchemaProperties = {
  minimum?: number;
  maximum?: number;
};
export type ApiSchemaExtensions<T extends ApiSchemaKind> = T extends 'oneOf'
  ? { kind: 'oneOf'; oneOf: ApiSchema[] }
  : T extends 'multi-type'
  ? {
      kind: 'multi-type';
      type: ApiSchemaType[];
    } & AdditionalArraySchemaProperties &
      AdditionalObjectSchemaProperties &
      AdditionalNumberSchemaProperties
  : T extends 'string' | 'boolean' | 'null'
  ? { kind: 'string' | 'boolean' | 'null'; type: T }
  : T extends 'number' | 'integer'
  ? { kind: 'number' | 'integer'; type: T } & AdditionalNumberSchemaProperties
  : T extends 'array'
  ? {
      kind: 'array';
      type: 'array';
    } & AdditionalArraySchemaProperties
  : T extends 'object'
  ? {
      kind: 'object';
      type: 'object';
    } & AdditionalObjectSchemaProperties
  : T extends 'combined'
  ? {
      kind: 'combined';
    } & AdditionalCombinedSchemaProperties
  : { kind: 'unknown' };
export type CombinedLikeApiSchema = ApiSchemaBase & {
  kind: 'combined' | 'object' | 'multi-type';
  type?: 'object' | string[];
} & AdditionalCombinedSchemaProperties;
export type NumberLikeApiSchema = ApiSchemaBase & {
  kind: 'number' | 'integer' | 'multi-type';
  type: 'number' | 'integer' | string[];
} & AdditionalNumberSchemaProperties;
export type ArrayLikeApiSchema = ApiSchemaBase & {
  kind: 'array' | 'multi-type';
  type: 'array' | string[];
} & AdditionalArraySchemaProperties;
export type ObjectLikeApiSchema = ApiSchemaBase & {
  kind: 'object' | 'multi-type';
  type: 'object' | string[];
} & AdditionalObjectSchemaProperties;
