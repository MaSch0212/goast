import type { EmptyConstructor, FunctionNames } from './type.utils.ts';

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

type ActionRunner<TAction> = CtorActionRunner<any, TAction> | FnActionRunner<TAction> | ValueActionRunner<any, TAction>;

/**
 * Provides an action that can be run later. The action is either a method of a class that is instantiated for each run,
 * a plain function, or a method of an object that is shared across runs.
 * @template TAction The signature of the action.
 */
export class ActionProvider<TAction extends (...args: any[]) => any> {
  private readonly _runner: ActionRunner<TAction>;

  /**
   * Initializes a new instance of the ActionProvider class. Prefer the static `fromType`, `fromFn` and `fromValue`
   * methods.
   * @param runner The runner that determines how the action is invoked.
   */
  constructor(runner: ActionRunner<TAction>) {
    this._runner = runner;
  }

  /**
   * Runs the action with the specified arguments. For class-based providers, a new instance is created on each run.
   * @param args The arguments to pass to the action.
   * @returns The result of the action.
   */
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

  /**
   * Creates an action provider that calls a method on a new instance of the specified class each time it runs.
   * @template T The type of the class instance.
   * @template TName The name of the method to call.
   * @param type The class to instantiate. Its constructor must not require arguments.
   * @param functionName The name of the method to call on the instance.
   * @returns A new action provider.
   */
  public static fromType<T, TName extends FunctionNames<T>>(
    type: EmptyConstructor<T>,
    functionName: TName,
  ): ActionProvider<T[TName] extends (...args: any[]) => any ? T[TName] : never> {
    return new ActionProvider({ kind: 'ctor', factory: type, functionName: functionName as any });
  }

  /**
   * Creates an action provider that calls the specified function each time it runs.
   * @template TAction The signature of the function.
   * @param fn The function to call.
   * @returns A new action provider.
   */
  public static fromFn<TAction extends (...args: any[]) => any>(fn: TAction): ActionProvider<TAction> {
    return new ActionProvider({ kind: 'fn', action: fn });
  }

  /**
   * Creates an action provider that calls a method on the specified object each time it runs. The object is shared
   * across runs.
   * @template T The type of the object.
   * @template TName The name of the method to call.
   * @param value The object that contains the method.
   * @param functionName The name of the method to call on the object.
   * @returns A new action provider.
   */
  public static fromValue<T, TName extends FunctionNames<T>>(
    value: T,
    functionName: TName,
  ): ActionProvider<T[TName] extends (...args: any[]) => any ? T[TName] : never> {
    return new ActionProvider({ kind: 'value', value, functionName: functionName as any });
  }
}
