import { describe, expect, it, vi } from 'vitest';

import { type Condition, evalCondition } from './condition.ts';

describe('evalCondition', () => {
  it('should return the correct boolean value when condition is true', () => {
    const condition: Condition = true;
    const result = evalCondition(condition);
    expect(result).toBe(true);
  });

  it('should return the correct boolean value when condition is false', () => {
    const condition: Condition = false;
    const result = evalCondition(condition);
    expect(result).toBe(false);
  });

  it('should call the condition function and return the correct boolean value without context', () => {
    const condition = vi.fn<() => boolean>(() => true);
    const result = evalCondition(condition);
    expect(result).toBe(true);
    expect(condition).toHaveBeenCalledTimes(1);
  });

  it('should call the condition function with the provided context and return the correct boolean value', () => {
    const context = {
      prop: 5,
    };
    const condition = vi.fn<(ctx: typeof context) => boolean>((ctx) => ctx.prop === 5);
    const result = evalCondition(condition, context);
    expect(result).toBe(true);
    expect(condition).toHaveBeenCalledWith(context);
  });
});
