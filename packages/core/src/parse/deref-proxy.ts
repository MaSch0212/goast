import { isNullish } from '../utils/common.utils.ts';
import type { OpenApiObject } from './openapi-types.ts';
import type { Deref, DerefSource } from './types.ts';

/**
 * Wraps a raw OpenAPI object in a proxy so that `$ref` references are followed transparently.
 *
 * Property reads go to the wrapped object first. If it does not define the property, the read falls through to the
 * resolved `$ref` target, which is looked up at access time. Consumers can therefore read `schema.properties` on a
 * referencing object without checking whether the value is local or referenced. `title` is the exception and is never
 * inherited from the target. Assignments are stored on the proxy and do not modify `obj`. The `$ref` and `$src`
 * properties are always answered by the proxy itself.
 *
 * The parser attaches the resolved target as `$ref` while it dereferences a document. The result is typed as
 * `Deref<T>`, which has the shape of `T` without the raw `$ref` key, plus `$ref` and `$src`.
 * @template T The raw OpenAPI object type being wrapped.
 * @param obj The raw object to wrap. It is not modified.
 * @param source Provenance information, returned by the `$src` property.
 * @param ref The resolved target of the object's `$ref`, if it has one.
 * @returns A proxy that behaves like `obj` and follows its reference.
 * @see Deref
 * @see DerefSource
 */
export function createDerefProxy<T extends OpenApiObject<string>>(
  obj: T,
  source: DerefSource<T>,
  ref?: Deref<T>,
): Deref<T> {
  return new Proxy(obj, new DerefProxyHandler(source, ref)) as Deref<T>;
}

const propertiesNotDerivedFromRef: PropertyKey[] = ['title'];

class DerefProxyHandler<T extends OpenApiObject<string>> implements ProxyHandler<T> {
  private readonly _overwrittenValues: Record<PropertyKey, unknown> = {};
  private readonly _source: DerefSource<T>;
  private _ref?: Deref<T>;

  constructor(source: DerefSource<T>, ref?: Deref<T>) {
    this._source = source;
    this._ref = ref;
  }

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

  public set(_target: T, prop: PropertyKey, value: unknown): boolean {
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
      new Set([
        ...Object.getOwnPropertyNames(target),
        ...Object.getOwnPropertySymbols(target),
        ...(!isNullish(this._ref) ? Object.keys(this._ref) : []),
        '$ref',
        '$src',
      ]),
    );
  }
}
