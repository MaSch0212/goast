import { getInitializedValue } from './generator.utils';

describe('getInitializedValue', () => {
  it('should return the value if it is not undefined', () => {
    const value = 'test';
    expect(getInitializedValue(value)).toEqual(value);
  });

  it('should throw an error if the value is undefined', () => {
    expect(() => getInitializedValue(undefined)).toThrowError('Generator not initialized.');
  });
});
