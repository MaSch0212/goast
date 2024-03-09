import { Nullable, SingleOrMultiple } from './type.utils';

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function notNullish<T>(value: Nullable<T>): value is T {
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
