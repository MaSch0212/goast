import type { OpenApiCollectorData } from '../collect/types.ts';
import type { ApiData } from './api-types.ts';
import { IdGenerator } from './helpers.ts';
import { transformDocument } from './transform-document.ts';
import { transformEndpoint } from './transform-endpoint.ts';
import { transformSchema } from './transform-schema.ts';
import {
  defaultOpenApiTransformerOptions,
  type OpenApiTransformerContext,
  type OpenApiTransformerOptions,
} from './types.ts';

/**
 * Transforms collected OpenAPI documents into the normalized `ApiData` model that the generators consume.
 * Documents are processed first, so their tags become services, then all collected schemas, then all endpoints.
 * @param data The documents, schemas and endpoints gathered by the collector.
 * @param options Transformer options. Values that are not given fall back to the defaults.
 * @returns The transformed documents, services, endpoints and schemas.
 */
export function transformOpenApi(data: OpenApiCollectorData, options?: Partial<OpenApiTransformerOptions>): ApiData {
  const context: OpenApiTransformerContext = {
    config: { ...defaultOpenApiTransformerOptions, ...options },

    idGenerator: new IdGenerator(),
    input: data,
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),

    transformed: {
      services: new Map(),
      paths: new Map(),
      parameters: new Map(),
      requestBodies: new Map(),
      responses: new Map(),
      content: new Map(),
      headers: new Map(),
      schemas: new Map(),
    },
  };

  for (const document of data.documents) {
    transformDocument(context, document);
  }
  for (const schema of context.input.schemas.values()) {
    transformSchema(context, schema);
  }
  for (const endpoint of context.input.endpoints.values()) {
    transformEndpoint(context, endpoint);
  }

  return {
    documents: context.input.documents,
    services: Array.from(context.services.values()),
    endpoints: Array.from(context.endpoints.values()),
    schemas: Array.from(context.schemas.values()),
  };
}
