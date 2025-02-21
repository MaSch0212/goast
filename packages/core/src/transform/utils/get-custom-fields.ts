type CustomFields<T extends Record<string, unknown>> = {
  [K in keyof T as K extends `x-${string}` ? K : never]: T[K];
};

export function getCustomFields<T extends Record<string, unknown>>(schema: T): CustomFields<T> {
  const result = {} as CustomFields<T>;
  for (const key in schema) {
    if (key.startsWith('x-')) {
      const name = key.substring(2);
      (result as Record<string, unknown>)[name] = schema[key];
    }
  }
  return result;
}
