/* eslint-disable @typescript-eslint/no-explicit-any */
import { Constructor } from './type.utils';

type FactoryProvider<T, TArgs extends any[]> =
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

export class Factory<T, TArgs extends any[]> {
  constructor(private readonly _provider: FactoryProvider<T, TArgs>) {}

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

  public static fromType<T, TArgs extends any[]>(type: Constructor<T, TArgs>): Factory<T, TArgs> {
    return new Factory({ kind: 'ctor', factory: type });
  }

  public static fromFn<T, TArgs extends any[]>(fn: (...args: TArgs) => T): Factory<T, TArgs> {
    return new Factory({ kind: 'fn', factory: fn });
  }

  public static fromValue<T>(value: T): Factory<T, []> {
    return new Factory({ kind: 'value', factory: value });
  }
}
