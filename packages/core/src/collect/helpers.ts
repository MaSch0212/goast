import { isOpenApiObjectProperty } from '../internal-utils.ts';
import type { Nullable } from '../utils/type.utils.ts';
import type { OpenApiCollectorData } from './types.ts';

/**
 * Calls `func` for each object in a value that is either a single object or an array of objects.
 * Null entries and objects marked with `x-ignore` are skipped.
 * @template T The type of the objects.
 * @param data The collector data that is passed on to `func`.
 * @param obj The single object or array of objects to visit.
 * @param func The function that is called for each object.
 */
export function collect<T extends Record<`x-${string}`, unknown>>(
  data: OpenApiCollectorData,
  obj: Nullable<T | Nullable<T>[]>,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>) => void,
) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const o of obj) {
      if (!o) continue;
      if (o['x-ignore']) continue;
      func(data, o);
    }
  } else {
    if (obj['x-ignore']) return;
    func(data, obj);
  }
}

/**
 * Calls `func` for each value of a record, such as the schemas of a document or the paths of a specification.
 * Keys starting with `$` or `x-`, null values and values marked with `x-ignore` are skipped.
 * @template T The type of the values.
 * @param data The collector data that is passed on to `func`.
 * @param obj The record to visit.
 * @param func The function that is called for each value together with its key.
 */
export function collectRecord<T extends Record<`x-${string}`, unknown>>(
  data: OpenApiCollectorData,
  obj: Nullable<Record<string, Nullable<T>>>,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>, key: string) => void,
) {
  if (!obj) return;
  for (const key in obj) {
    if (!isOpenApiObjectProperty(key)) continue;
    const value = obj[key];
    if (!value) continue;
    if (value['x-ignore']) continue;
    func(data, value, key);
  }
}
