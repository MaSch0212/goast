export type Merge<U extends unknown[]> = U extends [infer A, ...infer R] ? A & Merge<R> : {};

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredProperties<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type ArrayItem<T> = T extends (infer U)[] ? U : never;
export type SingleOrMultiple<T> = T | T[];
export type Single<T> = T extends (infer U)[] ? U : T;
export type Multiple<T> = T extends (infer U)[] ? U[] : T[];

export type Nullable<T> = T | null | undefined;

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Constructor<T, TArgs extends any[] = any[]> extends Function {
  new (...args: TArgs): T;
}

export type EmptyConstructor<T> = Constructor<T, []>;

export type FunctionNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

export type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  & {};

export type ValueOf<T> = T[keyof T];

export type NonEmptyArray<T> = [T, ...T[]];

type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never;
export function stringUnionToArray<T>(): <U extends NonEmptyArray<T>>(
  ...elements: MustInclude<T, U>
) => MustInclude<T, U> {
  return (...elements) => elements;
}

export type StringSuggestions<T extends string> = T | Omit<string, T>;
export function suggestionsAsString<T>(
  value: T,
): T extends StringSuggestions<infer U> ? Exclude<T, StringSuggestions<U>> | string : T {
  return value as any;
}

export type ParametersWithOverloads<T extends (...args: any[]) => any> = T extends {
  (...args: infer A1): any;
  (...args: infer A2): any;
  (...args: infer A3): any;
  (...args: infer A4): any;
  (...args: infer A5): any;
  (...args: infer A6): any;
} ? A1 | A2 | A3 | A4 | A5 | A6
  : T extends {
    (...args: infer A1): any;
    (...args: infer A2): any;
    (...args: infer A3): any;
    (...args: infer A4): any;
    (...args: infer A5): any;
  } ? A1 | A2 | A3 | A4 | A5
  : T extends {
    (...args: infer A1): any;
    (...args: infer A2): any;
    (...args: infer A3): any;
    (...args: infer A4): any;
  } ? A1 | A2 | A3 | A4
  : T extends {
    (...args: infer A1): any;
    (...args: infer A2): any;
    (...args: infer A3): any;
  } ? A1 | A2 | A3
  : T extends {
    (...args: infer A1): any;
    (...args: infer A2): any;
  } ? A1 | A2
  : T extends {
    (...args: infer A1): any;
  } ? A1
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;
export type TupleWithCount<T, N extends number | number[]> = N extends number ? number extends N ? T[]
  : _TupleOf<T, N, []>
  : N extends [infer A, ...infer R]
    ? A extends number ? R extends number[] ? TupleWithCount<T, A> | TupleWithCount<T, R>
      : never
    : never
  : N extends [] ? never
  : T[];

export type MaybePromise<T> = T | Promise<T>;
