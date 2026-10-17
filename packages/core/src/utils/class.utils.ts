/**
 * Groups the specified items by the first class in the classification that they are an instance of. Items that match
 * none of the classes are collected in the `rest` array.
 * @template TItem The type of the items to classify.
 * @template TClassification The record that maps property names to the classes to test against.
 * @param items The items to classify.
 * @param classification An object that maps property names to classes. Each key becomes an array in the result.
 * @returns An object with one array per classification key and a `rest` array for the unclassified items.
 */
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

/**
 * Checks whether the specified item is an instance of the specified class.
 * @template T The type to check for.
 * @param item The item to check.
 * @param type The class to check against.
 * @returns `true` if the item is an instance of the class; otherwise, `false`.
 */
export function isInstanceOf<T>(item: unknown, type: abstract new (...args: any[]) => T): item is T {
  return item instanceof type;
}

/**
 * Creates a type guard that checks whether an item is an instance of the specified class.
 * @template T The type to check for.
 * @param type The class to create the type guard for.
 * @returns A function that returns `true` if its argument is an instance of the class; otherwise, `false`.
 */
export function getIsInstanceOf<T>(type: abstract new (...args: any[]) => T): (item: unknown) => item is T {
  return (item): item is T => item instanceof type;
}
