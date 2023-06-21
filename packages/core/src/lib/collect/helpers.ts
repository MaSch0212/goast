import { OpenApiCollectorData } from './types';
import { isOpenApiObjectProperty } from '../internal-utils';

export function collect<T extends Record<`x-${string}`, unknown>>(
  data: OpenApiCollectorData,
  obj: T | T[] | undefined,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>) => void
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

export function collectRecord<T extends Record<`x-${string}`, unknown>>(
  data: OpenApiCollectorData,
  obj: Record<string, T> | undefined,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>, key: string) => void
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
