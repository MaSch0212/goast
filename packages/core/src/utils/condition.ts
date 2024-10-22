export type Condition<T = never> = boolean | ([T] extends [never] ? () => boolean : (ctx: T) => boolean);
export function evalCondition(condition: Condition<never>): boolean;
export function evalCondition<T>(condition: Condition<T>, ctx: T): boolean;
export function evalCondition<T>(condition: Condition<T>, ctx?: T): boolean {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return typeof condition === 'function' ? condition(ctx!) : condition;
}
