import { OpenApiData } from '../types.js';

export type CodeGeneratorResult = object | undefined;
export type CodeGenerator<T extends OpenApiData, U extends CodeGeneratorResult> = Exclude<
  keyof U,
  Exclude<keyof U, keyof OpenApiData>
> extends never
  ? (data: T) => Promise<U>
  : 'A generator cannot override properties of OpenApiData.';

type MergeTwo<T, U> = {
  [P in Exclude<keyof T, keyof U>]: T[P];
} & U;
export type Merge<U extends unknown[]> = U extends [infer A, ...infer R]
  ? MergeTwo<A, Merge<R>>
  : {};
