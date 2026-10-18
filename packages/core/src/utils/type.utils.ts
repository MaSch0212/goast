/**
 * Intersects all types of a tuple, e.g. `Merge<[A, B]>` resolves to `A & B`.
 * @template U The tuple of types to intersect.
 * @example
 * ```ts
 * type AB = Merge<[{ a: string }, { b: number }]>; // { a: string } & { b: number }
 * ```
 */
export type Merge<U extends unknown[]> = U extends [infer A, ...infer R] ? A & Merge<R> : {};

/**
 * Makes the properties `K` of `T` optional, leaving all other properties unchanged.
 * @template T The object type.
 * @template K The keys of `T` to make optional.
 */
export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * Makes the properties `K` of `T` required, leaving all other properties unchanged.
 * @template T The object type.
 * @template K The keys of `T` to make required.
 */
export type RequiredProperties<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Gets the item type of an array type, or `never` if `T` is not an array.
 * @template T The type to inspect.
 */
export type ArrayItem<T> = T extends (infer U)[] ? U : never;
/**
 * A value of type `T` or an array of `T`.
 * @template T The item type.
 */
export type SingleOrMultiple<T> = T | T[];
/**
 * Gets the single item type of `T`: the item type if `T` is an array, otherwise `T` itself. Distributes over unions.
 * @template T The type to unwrap.
 * @see SingleOrMultiple
 */
export type Single<T> = T extends (infer U)[] ? U : T;
/**
 * Gets the array type of `T`: `T[]` if `T` is not an array, otherwise an array with the same item type.
 * Distributes over unions.
 * @template T The type to convert to an array.
 * @see SingleOrMultiple
 */
export type Multiple<T> = T extends (infer U)[] ? U[] : T[];

/**
 * A value of type `T` that may also be `null` or `undefined`.
 * @template T The non-nullable type.
 */
export type Nullable<T> = T | null | undefined;

/**
 * Describes a class constructor that creates an instance of `T` from arguments of types `TArgs`.
 * @template T The type of the created instance.
 * @template TArgs The types of the constructor parameters.
 */
export interface Constructor<T, TArgs extends any[] = any[]> extends Function {
  new (...args: TArgs): T;
}

/**
 * Describes a class constructor that takes no arguments and creates an instance of `T`.
 * @template T The type of the created instance.
 */
export type EmptyConstructor<T> = Constructor<T, []>;

/**
 * Gets the union of the keys of `T` whose values are functions.
 * @template T The object type to inspect.
 */
export type FunctionNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Flattens an intersection type (e.g. `Omit<A, K> & B`) into a single object type, so that editor tooltips show
 * the resulting properties directly.
 * @template T The type to flatten.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Gets the union of all property value types of `T`.
 * @template T The object type.
 */
export type ValueOf<T> = T[keyof T];

/**
 * An array type with at least one element.
 * @template T The element type.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Resolves to `U` only if `U` contains every member of `T`, otherwise to `never`. Used by `stringUnionToArray`.
 * @template T The union type whose members must all be included.
 * @template U The tuple of listed members.
 */
type MustInclude<T, U extends T[]> = [T] extends [ValueOf<U>] ? U : never;
/**
 * Creates a function that returns the members of the string union type `T` as an array. The compiler checks that
 * every member of `T` is listed.
 * @template T The string union type whose members must all be listed.
 * @returns A function that takes the members as arguments and returns them as an array.
 * @example
 * ```ts
 * type Color = 'red' | 'green' | 'blue';
 * const colors = stringUnionToArray<Color>()('red', 'green', 'blue'); // ['red', 'green', 'blue']
 * // stringUnionToArray<Color>()('red', 'green'); // Compile error: a member is missing.
 * ```
 */
export function stringUnionToArray<T>(): <U extends NonEmptyArray<T>>(
  ...elements: MustInclude<T, U>
) => MustInclude<T, U> {
  return (...elements) => elements;
}

/**
 * Either one of the suggested string values `T`, or any other string. Editors offer `T` as completions while
 * arbitrary strings remain allowed.
 * @template T The suggested string values.
 * @example
 * ```ts
 * type Access = StringSuggestions<'public' | 'private'>;
 * const access: Access = 'protected'; // allowed, while 'public' and 'private' are suggested
 * ```
 */
export type StringSuggestions<T extends string> = T | Omit<string, T>;
/**
 * Returns `value` unchanged at runtime. At the type level, a `StringSuggestions` type is widened to `string`, so the
 * suggested literals no longer narrow it. Other types are returned as they are.
 * @template T The type of the value.
 * @param value The value to return.
 * @returns The same value, typed as `string` where `T` is a string suggestion.
 */
export function suggestionsAsString<T>(
  value: T,
): T extends StringSuggestions<infer U> ? Exclude<T, StringSuggestions<U>> | string : T {
  return value as any;
}

/**
 * Gets the union of the parameter tuples of all overloads of the function type `T`. Considers up to six overloads.
 * @template T The function type to inspect.
 * @example
 * ```ts
 * declare function parse(input: string): number;
 * declare function parse(input: string, radix: number): number;
 * type ParseArgs = ParametersWithOverloads<typeof parse>; // [input: string] | [input: string, radix: number]
 * ```
 */
export type ParametersWithOverloads<T extends (...args: any[]) => any> = T extends {
  (...args: infer A1): any;
  (...args: infer A2): any;
  (...args: infer A3): any;
  (...args: infer A4): any;
  (...args: infer A5): any;
  (...args: infer A6): any;
}
  ? A1 | A2 | A3 | A4 | A5 | A6
  : T extends {
        (...args: infer A1): any;
        (...args: infer A2): any;
        (...args: infer A3): any;
        (...args: infer A4): any;
        (...args: infer A5): any;
      }
    ? A1 | A2 | A3 | A4 | A5
    : T extends {
          (...args: infer A1): any;
          (...args: infer A2): any;
          (...args: infer A3): any;
          (...args: infer A4): any;
        }
      ? A1 | A2 | A3 | A4
      : T extends {
            (...args: infer A1): any;
            (...args: infer A2): any;
            (...args: infer A3): any;
          }
        ? A1 | A2 | A3
        : T extends {
              (...args: infer A1): any;
              (...args: infer A2): any;
            }
          ? A1 | A2
          : T extends {
                (...args: infer A1): any;
              }
            ? A1
            : never;

/**
 * Helper for `TupleWithCount`: prepends `T` to `R` until `R` has `N` elements.
 * @template T The element type.
 * @template N The target length of the tuple.
 * @template R The tuple built so far.
 */
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;
/**
 * Creates a tuple type of `T` with a fixed length. A non-literal `number` or `number[]` gives `T[]`, a literal number
 * gives a tuple of that length, and a union of numbers or a number array gives a union of tuples.
 * @template T The element type.
 * @template N The tuple length, or the array of allowed lengths.
 * @example
 * ```ts
 * type Pair = TupleWithCount<string, 2>; // [string, string]
 * type Odd = TupleWithCount<string, [1, 3]>; // [string] | [string, string, string]
 * ```
 */
export type TupleWithCount<T, N extends number | number[]> = N extends number
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : N extends [infer A, ...infer R]
    ? A extends number
      ? R extends number[]
        ? TupleWithCount<T, A> | TupleWithCount<T, R>
        : never
      : never
    : N extends []
      ? never
      : T[];

/**
 * A value of type `T` or a `Promise` of it, for functions that may complete synchronously or asynchronously.
 * @template T The resolved value type.
 */
export type MaybePromise<T> = T | Promise<T>;
