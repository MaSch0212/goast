import { describe, expect, it } from 'vitest';

import { isNullish } from './common.utils.ts';

describe('isNullish', () => {
  it('returns true for null', () => {
    expect(isNullish(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isNullish(undefined)).toBe(true);
  });

  it('returns false for any other value', () => {
    expect(isNullish('')).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish(0)).toBe(false);
    expect(isNullish({})).toBe(false);
  });
});
