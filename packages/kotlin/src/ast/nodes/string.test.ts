import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { KotlinFileBuilder } from './../../file-builder.ts';
import { ktString } from './string.ts';

describe('ktString', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    builder = new KotlinFileBuilder();
  });

  it('should handle null', () => {
    builder.append(ktString(null));
    expect(builder.toString(false)).toBe('null');
  });

  it('should surround string with double quotes', () => {
    builder.append(ktString('test'));
    expect(builder.toString(false)).toBe('"test"');
  });

  it('should escape certain characters', () => {
    builder.append(ktString('\r\n\t${\n"abc"\n}\u0014'));
    expect(builder.toString(false)).toBe('"\\r\\n\\t\\${\\n\\"abc\\"\\n}\\u0014"');
  });

  it('should not escape $ character in template string', () => {
    builder.append(ktString('\r\n\t${\n"abc"\n}\u0014', { template: true }));
    expect(builder.toString(false)).toBe(`"\\r\\n\\t\${${EOL}"abc"${EOL}}\\u0014"`);
  });

  it('should handle multiline strings', () => {
    builder.append(ktString('test\r\ntest', { multiline: true }));
    expect(builder.toString(false)).toBe(`"""${EOL}    |test${EOL}    |test${EOL}    """.trimMargin()`);
  });

  it('should handle multiline strings with custom margin prefix', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, marginPrefix: '!' }));
    expect(builder.toString(false)).toBe(`"""${EOL}    !test${EOL}    !test${EOL}    """.trimMargin("!")`);
  });

  it('should handle multiline strings without auto prefix', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, autoAddMarginPrefix: false }));
    expect(builder.toString(false)).toBe(`"""${EOL}    test${EOL}    test${EOL}    """.trimMargin()`);
  });

  it('should handle multiline strings without trimMargin', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, trimMargin: false }));
    expect(builder.toString(false)).toBe(`"""test${EOL}test"""`);
  });

  it('should render injections', () => {
    builder.append(ktString('test', { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe('before"test"after');
  });
});
