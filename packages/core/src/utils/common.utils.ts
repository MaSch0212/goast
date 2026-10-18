import type { SingleOrMultiple } from './type.utils.ts';

/**
 * Checks whether the specified value is `null` or `undefined`.
 * @param value The value to check.
 * @returns `true` if the value is `null` or `undefined`; otherwise, `false`.
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks whether the specified value is neither `null` nor `undefined`. Can be used as a type guard in filters.
 * @template T The type of the value.
 * @param value The value to check.
 * @returns `true` if the value is neither `null` nor `undefined`; otherwise, `false`.
 */
export function notNullish<T>(value: T): value is NonNullable<T> {
  return !isNullish(value);
}

/**
 * Concatenates one or more single or multiple values into one. A single argument is returned as-is, while multiple
 * arguments are combined into a new array in which array arguments are flattened by one level.
 * @template T The type of the items.
 * @param values The single or multiple values to concatenate.
 * @returns The single argument, or a new array containing the items of all arguments.
 */
export function concatSingleOrMultiple<T>(...values: SingleOrMultiple<T>[]): SingleOrMultiple<T> {
  if (values.length === 1) {
    return values[0];
  }
  const result: T[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      result.push(...value);
    } else {
      result.push(value);
    }
  }
  return result;
}

/**
 * Checks whether the specified value is a non-null object that implements the iterable protocol. Strings are not
 * considered iterable by this check, because they are primitive values.
 * @param value The value to check.
 * @returns `true` if the value is an iterable object; otherwise, `false`.
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.iterator in value;
}

/**
 * Converts the specified value to an array. Arrays are returned as-is, other iterables are copied into a new array, and
 * any other value (including a string) is wrapped in a single-item array.
 * @template T The type of the items.
 * @param value The value to convert.
 * @returns An array containing the items of the value.
 */
export function toArray<T>(value: T | T[] | Iterable<T>): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isIterable(value)) {
    return Array.from(value);
  }
  return [value];
}

/**
 * Invokes the callback with the specified value if it is neither `null` nor `undefined`, and returns the value.
 * The callback can change the value in place.
 * @template T The type of the value.
 * @param value The value to modify.
 * @param callback The callback that receives the value if it is not nullish.
 * @returns The original value.
 */
export function modify<T>(value: T, callback: (value: NonNullable<T>) => void): T {
  if (notNullish(value)) {
    callback(value);
  }
  return value;
}

/**
 * Invokes the callback with the specified value and returns the value. Useful for performing side effects in a chain.
 * @template T The type of the value.
 * @param value The value to pass to the callback.
 * @param callback The callback to invoke with the value.
 * @returns The original value.
 */
export function run<T>(value: T, callback: (value: T) => void): T {
  callback(value);
  return value;
}

/**
 * Passes the specified value to the callback and returns the result of the callback.
 * @template T The type of the input value.
 * @template U The type of the result.
 * @param value The value to transform.
 * @param callback The callback that computes the result from the value.
 * @returns The result of the callback.
 */
export function transform<T, U>(value: T, callback: (value: T) => U): U {
  return callback(value);
}

type IterableItem<T> = T extends Iterable<infer U> ? U : never;
/**
 * Invokes the callback for each item of the specified iterable that is neither `null` nor `undefined`, and returns the
 * iterable. Nullish items are skipped.
 * @template T The type of the iterable.
 * @param values The iterable whose non-nullish items are passed to the callback.
 * @param callback The callback that receives each non-nullish item.
 * @returns The original iterable.
 */
export function modifyEach<T extends Iterable<unknown>>(
  values: T,
  callback: (value: NonNullable<IterableItem<T>>) => void,
): T {
  for (const value of values) {
    if (notNullish(value)) {
      callback(value as NonNullable<IterableItem<T>>);
    }
  }
  return values;
}

/**
 * Invokes the callback for each item of the specified iterable, including nullish items, and returns the iterable.
 * @template T The type of the iterable.
 * @param values The iterable whose items are passed to the callback.
 * @param callback The callback to invoke for each item.
 * @returns The original iterable.
 */
export function runEach<T extends Iterable<unknown>>(values: T, callback: (value: IterableItem<T>) => void): T {
  for (const value of values) {
    callback(value as IterableItem<T>);
  }
  return values;
}

/**
 * Maps each item of the specified iterable with the callback and returns the results as a new array.
 * @template T The type of the input items.
 * @template U The type of the mapped items.
 * @param values The iterable whose items are transformed.
 * @param callback The callback that maps each item to a new value.
 * @returns A new array containing the mapped items.
 */
export function transformEach<T, U>(values: Iterable<T>, callback: (value: T) => U): U[] {
  const result: U[] = [];
  for (const value of values) {
    result.push(callback(value));
  }
  return result;
}

/**
 * Ignores the specified value and returns nothing. Useful for explicitly discarding the result of an expression.
 * @param _ The value to ignore.
 */
export function asVoid(_: unknown): void {
  // Do nothing
}
