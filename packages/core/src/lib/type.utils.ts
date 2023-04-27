type MergeTwo<T, U> = {
  [P in Exclude<keyof T, keyof U>]: T[P];
} & U;
export type Merge<U extends unknown[]> = U extends [infer A, ...infer R]
  ? MergeTwo<A, Merge<R>>
  : {};

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
