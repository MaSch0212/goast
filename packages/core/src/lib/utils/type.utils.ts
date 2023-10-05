type MergeTwo<T, U> = {
  [P in Exclude<keyof T, keyof U>]: T[P];
} & U;
export type Merge<U extends unknown[]> = U extends [infer A, ...infer R] ? MergeTwo<A, Merge<R>> : {};

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredProperties<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type ArrayItem<T> = T extends (infer U)[] ? U : never;

export type Nullable<T> = T | null | undefined;

export interface Constructor<T, TArgs extends any[]> extends Function {
  new (...args: TArgs): T;
}

export type EmptyConstructor<T> = Constructor<T, []>;

export type FunctionNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
