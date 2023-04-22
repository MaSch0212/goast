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
export type OpenApiCollectorDocument =
  | OpenApiV2CollectorDocument
  | OpenApiV3CollectorDocument
  | OpenApiV3_1CollectorDocument;
export type OpenApiV2CollectorSchema = OpenApiVersionMarked<'2.0'> & {
  schema: Deref<OpenAPIV2.SchemaObject | IJsonSchema>;
};
export type OpenApiV3CollectorSchema = OpenApiVersionMarked<'3.0'> & {
  schema: Deref<OpenAPIV3.SchemaObject>;
};
export type OpenApiV3_1CollectorSchema = OpenApiVersionMarked<'3.1'> & {
  schema: Deref<OpenAPIV3_1.SchemaObject>;
};
export type OpenApiCollectorSchema =
  | OpenApiV2CollectorSchema
  | OpenApiV3CollectorSchema
  | OpenApiV3_1CollectorSchema;
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
export type OpenApiCollectorEndpointInfo =
  | OpenApiV2CollectorEndpointInfo
  | OpenApiV3CollectorEndpointInfo
  | OpenApiV3_1CollectorEndpointInfo;
export type OpenApiCollectorData = {
  documents: OpenApiCollectorDocument[];
  schemas: Map<string, OpenApiCollectorSchema>;
  endpoints: Map<string, OpenApiCollectorEndpointInfo>;
};
