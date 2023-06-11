import { Factory } from './factory';

describe('Factory', () => {
  describe('create', () => {
    it('should create an instance using a constructor', () => {
      class Foo {
        constructor(public readonly value: string) {}
      }
      const factory = Factory.fromType(Foo);
      const instance = factory.create('bar');
      expect(instance).toBeInstanceOf(Foo);
      expect(instance.value).toBe('bar');
    });

    it('should create an instance using a factory function', () => {
      const factory = Factory.fromFn((value: string) => ({ value }));
      const instance = factory.create('bar');
      expect(instance).toEqual({ value: 'bar' });
    });

    it('should return a value', () => {
      const factory = Factory.fromValue('foo');
      const instance = factory.create();
      expect(instance).toBe('foo');
    });
  });
});
