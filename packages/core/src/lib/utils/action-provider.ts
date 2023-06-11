/* eslint-disable @typescript-eslint/no-explicit-any */

import { EmptyConstructor, FunctionNames } from './type.utils';

type MatchingFunctionNames<T, TAction> = {
  [K in keyof T]: T[K] extends TAction ? K : never;
}[keyof T];

type CtorActionRunner<T, TAction> = {
  kind: 'ctor';
  factory: EmptyConstructor<T>;
  functionName: MatchingFunctionNames<T, TAction>;
};

type FnActionRunner<TAction> = {
  kind: 'fn';
  action: TAction;
};

type ValueActionRunner<T, TAction> = {
  kind: 'value';
  value: T;
  functionName: MatchingFunctionNames<T, TAction>;
};

class Foo {
  public bar(value: string): string {
    return `Hello, ${value}!`;
  }
}

type ActionRunner<TAction> = CtorActionRunner<any, TAction> | FnActionRunner<TAction> | ValueActionRunner<any, TAction>;

export class ActionProvider<TAction extends (...args: any[]) => any> {
  constructor(private readonly _runner: ActionRunner<TAction>) {}

  public run(...args: Parameters<TAction>): ReturnType<TAction> {
    switch (this._runner.kind) {
      case 'ctor':
        return new this._runner.factory()[this._runner.functionName as any](...args);
      case 'fn':
        return this._runner.action(...args);
      case 'value':
        return this._runner.value[this._runner.functionName as any](...args);
    }
  }

  public static fromType<T, TName extends FunctionNames<T>>(
    type: EmptyConstructor<T>,
    functionName: TName
  ): ActionProvider<T[TName] extends (...args: any[]) => any ? T[TName] : never> {
    return new ActionProvider({ kind: 'ctor', factory: type, functionName: functionName as any });
  }

  public static fromFn<TAction extends (...args: any[]) => any>(fn: TAction): ActionProvider<TAction> {
    return new ActionProvider({ kind: 'fn', action: fn });
  }

  public static fromValue<T, TName extends FunctionNames<T>>(
    value: T,
    functionName: TName
  ): ActionProvider<T[TName] extends (...args: any[]) => any ? T[TName] : never> {
    return new ActionProvider({ kind: 'value', value, functionName: functionName as any });
  }
}
