export function createOverwriteProxy<T extends object>(target: T, values?: Partial<T>): T {
  const proxy = new Proxy(target, new OverwriteProxyHandler());
  if (values) {
    Object.assign(proxy, values);
  }
  return proxy;
}

export function getDeepProperty(obj: object, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    // deno-lint-ignore no-explicit-any
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
