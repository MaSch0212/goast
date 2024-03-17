import { SingleOrMultiple } from './type.utils';

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
