import { OpenAPIV3_1 } from 'openapi-types';

export type ContentObject = {
  [media: string]: OpenAPIV3_1.MediaTypeObject;
};

export type OpenApiV3_1SchemaKind =
  | 'oneOf'
  | 'combined'
  | 'multi-type'
  | 'unknown'
  | OpenAPIV3_1.NonArraySchemaObjectType
  | OpenAPIV3_1.ArraySchemaObjectType;

type x = Extract<OpenAPIV3_1.SchemaObject['type'], string[]> extends string[]
  ? 'multi-type'
  : never;
