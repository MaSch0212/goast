import { describe, it } from '@std/testing/bdd';
import { createOverwriteProxy } from './object.utils.ts';
import { expect } from '@std/expect';

describe('createOverwriteProxy', () => {
  it('should return an object that overwrites specified properties', () => {
    const obj = { a: 1, b: 2 };
    const proxy = createOverwriteProxy(obj);
    proxy.a = 3;
    expect(proxy.a).toEqual(3);
    expect(obj.a).toEqual(1);
  });

  it('should return an object that does not overwrite unspecified properties', () => {
    const obj = { a: 1, b: 2 };
    const proxy = createOverwriteProxy(obj);
    proxy.a = 3;
    expect(proxy.b).toEqual(2);
    expect(obj.b).toEqual(2);
  });

  it('should return an object that gets updates to non overwritten properties', () => {
    const obj = { a: 1, b: 2 };
    const proxy = createOverwriteProxy(obj);
    proxy.a = 3;
    obj.a = 2;
    obj.b = 4;
    expect(proxy.a).toEqual(3);
    expect(proxy.b).toEqual(4);
  });
});
