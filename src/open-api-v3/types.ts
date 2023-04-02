import { OpenAPIV3 } from 'openapi-types';
import { Deref } from '../types.js';

export type ContentObject = {
  [media: string]: OpenAPIV3.MediaTypeObject;
};

export type OpenApiV3CollectorData = {
  documents: Deref<OpenAPIV3.Document>[];
  schemas: Map<string, Deref<OpenAPIV3.SchemaObject>>;
  endpoints: Map<string, OpenApiV3EndpointInfo>;
};

export type OpenApiV3EndpointInfo = {
  path: string;
  method: `${OpenAPIV3.HttpMethods}`;
  pathItem: Deref<OpenAPIV3.PathItemObject>;
  operation: Deref<OpenAPIV3.OperationObject>;
};

export type OpenApiV3SSchemaKind =
  | 'oneOf'
  | 'combined'
  | 'unknown'
  | OpenAPIV3.NonArraySchemaObjectType
  | OpenAPIV3.ArraySchemaObjectType;
