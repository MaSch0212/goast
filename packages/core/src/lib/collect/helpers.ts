import { OpenApiCollectorData } from './types';
import { isOpenApiObjectProperty } from '../internal-utils';

export function collect<T>(
  data: OpenApiCollectorData,
  obj: T | T[] | undefined,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>) => void
) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const o of obj) {
      if (!o) continue;
      func(data, o);
    }
  } else {
    func(data, obj);
  }
}

export function collectRecord<T>(
  data: OpenApiCollectorData,
  obj: Record<string, T> | undefined,
  func: (data: OpenApiCollectorData, obj: NonNullable<T>, key: string) => void
) {
  if (!obj) return;
  for (const key in obj) {
    if (!isOpenApiObjectProperty(key)) continue;
    const value = obj[key];
    if (!value) continue;
    func(data, value, key);
  }
}
