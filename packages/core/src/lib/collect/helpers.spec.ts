import { collect, collectRecord } from './helpers';
import { OpenApiCollectorData } from './types';

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

describe('collectRecord', () => {
  const data = {} as OpenApiCollectorData;
  const testFunc = jest.fn();

  beforeEach(() => {
    testFunc.mockReset();
  });

  it('should not call the provided function if the input object is undefined', () => {
    collectRecord(data, undefined, testFunc);
    expect(testFunc).not.toHaveBeenCalled();
  });

  it('should call the provided function for each non-null and non-undefined value in the input object', () => {
    const obj = {
      a: 1,
      b: null,
      c: undefined,
      d: 2,
    };
    collectRecord(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(2);
    expect(testFunc).toHaveBeenCalledWith(data, 1, 'a');
    expect(testFunc).toHaveBeenCalledWith(data, 2, 'd');
  });

  it('should not call the provided function for keys starting with "$" or "x-"', () => {
    const obj = {
      a: 1,
      $b: 2,
      'x-c': 3,
    };
    collectRecord(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(1);
    expect(testFunc).toHaveBeenCalledWith(data, 1, 'a');
  });
});
