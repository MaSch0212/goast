import {
  DerefSource,
  Deref,
  OpenApiHttpMethod,
  KnownOpenApiParameterTarget,
  OpenApiTag,
  OpenApiPathItem,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiMediaType,
  OpenApiResponse,
  OpenApiHeader,
  OpenApiSchema,
} from '../parse';
import { OptionalProperties } from '../utils';

export type ApiData = {
  services: ApiService[];
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
};

export type ApiComponentSource<T> = DerefSource<T> & {
  component: Deref<T>;
};

export type Transformed<T> = T extends OpenApiTag
  ? ApiService
  : T extends OpenApiPathItem
    ? ApiPath
    : T extends OpenApiParameter
      ? ApiParameter
      : T extends OpenApiRequestBody
        ? ApiRequestBody
        : T extends OpenApiResponse
          ? ApiResponse
          : T extends OpenApiMediaType
            ? ApiContent
            : T extends OpenApiHeader
              ? ApiHeader
              : T extends OpenApiSchema
                ? ApiSchema
                : undefined;

export type ApiComponent<T> = {
  id: string;
  $src: ApiComponentSource<T>;
  $ref: Transformed<T> | undefined;
};

export type ApiMethod = OpenApiHttpMethod;
export type ApiParameterTarget = KnownOpenApiParameterTarget;

export type ApiServiceComponent = OptionalProperties<ApiComponent<OpenApiTag>, '$src'>;
export type ApiService = ApiServiceComponent & {
  name: string;
  description: string | undefined;
  endpoints: ApiEndpoint[];
};

export type ApiPathComponent = ApiComponent<OpenApiPathItem>;
export type ApiPath = ApiPathComponent & {
  summary: string | undefined;
  description: string | undefined;
  path: string;
  parameters: ApiParameter[];
} & { [K in ApiMethod]: ApiEndpoint | undefined };

export type ApiEndpointComponent = ApiComponent<OpenApiOperation>;
export type ApiEndpoint = ApiEndpointComponent & {
  name: string;
  path: string;
  pathInfo: ApiPath;
  method: ApiMethod;
  summary: string | undefined;
  description: string | undefined;
  parameters: ApiParameter[];
  deprecated: boolean;
  requestBody: ApiRequestBody | undefined;
  responses: ApiResponse[];
  tags: string[];
  custom: Record<string, unknown>;
};

export type ApiParameterComponent = ApiComponent<OpenApiParameter>;
export type ApiParameter = ApiParameterComponent & {
  name: string;
  target: ApiParameterTarget;
  description: string | undefined;
  required: boolean;
  deprecated: boolean;
  allowEmptyValue: boolean | undefined;
  style: string | undefined;
  explode: boolean | undefined;
  allowReserved: boolean | undefined;
  schema: ApiSchema | undefined;
};

export type ApiRequestBodyComponent = ApiComponent<OpenApiRequestBody>;
export type ApiRequestBody = ApiRequestBodyComponent & {
  description: string | undefined;
  content: ApiContent[];
  required: boolean;
};

export type ApiContentComponent = ApiComponent<OpenApiMediaType>;
export type ApiContent = ApiContentComponent & {
  type: string;
  schema: ApiSchema | undefined;
};

export type ApiExampleComponent = ApiComponent<OpenApiResponse>;
export type ApiResponse = ApiExampleComponent & {
  statusCode: number | undefined;
  description: string | undefined;
  headers: ApiHeader[];
  contentOptions: ApiContent[];
};

export type ApiHeaderComponent = Omit<ApiComponent<OpenApiHeader> | ApiComponent<OpenApiSchema>, '$ref'> & {
  $ref: ApiHeader | undefined;
};
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
export type ApiSchemaDiscriminator = {
  propertyName: string;
  mapping: Record<string, ApiSchema>;
};
export type ApiSchemaComponent = ApiComponent<OpenApiSchema>;
export type ApiSchemaBase = ApiSchemaComponent & {
  name: string;
  isNameGenerated: boolean;
  description: string | undefined;
  deprecated: boolean;
  accessibility: ApiSchemaAccessibility;
  enum: unknown[] | undefined;
  const: unknown | undefined;
  default: unknown | undefined;
  example: unknown | undefined;
  nullable: boolean;
  required: Set<string>;
  custom: Record<string, unknown>;
  not: ApiSchema | undefined;
  discriminator: ApiSchemaDiscriminator | undefined;
  inheritedSchemas: (ApiSchema & { discriminator: NonNullable<ApiSchema['discriminator']> })[];
};
export type ApiSchema<T extends ApiSchemaKind = ApiSchemaKind> = ApiSchemaBase & ApiSchemaExtensions<T>;
type AdditionalCombinedSchemaProperties = {
  allOf: ApiSchema[];
  anyOf: ApiSchema[];
};
type AdditionalArraySchemaProperties = {
  items: ApiSchema | undefined;
  minItems: number | undefined;
  maxItems: number | undefined;
};
type AdditionalObjectSchemaProperties = {
  properties: Map<string, ApiSchemaProperty>;
  additionalProperties: boolean | undefined | ApiSchema;
} & AdditionalCombinedSchemaProperties;
type AdditionalNumberSchemaProperties = {
  minimum: number | undefined;
  maximum: number | undefined;
};
type AdditionalStringSchemaProperties = {
  pattern: string | undefined;
  minLength: number | undefined;
  maxLength: number | undefined;
};
type AdditionalPrimitiveSchemaProperties = {
  format: string | undefined;
};
export type ApiSchemaExtensions<T extends ApiSchemaKind> = T extends 'oneOf'
  ? { kind: 'oneOf'; oneOf: ApiSchema[] }
  : T extends 'multi-type'
    ? {
        kind: 'multi-type';
        type: ApiSchemaType[];
      } & AdditionalArraySchemaProperties &
        AdditionalObjectSchemaProperties &
        AdditionalNumberSchemaProperties &
        AdditionalStringSchemaProperties &
        AdditionalPrimitiveSchemaProperties
    : T extends 'string'
      ? { kind: 'string'; type: 'string' } & AdditionalStringSchemaProperties & AdditionalPrimitiveSchemaProperties
      : T extends 'boolean'
        ? { kind: 'boolean'; type: 'boolean' } & AdditionalPrimitiveSchemaProperties
        : T extends 'null'
          ? { kind: 'null'; type: 'null' }
          : T extends 'number' | 'integer'
            ? { kind: 'number' | 'integer'; type: T } & AdditionalNumberSchemaProperties &
                AdditionalPrimitiveSchemaProperties
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
} & AdditionalNumberSchemaProperties &
  AdditionalPrimitiveSchemaProperties;
export type ArrayLikeApiSchema = ApiSchemaBase & {
  kind: 'array' | 'multi-type';
  type: 'array' | string[];
} & AdditionalArraySchemaProperties;
export type ObjectLikeApiSchema = ApiSchemaBase & {
  kind: 'object' | 'multi-type';
  type: 'object' | string[];
} & AdditionalObjectSchemaProperties;
export type StringLikeApiSchema = ApiSchemaBase & {
  kind: 'string' | 'multi-type';
  type: 'string' | string[];
} & AdditionalStringSchemaProperties &
  AdditionalPrimitiveSchemaProperties;
export type PrimitiveLikeApiSchema = ApiSchemaBase & {
  kind: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'multi-type';
  type: 'string' | 'number' | 'integer' | 'boolean' | 'null' | string[];
} & AdditionalPrimitiveSchemaProperties;
