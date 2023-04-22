import { OpenApiCollectorData } from '../collect/types.js';
import { openApiV2Transformer } from '../open-api-v2/transformer.js';
import { openApiV3Transformer } from '../open-api-v3/transformer.js';
import { openApiV3_1Transformer } from '../open-api-v3_1/transformer.js';
import { OpenApiVersion, OpenApiData } from '../types.js';
import { OpenApiTransformer, OpenApiTransformerContext } from './types.js';

type Transformers = {
  [V in OpenApiVersion]: OpenApiTransformer<V>;
};
const transformers: Transformers = {
  '2.0': openApiV2Transformer,
  '3.0': openApiV3Transformer,
  '3.1': openApiV3_1Transformer,
};

export function transformOpenApi(data: OpenApiCollectorData): OpenApiData {
  const context: OpenApiTransformerContext = {
    input: data,
    incompleteSchemas: new Map(),
    paths: new Map(),
    services: new Map(),
    endpoints: new Map(),
    schemas: new Map(),
  };

  for (const document of data.documents) {
    transformers[document.version].transformDocument(context, document as any);
  }
  for (const schema of context.input.schemas.values()) {
    transformers[schema.version].transformSchema(context, schema as any);
  }
  for (const endpoint of context.input.endpoints.values()) {
    transformers[endpoint.version].transformEndpoint(context, endpoint as any);
  }

  return {
    services: Array.from(context.services.values()),
    endpoints: Array.from(context.endpoints.values()),
    schemas: Array.from(context.schemas.values()),
  };
}
