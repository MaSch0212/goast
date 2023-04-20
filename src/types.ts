import { IJsonSchema, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import {
  ApiComponent,
  ApiEndpoint,
  ApiPath,
  ApiSchema,
  ApiSchemaExtensions,
  ApiSchemaKind,
  ApiService,
  OpenApiVersion,
} from './api-types.js';

type _ReferenceObject =
  | OpenAPIV2.ReferenceObject
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject;
type Deref2<T> = {
  [K in keyof T]: Deref<T[K]>;
};
export type Deref<T> = T extends object
  ? T extends (infer A)[]
    ? Deref<A>[]
    : Deref2<Exclude<T, _ReferenceObject>> & ApiComponent
  : T;

export type OpenApiData = {
  services: ApiService[];
  endpoints: ApiEndpoint[];
  schemas: ApiSchema[];
};

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
export type OpenApiCollectorDocument<V extends OpenApiVersion = OpenApiVersion> =
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

export type IncompleteApiSchema = Omit<ApiSchema, keyof ApiSchemaExtensions<ApiSchemaKind>>;
type ArrayItem<T> = T extends (infer U)[] ? U : never;
export type OpenApiTransformerContext = {
  input: OpenApiCollectorData;
  incompleteSchemas: Map<string, IncompleteApiSchema>;
  paths: Map<string, ApiPath>;
} & { [K in keyof OpenApiData]: Map<string, ArrayItem<OpenApiData[K]>> };
export type OpenApiTransformer<V extends OpenApiVersion> = {
  transformDocument: (
    context: OpenApiTransformerContext,
    document: OpenApiCollectorDocument & OpenApiVersionMarked<V>
  ) => void;
  transformSchema: (
    context: OpenApiTransformerContext,
    schema: OpenApiCollectorSchema & OpenApiVersionMarked<V>
  ) => void;
  transformEndpoint: (
    context: OpenApiTransformerContext,
    endpoint: OpenApiCollectorEndpointInfo & OpenApiVersionMarked<V>
  ) => void;
};
