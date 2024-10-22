import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { getInitializedValue } from './generator.utils.ts';

describe('getInitializedValue', () => {
  it('should return the value if it is not undefined', () => {
    const value = 'test';
    expect(getInitializedValue(value)).toEqual(value);
  });

  it('should throw an error if the value is undefined', () => {
    expect(() => getInitializedValue(undefined)).toThrow('Generator not initialized.');
  });
});
