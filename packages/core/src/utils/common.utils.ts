import type { SingleOrMultiple } from './type.utils.ts';

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function notNullish<T>(value: T): value is NonNullable<T> {
  return !isNullish(value);
}

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

export function isIterable(value: unknown): value is Iterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.iterator in value;
}

export function toArray<T>(value: T | T[] | Iterable<T>): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (isIterable(value)) {
    return Array.from(value);
  }
  return [value];
}

export function modify<T>(value: T, callback: (value: NonNullable<T>) => void): T {
  if (notNullish(value)) {
    callback(value);
  }
  return value;
}

export function run<T>(value: T, callback: (value: T) => void): T {
  callback(value);
  return value;
}

export function transform<T, U>(value: T, callback: (value: T) => U): U {
  return callback(value);
}

type IterableItem<T> = T extends Iterable<infer U> ? U : never;
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

export function runEach<T extends Iterable<unknown>>(values: T, callback: (value: IterableItem<T>) => void): T {
  for (const value of values) {
    callback(value as IterableItem<T>);
  }
  return values;
}

export function transformEach<T, U>(values: Iterable<T>, callback: (value: T) => U): U[] {
  const result: U[] = [];
  for (const value of values) {
    result.push(callback(value));
  }
  return result;
}

export function asVoid(_: unknown): void {
  // Do nothing
}
