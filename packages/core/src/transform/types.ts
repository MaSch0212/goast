import type { OpenApiCollectorData } from '../collect/types.ts';
import type { ArrayItem } from '../utils/type.utils.ts';
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

/**
 * Options that control how OpenAPI documents are transformed into the `ApiData` model.
 * @see transformOpenApi
 */
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

/**
 * The default transformer options, used for every option that the caller does not set.
 * @see OpenApiTransformerOptions
 */
export const defaultOpenApiTransformerOptions: OpenApiTransformerOptions = {
  unknownTypeBehavior: 'object-if-properties',
};

/**
 * A schema whose kind-specific fields are not filled in yet. It is registered while the schema's own sub-schemas are
 * being transformed, so that circular references resolve to the same instance.
 * @see ApiSchema
 */
export type IncompleteApiSchema = Omit<ApiSchema, Exclude<keyof ApiSchemaExtensions<ApiSchemaKind>, 'kind'>>;
/**
 * The mutable state that all transform steps of one `transformOpenApi` call share.
 * @see transformOpenApi
 */
export type OpenApiTransformerContext = {
  /**
   * The transformer options in effect for this run.
   */
  config: OpenApiTransformerOptions;

  /**
   * Generates the identifiers of the entries created during this run.
   */
  idGenerator: IdGenerator;
  /**
   * The collected documents, schemas and endpoints that are being transformed.
   */
  input: OpenApiCollectorData;
  /**
   * Schemas that are currently being transformed, keyed by `file:path`. A circular reference finds its entry here
   * instead of recursing forever.
   */
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  /**
   * The path entries created so far, keyed by path template. All operations of one path share one entry.
   */
  paths: Map<string, ApiPath>;

  /**
   * Entries already created for each source object, keyed by `getOpenApiObjectIdentifier`, so that every object is
   * transformed only once.
   */
  transformed: {
    /**
     * The services created from tags, keyed by source object identifier.
     */
    services: Map<string, ApiService>;
    /**
     * The path entries created from path items, keyed by source object identifier.
     */
    paths: Map<string, ApiPath>;
    /**
     * The parameters, keyed by source object identifier.
     */
    parameters: Map<string, ApiParameter>;
    /**
     * The request bodies, keyed by source object identifier.
     */
    requestBodies: Map<string, ApiRequestBody>;
    /**
     * The responses, keyed by source object identifier.
     */
    responses: Map<string, ApiResponse>;
    /**
     * The media type entries, keyed by source object identifier.
     */
    content: Map<string, ApiContent>;
    /**
     * The headers, keyed by source object identifier.
     */
    headers: Map<string, ApiHeader>;
    /**
     * The schemas, keyed by source object identifier.
     */
    schemas: Map<string, ApiSchema>;
  };
} & { [K in Exclude<keyof ApiData, 'documents'>]: Map<string, ArrayItem<ApiData[K]>> };
