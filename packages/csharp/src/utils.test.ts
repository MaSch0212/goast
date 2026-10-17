import { describe, expect, it } from 'vitest';

import {
  escapeCSharpKeyword,
  escapeCSharpString,
  isCSharpKeyword,
  toCSharpPropertyName,
  toCSharpStringLiteral,
} from './utils.ts';

describe('escapeCSharpKeyword', () => {
  it('should prefix reserved keywords with @', () => {
    expect(escapeCSharpKeyword('class')).toBe('@class');
    expect(escapeCSharpKeyword('namespace')).toBe('@namespace');
    expect(escapeCSharpKeyword('string')).toBe('@string');
  });

  it('should not touch other identifiers', () => {
    expect(escapeCSharpKeyword('Class')).toBe('Class');
    expect(escapeCSharpKeyword('name')).toBe('name');
  });

  it('should not escape contextual keywords', () => {
    expect(escapeCSharpKeyword('record')).toBe('record');
    expect(escapeCSharpKeyword('var')).toBe('var');
    expect(escapeCSharpKeyword('async')).toBe('async');
  });
});

describe('isCSharpKeyword', () => {
  it('should detect reserved keywords', () => {
    expect(isCSharpKeyword('event')).toBe(true);
    expect(isCSharpKeyword('Event')).toBe(false);
  });
});

describe('toCSharpPropertyName', () => {
  it('should escape keywords', () => {
    expect(toCSharpPropertyName('object')).toBe('@object');
  });

  it('should prefix names starting with a digit', () => {
    expect(toCSharpPropertyName('1st')).toBe('_1st');
  });

  it('should keep valid names', () => {
    expect(toCSharpPropertyName('firstName')).toBe('firstName');
  });
});

describe('escapeCSharpString', () => {
  it('should escape quotes and backslashes', () => {
    expect(escapeCSharpString('a "b" \\c')).toBe('a \\"b\\" \\\\c');
  });

  it('should escape whitespace control characters', () => {
    expect(escapeCSharpString('a\nb\r\tc')).toBe('a\\nb\\r\\tc');
  });

  it('should escape other control characters as unicode', () => {
    expect(escapeCSharpString('a\u0001b')).toBe('a\\u0001b');
  });

  it('should not escape braces or dollar signs', () => {
    expect(escapeCSharpString('${x} {y}')).toBe('${x} {y}');
  });
});

describe('toCSharpStringLiteral', () => {
  it('should return an empty literal for empty values', () => {
    expect(toCSharpStringLiteral(null)).toBe('""');
    expect(toCSharpStringLiteral('')).toBe('""');
  });

  it('should quote and escape', () => {
    expect(toCSharpStringLiteral('say "hi"')).toBe('"say \\"hi\\""');
  });
});
