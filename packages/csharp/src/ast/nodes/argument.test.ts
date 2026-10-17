import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csArgument } from './argument.ts';
import { createBuilder } from './create-builder.test-utils.ts';

describe('csArgument', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a positional argument', () => {
    builder.append(csArgument('1'));
    expect(builder.toString(false)).toBe('1');
  });

  it('should write a named argument', () => {
    builder.append(csArgument.named('count', '1'));
    expect(builder.toString(false)).toBe('count: 1');
  });

  it('should write a modifier', () => {
    builder.append(csArgument('value', { modifier: 'out' }));
    expect(builder.toString(false)).toBe('out value');
  });

  it('should write a modifier on a named argument', () => {
    builder.append(csArgument.named('result', 'value', { modifier: 'ref' }));
    expect(builder.toString(false)).toBe('result: ref value');
  });

  it('should render injections', () => {
    builder.append(csArgument.named('a', '1', { inject: { beforeName: '<', afterValue: '>' } }));
    expect(builder.toString(false)).toBe('<a: 1>');
  });

  describe('write', () => {
    it('should write empty parentheses without arguments', () => {
      csArgument.write(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write arguments separated by commas', () => {
      csArgument.write(builder, ['1', csArgument.named('b', '2'), 3]);
      expect(builder.toString(false)).toBe('(1, b: 2, 3)');
    });

    it('should write more than three arguments on separate lines', () => {
      csArgument.write(builder, ['1', '2', '3', '4']);
      expect(builder.toString(false)).toBe('(\n    1,\n    2,\n    3,\n    4\n)');
    });

    it('should skip nullish arguments', () => {
      csArgument.write(builder, [null, '1', undefined]);
      expect(builder.toString(false)).toBe('(1)');
    });
  });
});
