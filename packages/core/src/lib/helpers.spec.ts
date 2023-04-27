import { isNullish } from './helpers.js';

describe('isNullish', () => {
  test('returns true for null', () => {
    expect(isNullish(null)).toBe(true);
  });

  test('returns true for undefined', () => {
    expect(isNullish(undefined)).toBe(true);
  });

  test('returns false for any other value', () => {
    expect(isNullish('')).toBe(false);
    expect(isNullish(false)).toBe(false);
    expect(isNullish(0)).toBe(false);
    expect(isNullish({})).toBe(false);
  });
});
