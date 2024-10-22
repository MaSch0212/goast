import type {
  OpenApiDocument,
  OpenApiHttpMethod,
  OpenApiOperation,
  OpenApiPathItem,
  OpenApiSchema,
} from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';

export type OpenApiCollectorEndpointInfo = {
  path: string;
  method: OpenApiHttpMethod;
  pathItem: Deref<OpenApiPathItem>;
  operation: Deref<OpenApiOperation>;
};

export type OpenApiCollectorData = {
  documents: Deref<OpenApiDocument>[];
  schemas: Map<string, Deref<OpenApiSchema>>;
  endpoints: Map<string, OpenApiCollectorEndpointInfo>;
};
