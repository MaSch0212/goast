import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenApiVersion = '2.0' | '3.0' | '3.1';
export type ApiMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export type ApiParameterTarget = 'path' | 'query' | 'header' | 'cookie';

export type ApiComponentSource<V extends OpenApiVersion, T2, T3, T3_1> = {
  file: string;
  path: string;
  version: V;
  component: V extends '2.0' ? T2 : V extends '3.0' ? T3 : V extends '3.1' ? T3_1 : never;
  reference?: V extends '2.0'
    ? OpenAPIV2.ReferenceObject
    : V extends '3.0'
    ? OpenAPIV3.ReferenceObject
    : V extends '3.1'
    ? OpenAPIV3_1.ReferenceObject
    : never;
};

export type ApiComponent<T2 = unknown, T3 = unknown, T3_1 = unknown> = {
  $src: ApiComponentSource<OpenApiVersion, T2, T3, T3_1>;
};

export type ApiServiceComponent = Partial<
  ApiComponent<OpenAPIV2.TagObject, OpenAPIV3.TagObject, OpenAPIV3_1.TagObject>
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
  custom: Record<string, any>;
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
  schema: ApiSchema;
};

export type ApiRequestBodyComponent = ApiComponent<
  never,
  OpenAPIV3.RequestBodyObject,
  OpenAPIV3_1.RequestBodyObject
>;
export type ApiRequestBody = ApiRequestBodyComponent & {
  description?: string;
  content: ApiContent[];
  required: boolean;
};

export type ApiContentComponent = ApiComponent<
  never,
  OpenAPIV3.MediaTypeObject,
  OpenAPIV3_1.MediaTypeObject
>;
export type ApiContent = ApiContentComponent & {
  type: string;
  schema: ApiSchema;
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

export type ApiHeaderComponent = ApiComponent<
  OpenAPIV2.HeaderObject,
  OpenAPIV3.HeaderObject,
  OpenAPIV3_1.HeaderObject
>;
export type ApiHeader = ApiHeaderComponent & Omit<ApiParameter, 'target'>;

export type ApiSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'array'
  | 'boolean'
  | 'null'
  | 'object'
  | string;
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
  required: boolean;
  schema: ApiSchema;
};
export type ApiSchemaComponent = ApiComponent<
  OpenAPIV2.SchemaObject,
  OpenAPIV3.SchemaObject,
  OpenAPIV3_1.SchemaObject
>;
export type ApiSchemaBase = ApiSchemaComponent & {
  id: number;
  name: string;
  description?: string;
  deprecated: boolean;
  accessibility: ApiSchemaAccessibility;
  enum?: any[];
  const?: any;
  default?: any;
  format?: string;
  nullable?: boolean;
  custom: Record<string, any>;
};
export type ApiSchema<T extends ApiSchemaKind = ApiSchemaKind> = ApiSchemaBase & {
  kind: T;
} & ApiSchemaExtensions<T>;
export type ApiSchemaExtensions<T extends ApiSchemaKind> = T extends 'oneOf'
  ? { oneOf: ApiSchema[] }
  : T extends 'multi-type'
  ? {
      type: ApiSchemaType[];
    }
  : T extends 'string' | 'boolean' | 'null'
  ? { type: T }
  : T extends 'number' | 'integer'
  ? { type: T; minimum?: number; maximum?: number }
  : T extends 'array'
  ? {
      type: 'array';
      items?: ApiSchema;
      minItems?: number;
      maxItems?: number;
    }
  : T extends 'object'
  ? {
      type: 'object';
      properties: ApiSchemaProperty[];
      additionalProperties?: boolean | Record<string, never> | ApiSchema;
      allOf: ApiSchema[];
      anyOf: ApiSchema[];
    }
  : T extends 'combined'
  ? {
      allOf: ApiSchema[];
      anyOf: ApiSchema[];
    }
  : {};
