import { OpenApiCollectorData } from './types.js';

export function collect<T>(
  data: OpenApiCollectorData,
  obj: T | T[],
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
