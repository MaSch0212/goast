import {
  PathItemObject,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  MediaTypeObject,
  ResponseObject,
  HeaderObject,
  SchemaObject,
  ReferenceObject,
} from 'openapi-typescript';

export function assumeDeref<T>(value: T | ReferenceObject): T {
  if ((value as ReferenceObject).$ref) {
    throw new Error('Dereferenced component expected.');
  }
  return value as T;
}

export type Except<T, K> = Pick<T, Exclude<keyof T, keyof K>>;

export type ApiMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export type ApiParameterTarget = 'path' | 'query' | 'header' | 'cookie';

export type ApiComponentSource<T> = {
  file: string;
  path: string;
  component: T;
  reference?: ReferenceObject;
};

export type ApiComponent<T> = {
  $src: ApiComponentSource<T>;
};

export type ApiPath = ApiComponent<PathItemObject> & {
  summary?: string;
  description?: string;
  path: string;
  parameters?: ApiParameter[];
} & { [K in ApiMethod]?: ApiEndpoint };

export type ApiEndpoint = ApiComponent<OperationObject> & {
  name: string;
  path: ApiPath;
  method: ApiMethod;
  summary?: string;
  description?: string;
  parameters: ApiParameter[];
  deprecated: boolean;
  requestBody: ApiRequestBody;
  responses: ApiResponse[];
  tags: string[];
};

export type ApiParameter = ApiComponent<ParameterObject> & {
  name: string;
  target: ApiParameterTarget;
  description?: string;
  required: boolean;
  deprecated: boolean;
  allowEmptyValue: boolean;
  style?: string;
  explode: boolean;
  allowReserved: boolean;
  schema: ApiSchema;
};

export type ApiRequestBody = ApiComponent<RequestBodyObject> & {
  description?: string;
  content: ApiContent;
  required: boolean;
};

export type ApiContent = ApiComponent<MediaTypeObject> & {
  type: string;
  schema: ApiSchema;
};

export type ApiResponse = ApiComponent<ResponseObject> & {
  statusCode?: number;
  description?: string;
  headers: ApiHeader[];
  contentOptions: ApiContent[];
};

export type ApiHeader = ApiComponent<HeaderObject> & Omit<ApiParameter, 'in'>;

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
export type ApiSchemaBase = ApiComponent<SchemaObject> & {
  name?: string;
  description?: string;
  deprecated: boolean;
  accessibility: ApiSchemaAccessibility;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  format?: string;
  nullable?: boolean;
  custom: Record<string, any>;
};
export type ApiSchema<T extends ApiSchemaKind = ApiSchemaKind> = ApiSchemaBase & {
  kind: T;
} & (T extends 'oneOf'
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
        prefixItems?: ApiSchema;
        items?: ApiSchema;
        minItems?: number;
        maxItems?: number;
      }
    : T extends 'object'
    ? {
        type: 'object';
        properties?: ApiSchemaProperty[];
        additionalProperties?: boolean | Record<string, never> | ApiSchema;
        allOf?: ApiSchema[];
        anyOf?: ApiSchema[];
      }
    : T extends 'combined'
    ?
        | {
            allOf: ApiSchema[];
            anyOf?: ApiSchema[];
          }
        | {
            allOf?: ApiSchema[];
            anyOf: ApiSchema[];
          }
    : {});
