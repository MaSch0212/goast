import type { OpenApiDiscriminator, OpenApiDocument, OpenApiReference, OpenApiSchema } from './openapi-types.ts';
import { defaultOpenApiTransformerOptions, type OpenApiTransformerOptions } from '../transform/types.ts';

export type DerefSource<T> = {
  file: string;
  path: string;
  document: Deref<OpenApiDocument>;
  originalComponent: T;
};

type _DerefDiscriminator = Omit<OpenApiDiscriminator, 'mapping'> & {
  mapping?: Record<string, Deref<OpenApiSchema>>;
};
type _Deref<T extends object> = T extends OpenApiDiscriminator ? _DerefDiscriminator
  :
    & {
      [K in keyof T as K extends keyof OpenApiReference ? never : K]: Deref<T[K]>;
    }
    & {
      $src: DerefSource<T>;
      $ref?: Deref<T>;
    };
export type Deref<T> = T extends object ? (T extends (infer A)[] ? Deref<A>[] : _Deref<T>) : T;

export type OpenApiParserOptions = OpenApiTransformerOptions;

export const defaultOpenApiParserOptions = { ...defaultOpenApiTransformerOptions };
