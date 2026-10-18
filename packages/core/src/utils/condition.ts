/**
 * A boolean value, or a function that returns one. If `T` is `never`, the function takes no arguments; otherwise, it
 * receives a context value of type `T`.
 * @template T The type of the context value passed to a condition function.
 * @example
 * ```ts
 * const longName: Condition<string> = (name) => name.length > 10;
 * evalCondition(longName, 'example-name'); // true
 * ```
 */
export type Condition<T = never> = boolean | ([T] extends [never] ? () => boolean : (ctx: T) => boolean);
/**
 * Evaluates the specified condition. A function condition is invoked without a context value.
 * @param condition The boolean value or condition function to evaluate.
 * @returns The boolean result of the condition.
 */
export function evalCondition(condition: Condition<never>): boolean;
/**
 * Evaluates the specified condition with a context value. A function condition is invoked with the context value.
 * @template T The type of the context value.
 * @param condition The boolean value or condition function to evaluate.
 * @param ctx The context value to pass to a condition function.
 * @returns The boolean result of the condition.
 */
export function evalCondition<T>(condition: Condition<T>, ctx: T): boolean;
export function evalCondition<T>(condition: Condition<T>, ctx?: T): boolean {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return typeof condition === 'function' ? condition(ctx!) : condition;
}
