import type { Constructor } from './type.utils.ts';

type FactoryProvider<T, TArgs extends unknown[]> =
  | {
      kind: 'ctor';
      factory: Constructor<T, TArgs>;
    }
  | {
      kind: 'fn';
      factory: (...args: TArgs) => T;
    }
  | {
      kind: 'value';
      factory: T;
    };

/**
 * Creates values on demand. A factory is backed by a constructor, a function or a fixed value, which lets callers
 * supply an alternative implementation, such as a custom generator, without changing the code that uses it.
 * @template T The type of the created values.
 * @template TArgs The types of the arguments passed to the constructor or function.
 * @example
 * ```ts
 * const byFn = Factory.fromFn((name: string) => new MyGenerator(name));
 * const byValue = Factory.fromValue(new MyGenerator('default'));
 *
 * const generator = byFn.create('custom'); // A new instance on every call.
 * const same = byValue.create(); // Always the same instance.
 * ```
 */
export class Factory<T, TArgs extends unknown[]> {
  private readonly _provider: FactoryProvider<T, TArgs>;

  /**
   * Initializes a new instance of the Factory class. Prefer the static `fromType`, `fromFn` and `fromValue` methods.
   * @param provider The provider that determines how values are created.
   */
  constructor(provider: FactoryProvider<T, TArgs>) {
    this._provider = provider;
  }

  /**
   * Creates a value. Constructors are invoked with `new` and functions are called with the arguments. Fixed values
   * are returned as-is, so the same value is returned on every call.
   * @param args The arguments to pass to the constructor or function. Ignored for fixed values.
   * @returns The created value.
   */
  public create(...args: TArgs): T {
    switch (this._provider.kind) {
      case 'ctor':
        return new this._provider.factory(...args);
      case 'fn':
        return this._provider.factory(...args);
      case 'value':
        return this._provider.factory;
    }
  }

  /**
   * Creates a factory that instantiates the specified class with `new` on every call to `create`.
   * @template T The type of the created values.
   * @template TArgs The types of the constructor arguments.
   * @param type The constructor to invoke.
   * @returns A new factory that creates values with the constructor.
   */
  public static fromType<T, TArgs extends unknown[]>(type: Constructor<T, TArgs>): Factory<T, TArgs> {
    return new Factory({ kind: 'ctor', factory: type });
  }

  /**
   * Creates a factory that calls the specified function on every call to `create`.
   * @template T The type of the created values.
   * @template TArgs The types of the function arguments.
   * @param fn The function that creates the values.
   * @returns A new factory that creates values with the function.
   */
  public static fromFn<T, TArgs extends unknown[]>(fn: (...args: TArgs) => T): Factory<T, TArgs> {
    return new Factory({ kind: 'fn', factory: fn });
  }

  /**
   * Creates a factory that always returns the specified value. The value is not copied, so every call to `create`
   * returns the same value.
   * @template T The type of the value.
   * @param value The value to return from `create`.
   * @returns A new factory that returns the value.
   */
  public static fromValue<T>(value: T): Factory<T, []> {
    return new Factory({ kind: 'value', factory: value });
  }
}
