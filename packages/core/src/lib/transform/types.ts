import {
  OpenApiCollectorData,
  OpenApiCollectorDocument,
  OpenApiVersionMarked,
  OpenApiCollectorSchema,
  OpenApiCollectorEndpointInfo,
} from '../collect/types.js';
import {
  ApiSchema,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiPath,
  OpenApiData,
  OpenApiVersion,
} from '../types.js';
import { IdGenerator } from './helpers.js';

export type IncompleteApiSchema = Omit<ApiSchema, keyof ApiSchemaExtensions<ApiSchemaKind>>;
type ArrayItem<T> = T extends (infer U)[] ? U : never;
export type OpenApiTransformerContext = {
  idGenerator: IdGenerator;
  input: OpenApiCollectorData;
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  paths: Map<string, ApiPath>;
} & { [K in keyof OpenApiData]: Map<string, ArrayItem<OpenApiData[K]>> };
export type OpenApiTransformer<V extends OpenApiVersion> = {
  transformDocument: (
    context: OpenApiTransformerContext,
    document: OpenApiCollectorDocument & OpenApiVersionMarked<V>
  ) => void;
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: OpenApiCollectorSchema & OpenApiVersionMarked<V>
  ) => void;
  transformEndpoint: (
    context: OpenApiTransformerContext,
    endpoint: OpenApiCollectorEndpointInfo & OpenApiVersionMarked<V>
  ) => void;
};
