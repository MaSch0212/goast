export function classifyArray<TItem, TClassification extends Record<string, abstract new (...args: any[]) => any>>(
  items: Iterable<TItem>,
  classification: TClassification,
): { [P in keyof TClassification]: InstanceType<TClassification[P]>[] } & {
  rest: Exclude<TItem, InstanceType<TClassification[string]>>[];
} {
  const result = { rest: [] } as { [P in keyof TClassification]: InstanceType<TClassification[P]>[] } & {
    rest: Exclude<TItem, InstanceType<TClassification[string]>>[];
  };

  for (const key in classification) {
    (result as any)[key] = [];
  }

  for (const item of items) {
    let classified = false;
    for (const key in classification) {
      const type = classification[key];
      if (item instanceof type) {
        result[key].push(item as any);
        classified = true;
        break;
      }
    }
    if (!classified) {
      result.rest.push(item as any);
    }
  }

  return result;
}

export function isInstanceOf<T>(item: unknown, type: abstract new (...args: any[]) => T): item is T {
  return item instanceof type;
}

export function getIsInstanceOf<T>(type: abstract new (...args: any[]) => T) {
  return (item: unknown): item is T => item instanceof type;
}
