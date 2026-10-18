/**
 * Creates a proxy around an object whose property writes are stored separately, so the target is never modified.
 * A read returns the written value, unless it is nullish. In that case the value of the target is returned.
 * Only property reads and writes are intercepted. Other operations, such as `in` or `Object.keys`, use the target.
 * @template T The type of the object.
 * @param target The object to wrap.
 * @param values The properties to write to the proxy right away.
 * @returns A proxy that behaves like the target with the written values overriding it.
 */
export function createOverwriteProxy<T extends object>(target: T, values?: Partial<T>): T {
  const proxy = new Proxy(target, new OverwriteProxyHandler());
  if (values) {
    Object.assign(proxy, values);
  }
  return proxy;
}

/**
 * Gets a nested property by following a path of keys.
 * @param obj The object to read from.
 * @param path The keys to follow, one per level. An empty path returns `obj` itself.
 * @returns The value at the end of the path, or `undefined` if a value along the way is not an object, for example a
 * primitive, `null` or a function, or if a key does not exist.
 */
export function getDeepProperty(obj: object, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as any)[key];
  }
  return current;
}

class OverwriteProxyHandler<T extends object> implements ProxyHandler<T> {
  private readonly _overwrittenValues: Record<PropertyKey, unknown> = {};

  public get(target: T, prop: PropertyKey): unknown {
    return this._overwrittenValues[prop] ?? (target as Record<PropertyKey, unknown>)[prop];
  }

  public set(_target: T, prop: PropertyKey, value: unknown): boolean {
    this._overwrittenValues[prop] = value;
    return true;
  }
}
