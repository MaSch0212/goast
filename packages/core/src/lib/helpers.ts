import { Nullable } from './type.utils.js';

export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function notNullish<T>(value: Nullable<T>): value is T {
  return !isNullish(value);
}
