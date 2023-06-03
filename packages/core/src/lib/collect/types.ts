import { Deref, OpenApiDocument, OpenApiHttpMethod, OpenApiOperation, OpenApiPathItem, OpenApiSchema } from '../parse';

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
