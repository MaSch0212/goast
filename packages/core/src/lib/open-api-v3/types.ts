import { OpenAPIV3 } from 'openapi-types';

export type ContentObject = {
  [media: string]: OpenAPIV3.MediaTypeObject;
};

export type OpenApiV3SchemaKind =
  | 'oneOf'
  | 'combined'
  | 'unknown'
  | OpenAPIV3.NonArraySchemaObjectType
  | OpenAPIV3.ArraySchemaObjectType;
