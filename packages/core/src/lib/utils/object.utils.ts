export function createOverwriteProxy<T extends object>(target: T, values?: Partial<T>): T {
  const proxy = new Proxy(target, new OverwriteProxyHandler());
  if (values) {
    Object.assign(proxy, values);
  }
  return proxy;
}

class OverwriteProxyHandler<T extends object> implements ProxyHandler<T> {
  private readonly _overwrittenValues: Record<PropertyKey, unknown> = {};

  public get(target: T, prop: PropertyKey): unknown {
    return this._overwrittenValues[prop] ?? (target as Record<PropertyKey, unknown>)[prop];
  }

  public set(target: T, prop: PropertyKey, value: unknown): boolean {
    this._overwrittenValues[prop] = value;
    return true;
  }
}
