import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1, IJsonSchema } from 'openapi-types';

import { OpenApiVersion, Deref } from '../types.js';

export type OpenApiVersionMarked<V extends OpenApiVersion> = { version: V };
export type OpenApiV2CollectorDocument = OpenApiVersionMarked<'2.0'> & {
  document: Deref<OpenAPIV2.Document>;
};
export type OpenApiV3CollectorDocument = OpenApiVersionMarked<'3.0'> & {
  document: Deref<OpenAPIV3.Document>;
};
export type OpenApiV3_1CollectorDocument = OpenApiVersionMarked<'3.1'> & {
  document: Deref<OpenAPIV3_1.Document>;
};
export type OpenApiCollectorDocument<V extends OpenApiVersion = OpenApiVersion> = V extends '2.0'
  ? OpenApiV2CollectorDocument
  : V extends '3.0'
  ? OpenApiV3CollectorDocument
  : V extends '3.1'
  ? OpenApiV3_1CollectorDocument
  : never;
export type OpenApiV2CollectorSchema = OpenApiVersionMarked<'2.0'> & {
  schema: Deref<OpenAPIV2.SchemaObject | IJsonSchema>;
};
export type OpenApiV3CollectorSchema = OpenApiVersionMarked<'3.0'> & {
  schema: Deref<OpenAPIV3.SchemaObject>;
};
export type OpenApiV3_1CollectorSchema = OpenApiVersionMarked<'3.1'> & {
  schema: Deref<OpenAPIV3_1.SchemaObject>;
};
export type OpenApiCollectorSchema<V extends OpenApiVersion = OpenApiVersion> = V extends '2.0'
  ? OpenApiV2CollectorSchema
  : V extends '3.0'
  ? OpenApiV3CollectorSchema
  : V extends '3.1'
  ? OpenApiV3_1CollectorSchema
  : never;
export type OpenApiCollectorEndpointInfoBase = { path: string };
export type OpenApiV2CollectorEndpointInfo = OpenApiVersionMarked<'2.0'> &
  OpenApiCollectorEndpointInfoBase & {
    method: `${OpenAPIV2.HttpMethods}`;
    pathItem: Deref<OpenAPIV2.PathItemObject>;
    operation: Deref<OpenAPIV2.OperationObject>;
  };
export type OpenApiV3CollectorEndpointInfo = OpenApiVersionMarked<'3.0'> &
  OpenApiCollectorEndpointInfoBase & {
    method: `${OpenAPIV3.HttpMethods}`;
    pathItem: Deref<OpenAPIV3.PathItemObject>;
    operation: Deref<OpenAPIV3.OperationObject>;
  };
export type OpenApiV3_1CollectorEndpointInfo = OpenApiVersionMarked<'3.1'> &
  OpenApiCollectorEndpointInfoBase & {
    method: `${OpenAPIV3_1.HttpMethods}`;
    pathItem: Deref<OpenAPIV3_1.PathItemObject>;
    operation: Deref<OpenAPIV3_1.OperationObject>;
  };
export type OpenApiCollectorEndpointInfo<V extends OpenApiVersion = OpenApiVersion> = V extends '2.0'
  ? OpenApiV2CollectorEndpointInfo
  : V extends '3.0'
  ? OpenApiV3CollectorEndpointInfo
  : V extends '3.1'
  ? OpenApiV3_1CollectorEndpointInfo
  : never;
export type OpenApiCollectorData = {
  documents: OpenApiCollectorDocument[];
  schemas: Map<string, OpenApiCollectorSchema>;
  endpoints: Map<string, OpenApiCollectorEndpointInfo>;
};
