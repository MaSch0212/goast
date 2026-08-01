import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from './../../file-builder.ts';
import { ktString } from './string.ts';

describe('ktString', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
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
    expect(builder.toString(false)).toBe('"\\r\\n\\t\${\n"abc"\n}\\u0014"');
  });

  it('should handle multiline strings', () => {
    builder.append(ktString('test\r\ntest', { multiline: true }));
    expect(builder.toString(false)).toBe('"""\n    |test\n    |test\n    """.trimMargin()');
  });

  it('should handle multiline strings with custom margin prefix', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, marginPrefix: '!' }));
    expect(builder.toString(false)).toBe('"""\n    !test\n    !test\n    """.trimMargin("!")');
  });

  it('should handle multiline strings without auto prefix', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, autoAddMarginPrefix: false }));
    expect(builder.toString(false)).toBe('"""\n    test\n    test\n    """.trimMargin()');
  });

  it('should handle multiline strings without trimMargin', () => {
    builder.append(ktString('test\r\ntest', { multiline: true, trimMargin: false }));
    expect(builder.toString(false)).toBe('"""test\ntest"""');
  });

  it('should render injections', () => {
    builder.append(ktString('test', { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe('before"test"after');
  });
});
