import { OpenApiObject } from './openapi-types';
import { Deref, DerefSource } from './types';
import { isNullish } from '../utils';

export function createDerefProxy<T extends OpenApiObject<string>>(
  obj: T,
  source: DerefSource<T>,
  ref?: Deref<T>
): Deref<T> {
  return new Proxy(obj, new DerefProxyHandler(source, ref)) as Deref<T>;
}

const propertiesNotDerivedFromRef: PropertyKey[] = ['title'];

class DerefProxyHandler<T extends OpenApiObject<string>> implements ProxyHandler<T> {
  private readonly _overwrittenValues: Record<PropertyKey, unknown> = {};

  constructor(private readonly _source: DerefSource<T>, private _ref?: Deref<T>) {}

  public get(target: T, prop: PropertyKey): unknown {
    if (prop === '$ref') {
      return this._ref;
    } else if (prop === '$src') {
      return this._source;
    }

    if (this._overwrittenValues[prop] !== undefined) {
      return this._overwrittenValues[prop];
    }
    if ((target as Record<PropertyKey, unknown>)[prop] !== undefined) {
      return (target as Record<PropertyKey, unknown>)[prop];
    }

    return propertiesNotDerivedFromRef.includes(prop)
      ? undefined
      : (this._ref as Record<PropertyKey, unknown> | undefined)?.[prop];
  }

  public set(target: T, prop: PropertyKey, value: unknown): boolean {
    if (prop === '$ref' && (typeof value === 'object' || typeof value === 'undefined')) {
      this._ref = !value ? undefined : (value as Deref<T>);
      return true;
    }
    if (prop === '$src') {
      return false;
    }

    this._overwrittenValues[prop] = value;
    return true;
  }

  public has(target: T, prop: PropertyKey): boolean {
    return prop in target || (!isNullish(this._ref) && prop in this._ref);
  }

  public ownKeys(target: T): ArrayLike<string | symbol> {
    return Array.from(
      new Set([...Object.keys(target), ...(!isNullish(this._ref) ? Object.keys(this._ref) : []), '$ref', '$src'])
    );
  }
}
