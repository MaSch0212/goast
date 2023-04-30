type MergeTwo<T, U> = {
  [P in Exclude<keyof T, keyof U>]: T[P];
} & U;
export type Merge<U extends unknown[]> = U extends [infer A, ...infer R]
  ? MergeTwo<A, Merge<R>>
  : {};

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type CombineTwo<T1, T2> = T1 extends object
  ? T2 extends object
    ? {
        [K in keyof T1 & keyof T2]: T1[K] | T2[K];
      } & {
        [K in Exclude<keyof T1, keyof T2>]?: T1[K];
      } & {
        [K in Exclude<keyof T2, keyof T1>]?: T2[K];
      }
    : T1 | T2
  : T1 | T2;

export type Combine<T extends unknown[]> = T extends [infer A, infer B, ...infer C]
  ? CombineTwo<CombineTwo<A, B>, Combine<C>>
  : T extends [infer A]
  ? A
  : never;

export type ArrayItem<T> = T extends (infer U)[] ? U : never;

export type Nullable<T> = T | null | undefined;
