import { ApiData } from './api-types';
import { IdGenerator } from './helpers';
import { transformDocument } from './transform-document';
import { transformEndpoint } from './transform-endpoint';
import { transformSchema } from './transform-schema';
import { OpenApiTransformerContext } from './types';
import { OpenApiCollectorData } from '../collect';

export function transformOpenApi(data: OpenApiCollectorData): ApiData {
  const context: OpenApiTransformerContext = {
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
    services: Array.from(context.services.values()),
    endpoints: Array.from(context.endpoints.values()),
    schemas: Array.from(context.schemas.values()),
  };
}
