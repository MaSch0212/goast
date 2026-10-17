import { describe, expect, it } from 'vitest';

import {
  isJsonMediaType,
  makeUniqueNames,
  toGoComment,
  toGoFileName,
  toGoIdentifier,
  toGoPackageName,
  toGoStringLiteral,
  toGoStructTag,
} from './utils.ts';

const initialisms = ['ID', 'URL', 'HTTP'];

describe('toGoIdentifier', () => {
  it('writes an exported identifier in pascal case with initialisms in all caps', () => {
    expect(toGoIdentifier('pet_id', { exported: true, initialisms })).toBe('PetID');
    expect(toGoIdentifier('http-url', { exported: true, initialisms })).toBe('HTTPURL');
  });

  it('writes an unexported identifier in camel case', () => {
    expect(toGoIdentifier('pet_id', { exported: false, initialisms })).toBe('petID');
    expect(toGoIdentifier('ID', { exported: false, initialisms })).toBe('id');
  });

  it('escapes an unexported keyword', () => {
    expect(toGoIdentifier('type', { exported: false })).toBe('type_');
    expect(toGoIdentifier('type', { exported: true })).toBe('Type');
  });

  it('uses the fallback for a name without words', () => {
    expect(toGoIdentifier('---', { exported: true })).toBe('Value');
    expect(toGoIdentifier('', { exported: true, fallback: 'empty' })).toBe('Empty');
  });
});

describe('makeUniqueNames', () => {
  it('appends a counter to repeated and reserved names', () => {
    expect(makeUniqueNames(['A', 'B', 'A', 'A'], ['B'])).toEqual(['A', 'B2', 'A2', 'A3']);
  });
});

describe('toGoFileName', () => {
  it('writes the name in snake case', () => {
    expect(toGoFileName('PetStatus')).toBe('pet_status.go');
  });

  it('appends the suffix to names Go treats specially', () => {
    expect(toGoFileName('pet_test')).toBe('pet_test_gen.go');
    expect(toGoFileName('build_linux')).toBe('build_linux_gen.go');
    expect(toGoFileName('build_386')).toBe('build_386_gen.go');
    expect(toGoFileName('build_js_wasm')).toBe('build_js_wasm_gen.go');
    expect(toGoFileName('linux')).toBe('linux.go');
  });

  it('uses the suffix for a name without words', () => {
    expect(toGoFileName('_')).toBe('gen.go');
  });
});

describe('toGoPackageName', () => {
  it('uses the last segment of the path', () => {
    expect(toGoPackageName('internal/pet-store')).toBe('petstore');
  });

  it('escapes keywords and falls back for empty names', () => {
    expect(toGoPackageName('api/type')).toBe('type_');
    expect(toGoPackageName('')).toBe('generated');
  });
});

describe('toGoStringLiteral', () => {
  it('escapes quotes, backslashes and control characters', () => {
    expect(toGoStringLiteral('a"b\\c\n\t\u0001')).toBe('"a\\"b\\\\c\\n\\t\\x01"');
  });

  it('keeps printable non-ASCII characters', () => {
    expect(toGoStringLiteral('Grüße \u{1F44B}')).toBe('"Grüße \u{1F44B}"');
  });

  it('replaces a lone surrogate', () => {
    expect(toGoStringLiteral('\ud800')).toBe('"\\uFFFD"');
  });
});

describe('toGoStructTag', () => {
  it('writes a raw string literal', () => {
    expect(toGoStructTag([['json', 'id,omitempty']])).toBe('`json:"id,omitempty"`');
  });

  it('writes an interpreted string literal when a value contains a backquote', () => {
    expect(toGoStructTag([['json', 'a`b']])).toBe('"json:\\"a`b\\""');
  });
});

describe('toGoComment', () => {
  it('prefixes every line and keeps blank lines as empty comments', () => {
    expect(toGoComment('first\r\n\nsecond  ')).toBe('// first\n//\n// second');
  });
});

describe('isJsonMediaType', () => {
  it('accepts JSON and structured JSON media types', () => {
    expect(isJsonMediaType('application/json; charset=utf-8')).toBe(true);
    expect(isJsonMediaType('application/problem+json')).toBe(true);
    expect(isJsonMediaType('text/plain')).toBe(false);
    expect(isJsonMediaType(undefined)).toBe(false);
  });
});
