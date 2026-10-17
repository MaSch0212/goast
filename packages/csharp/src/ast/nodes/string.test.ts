import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csString', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  describe('regular', () => {
    it('should write a string', () => {
      builder.append(csString('hello'));
      expect(builder.toString(false)).toBe('"hello"');
    });

    it('should write an empty string', () => {
      builder.append(csString(''));
      expect(builder.toString(false)).toBe('""');
    });

    it('should write null for a null value', () => {
      builder.append(csString(null));
      expect(builder.toString(false)).toBe('null');
    });

    it('should escape quotes, backslashes and line breaks', () => {
      builder.append(csString('a "b" \\ c\nd\te'));
      expect(builder.toString(false)).toBe('"a \\"b\\" \\\\ c\\nd\\te"');
    });

    it('should not escape braces or dollar signs', () => {
      builder.append(csString('{x} ${y}'));
      expect(builder.toString(false)).toBe('"{x} ${y}"');
    });
  });

  describe('verbatim', () => {
    it('should write a verbatim string', () => {
      builder.append(csString.verbatim('C:\\dir\\file'));
      expect(builder.toString(false)).toBe('@"C:\\dir\\file"');
    });

    it('should double quotes', () => {
      builder.append(csString.verbatim('say "hi"'));
      expect(builder.toString(false)).toBe('@"say ""hi"""');
    });

    it('should write null for a null value', () => {
      builder.append(csString.verbatim(null));
      expect(builder.toString(false)).toBe('null');
    });
  });

  describe('interpolated', () => {
    it('should write literal text and embedded values', () => {
      builder.append(csString.interpolated(['Hello ', { value: 'name' }, '!']));
      expect(builder.toString(false)).toBe('$"Hello {name}!"');
    });

    it('should escape braces and quotes in literal text', () => {
      builder.append(csString.interpolated(['{"a"} ', { value: 'x' }]));
      expect(builder.toString(false)).toBe('$"{{\\"a\\"}} {x}"');
    });

    it('should write format and alignment', () => {
      builder.append(csString.interpolated([{ value: 'price', format: 'N2', alignment: -10 }]));
      expect(builder.toString(false)).toBe('$"{price,-10:N2}"');
    });

    it('should write nodes as embedded values and register their usings', () => {
      builder.append(csString.interpolated(['/pets/', { value: csReference('Guid', 'System') }]));
      expect(builder.toString(false)).toBe('$"/pets/{Guid}"');
      expect(builder.usings.usings).toEqual(['System']);
    });

    it('should write an empty interpolated string', () => {
      builder.append(csString.interpolated([]));
      expect(builder.toString(false)).toBe('$""');
    });
  });

  describe('raw', () => {
    it('should write a raw string literal on multiple lines', () => {
      builder.append(csString.raw('line 1\nline 2'));
      expect(builder.toString(false)).toBe('"""\nline 1\nline 2\n"""');
    });

    it('should use a longer delimiter than any quote run in the text', () => {
      builder.append(csString.raw('a """ b'));
      expect(builder.toString(false)).toBe('""""\na """ b\n""""');
    });
  });

  it('should render injections', () => {
    builder.append(csString('a', { inject: { before: '(', after: ')' } }));
    expect(builder.toString(false)).toBe('("a")');
  });
});
