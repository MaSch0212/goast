import { defaultOpenApiTransformerOptions, type OpenApiTransformerOptions } from '../transform/types.ts';
import type { OpenApiDiscriminator, OpenApiDocument, OpenApiReference, OpenApiSchema } from './openapi-types.ts';

/**
 * Provenance of a dereferenced object, exposed on every such object as `$src`.
 * Records the document the raw object was read from and where it sits in that document.
 * @template T The raw OpenAPI object type that this source describes.
 */
export type DerefSource<T> = {
  /**
   * Absolute file path, or URL, of the document the object was loaded from.
   */
  file: string;
  /**
   * Line and column of the object within that document.
   */
  pos: { line: number; col: number };
  /**
   * Slash-separated path from the document root to the object, such as `/components/schemas/Pet`.
   * Segments are not JSON Pointer-escaped.
   */
  path: string;
  /**
   * The dereferenced root document of the file that contains the object.
   */
  document: Deref<OpenApiDocument>;
  /**
   * The raw, unresolved object as it was parsed, before any `$ref` was followed.
   */
  originalComponent: T;
};

type _DerefDiscriminator = Omit<OpenApiDiscriminator, 'mapping'> & {
  mapping?: Record<string, Deref<OpenApiSchema>>;
};
type _Deref<T extends object> = T extends OpenApiDiscriminator
  ? _DerefDiscriminator
  : {
      [K in keyof T as K extends keyof OpenApiReference ? never : K]: Deref<T[K]>;
    } & {
      $src: DerefSource<T>;
      $ref?: Deref<T>;
    };
/**
 * Consumer-facing view of the OpenAPI value `T`. Object properties and array elements are mapped recursively, the raw
 * `$ref` key is replaced by `$ref?: Deref<T>` pointing at the resolved target, and every object gains
 * `$src: DerefSource<T>`. Properties that a referencing object does not define are read from its target at runtime
 * (see `createDerefProxy`).
 * @template T The raw OpenAPI type being dereferenced.
 * @see DerefSource
 */
export type Deref<T> = T extends object ? (T extends (infer A)[] ? Deref<A>[] : _Deref<T>) : T;

/**
 * Options that control parsing. The parser accepts the same options as the transformer and passes them on unchanged.
 * @see OpenApiTransformerOptions
 */
export type OpenApiParserOptions = OpenApiTransformerOptions;

/**
 * Default parser options, a shallow copy of `defaultOpenApiTransformerOptions`.
 * @see defaultOpenApiTransformerOptions
 */
export const defaultOpenApiParserOptions = { ...defaultOpenApiTransformerOptions };
