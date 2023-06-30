import { collect, collectRecord } from './helpers';
import { OpenApiCollectorData } from './types';

describe('collect', () => {
  const data = {} as OpenApiCollectorData;
  const testFunc = jest.fn();

  beforeEach(() => {
    testFunc.mockReset();
  });

  test('collect should handle null and undefined input', () => {
    collect(data, null, testFunc);
    collect(data, undefined, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(0);
  });

  test('collect should handle single non-array input', () => {
    const obj = { 'x-id': 'test' };
    collect(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(1);
    expect(testFunc).toHaveBeenCalledWith(data, obj);
  });

  test('collect should handle array input', () => {
    const obj = [{ 'x-id': 'foo' }, { 'x-id': 'bar' }, { 'x-id': 'baz' }];
    collect(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(3);
    expect(testFunc).toHaveBeenCalledWith(data, obj[0]);
    expect(testFunc).toHaveBeenCalledWith(data, obj[1]);
    expect(testFunc).toHaveBeenCalledWith(data, obj[2]);
  });

  test('collect should handle array input with null or undefined values', () => {
    const obj = [{ 'x-id': 'foo' }, null, { 'x-id': 'bar' }, undefined, { 'x-id': 'baz' }];
    collect(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(3);
    expect(testFunc).toHaveBeenCalledWith(data, obj[0]);
    expect(testFunc).toHaveBeenCalledWith(data, obj[2]);
    expect(testFunc).toHaveBeenCalledWith(data, obj[4]);
  });

  test('collect should not call func for null or undefined array elements', () => {
    const obj = [null, undefined];
    collect(data, obj, testFunc);
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
      a: { 'x-id': 1 },
      b: null,
      c: undefined,
      d: { 'x-id': 2 },
    };
    collectRecord(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(2);
    expect(testFunc).toHaveBeenCalledWith(data, obj.a, 'a');
    expect(testFunc).toHaveBeenCalledWith(data, obj.d, 'd');
  });

  it('should not call the provided function for keys starting with "$" or "x-"', () => {
    const obj = {
      a: { 'x-id': 1 },
      $b: { 'x-id': 2 },
      'x-c': { 'x-id': 3 },
    };
    collectRecord(data, obj, testFunc);
    expect(testFunc).toHaveBeenCalledTimes(1);
    expect(testFunc).toHaveBeenCalledWith(data, obj.a, 'a');
  });
});
