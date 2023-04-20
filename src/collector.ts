import { OpenAPI } from 'openapi-types';
import { Deref, OpenApiCollectorData } from './types.js';
import { collectOpenApiV3, isOpenApiV3 } from './open-api-v3/collector.js';
import { collectOpenApiV3_1, isOpenApiV3_1 } from './open-api-v3_1/collector.js';
import { isOpenApiV2, collectOpenApiV2 } from './open-api-v2/collector.js';

export function collectOpenApi(apis: Deref<OpenAPI.Document>[]): OpenApiCollectorData {
  const data: OpenApiCollectorData = {
    documents: [],
    schemas: new Map(),
    endpoints: new Map(),
  };

  for (const api of apis) {
    if (isOpenApiV3_1(api)) {
      collectOpenApiV3_1(api, data);
    } else if (isOpenApiV3(api)) {
      collectOpenApiV3(api, data);
    } else if (isOpenApiV2(api)) {
      collectOpenApiV2(api, data);
    } else {
      throw new Error('Unsupported OpenAPI version');
    }
  }

  return data;
}
