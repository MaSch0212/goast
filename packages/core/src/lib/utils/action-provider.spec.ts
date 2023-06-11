import { ActionProvider } from './action-provider';

describe('ActionProvider', () => {
  describe('run', () => {
    it('should create an instance using a constructor and call the specified function', () => {
      class Foo {
        public bar(value: string): string {
          return `Hello, ${value}!`;
        }
      }
      const provider = ActionProvider.fromType(Foo, 'bar');
      const result = provider.run('world');
      expect(result).toBe('Hello, world!');
    });

    it('should call a function and return the result', () => {
      const provider = ActionProvider.fromFn((value: string) => `Hello, ${value}!`);
      const result = provider.run('world');
      expect(result).toBe('Hello, world!');
    });

    it('should call a function on a value and return the result', () => {
      const provider = ActionProvider.fromValue({ bar: (value: string) => `Hello, ${value}!` }, 'bar');
      const result = provider.run('world');
      expect(result).toBe('Hello, world!');
    });
  });
});
