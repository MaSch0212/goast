import { collect } from './helpers.js';
import { OpenApiCollectorData } from './types.js';

describe('collect', () => {
  const data = {} as OpenApiCollectorData;
  const testFunc = jest.fn();

  beforeEach(() => {
    testFunc.mockReset();
  });

  test('collect should handle null and undefined input', () => {
    collect<string | null>(data, null, testFunc);
    collect<string | undefined>(data, undefined, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(0);
  });

  test('collect should handle single non-array input', () => {
    const obj = 'test';
    collect<string>(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(1);
    expect(testFunc).toHaveBeenCalledWith(data, obj);
  });

  test('collect should handle array input', () => {
    const obj = ['foo', 'bar', 'baz'];
    collect<string>(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(3);
    expect(testFunc).toHaveBeenCalledWith(data, 'foo');
    expect(testFunc).toHaveBeenCalledWith(data, 'bar');
    expect(testFunc).toHaveBeenCalledWith(data, 'baz');
  });

  test('collect should handle array input with null or undefined values', () => {
    const obj = ['foo', null, 'bar', undefined, 'baz'];
    collect<string | null | undefined>(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(3);
    expect(testFunc).toHaveBeenCalledWith(data, 'foo');
    expect(testFunc).toHaveBeenCalledWith(data, 'bar');
    expect(testFunc).toHaveBeenCalledWith(data, 'baz');
  });

  test('collect should not call func for null or undefined array elements', () => {
    const obj = [null, undefined];
    collect<string | null | undefined>(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(0);
  });
});
