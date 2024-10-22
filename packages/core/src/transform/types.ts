import type {
  ApiContent,
  ApiData,
  ApiHeader,
  ApiParameter,
  ApiPath,
  ApiRequestBody,
  ApiResponse,
  ApiSchema,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiService,
} from './api-types.ts';
import type { IdGenerator } from './helpers.ts';
import type { OpenApiCollectorData } from '../collect/types.ts';
import type { ArrayItem } from '../utils/type.utils.ts';

export type OpenApiTransformerOptions = {
  /**
   * Determines how schemas without a `type` property should be treated.
   * - `keep-unknown`: Keep the schema as-is.
   * - `object-if-properties`: Treat the schema as an object schema only if it has properties.
   * - `always-object`: Treat the schema as an object schema.
   * @default 'object-if-properties'
   */
  unknownTypeBehavior: 'keep-unknown' | 'object-if-properties' | 'always-object';
};

export const defaultOpenApiTransformerOptions: OpenApiTransformerOptions = {
  unknownTypeBehavior: 'object-if-properties',
};

export type IncompleteApiSchema = Omit<ApiSchema, Exclude<keyof ApiSchemaExtensions<ApiSchemaKind>, 'kind'>>;
export type OpenApiTransformerContext = {
  config: OpenApiTransformerOptions;

  idGenerator: IdGenerator;
  input: OpenApiCollectorData;
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  paths: Map<string, ApiPath>;

  transformed: {
    services: Map<string, ApiService>;
    paths: Map<string, ApiPath>;
    parameters: Map<string, ApiParameter>;
    requestBodies: Map<string, ApiRequestBody>;
    responses: Map<string, ApiResponse>;
    content: Map<string, ApiContent>;
    headers: Map<string, ApiHeader>;
    schemas: Map<string, ApiSchema>;
  };
} & { [K in keyof ApiData]: Map<string, ArrayItem<ApiData[K]>> };
