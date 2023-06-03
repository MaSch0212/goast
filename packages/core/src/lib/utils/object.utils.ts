export function createOverwriteProxy<T extends object>(target: T): T {
  return new Proxy(target, new OverwriteProxyHandler());
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
