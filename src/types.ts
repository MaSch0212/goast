import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ApiComponent, ApiEndpoint, ApiSchema, ApiService } from './api-types.js';

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
