import { IdGenerator } from './helpers.js';
import { OpenApiTransformer, OpenApiTransformerContext } from './types.js';
import { OpenApiCollectorData } from '../collect/types.js';
import { openApiV2Transformer } from '../open-api-v2/transformer.js';
import { openApiV3Transformer } from '../open-api-v3/transformer.js';
import { openApiV3_1Transformer } from '../open-api-v3_1/transformer.js';
import { OpenApiVersion, OpenApiData } from '../types.js';

type Transformers = {
  [V in OpenApiVersion]: OpenApiTransformer<V>;
};
const transformers: Transformers = {
  '2.0': openApiV2Transformer,
  '3.0': openApiV3Transformer,
  '3.1': openApiV3_1Transformer,
};

function getTransformer<V extends OpenApiVersion>(version: V): OpenApiTransformer<V> {
  return transformers[version];
}

export function transformOpenApi(data: OpenApiCollectorData): OpenApiData {
  const context: OpenApiTransformerContext = {
    idGenerator: new IdGenerator(),
    input: data,
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),
  };

  for (const document of data.documents) {
    getTransformer(document.version).transformDocument(context, document);
  }
  for (const schema of context.input.schemas.values()) {
    getTransformer(schema.version).transformSchema(context, schema);
  }
  for (const endpoint of context.input.endpoints.values()) {
    getTransformer(endpoint.version).transformEndpoint(context, endpoint);
  }

  return {
    services: Array.from(context.services.values()),
    endpoints: Array.from(context.endpoints.values()),
    schemas: Array.from(context.schemas.values()),
  };
}
