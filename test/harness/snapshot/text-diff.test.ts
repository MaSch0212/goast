import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { firstTextDifference } from './text-diff.ts';

const encode = (text: string) => new TextEncoder().encode(text);

describe('firstTextDifference', () => {
  it('should return null for identical buffers', () => {
    expect(firstTextDifference(encode('same'), encode('same'))).toBeNull();
  });

  it('should report the first differing line with surrounding context', () => {
    const expected = encode('a\nb\nc\nOLD\ne\nf\ng\n');
    const actual = encode('a\nb\nc\nNEW\ne\nf\ng\n');

    expect(firstTextDifference(expected, actual)).toEqual({
      lineNumber: 4,
      before: ['a', 'b', 'c'],
      expected: 'OLD',
      actual: 'NEW',
      after: ['e', 'f', 'g'],
    });
  });

  it('should clamp context at the start and end of the file', () => {
    expect(firstTextDifference(encode('OLD\nb'), encode('NEW\nb'))).toEqual({
      lineNumber: 1,
      before: [],
      expected: 'OLD',
      actual: 'NEW',
      after: ['b'],
    });
  });

  it('should report an undefined side when a file has extra trailing lines', () => {
    expect(firstTextDifference(encode('a\n'), encode('a\nextra\n'))).toEqual({
      lineNumber: 2,
      before: ['a'],
      expected: '',
      actual: 'extra',
      after: [''],
    });

    expect(firstTextDifference(encode('a\nb'), encode('a'))).toEqual({
      lineNumber: 2,
      before: ['a'],
      expected: 'b',
      actual: undefined,
      after: [],
    });
  });

  it('should detect a carriage-return-only difference', () => {
    const result = firstTextDifference(encode('a\r\nb'), encode('a\nb'));
    expect(result).toEqual({
      lineNumber: 1,
      before: [],
      expected: 'a\r',
      actual: 'a',
      after: ['b'],
    });
  });

  it('should report binary buffers instead of diffing them', () => {
    expect(firstTextDifference(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1, 3]))).toBe('binary');
  });
});
