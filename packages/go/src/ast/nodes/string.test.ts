import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import { goString } from './string.ts';

function createBuilder(): GoFileBuilder {
  // A fixed newLine keeps the expectations below host-independent.
  return new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
}

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  const builder = createBuilder();
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goString', () => {
  it('writes the example of its documentation', () => {
    expect(render(goString('available'))).toBe('"available"');
  });

  it('writes an empty literal for a null or undefined value', () => {
    expect(render(goString(null))).toBe('""');
    expect(render(goString(undefined))).toBe('""');
    expect(render(goString(''))).toBe('""');
  });

  it('escapes quotes and backslashes', () => {
    expect(render(goString('say "hi" \\'))).toBe('"say \\"hi\\" \\\\"');
  });

  it('escapes line breaks and tabs', () => {
    expect(render(goString('a\nb\tc\r'))).toBe('"a\\nb\\tc\\r"');
  });

  it('escapes other control characters as hexadecimal bytes', () => {
    expect(render(goString('\u0001'))).toBe('"\\x01"');
    expect(render(goString('\u007f'))).toBe('"\\x7f"');
  });

  it('escapes C1 control characters as unicode code points', () => {
    expect(render(goString('\u0085'))).toBe('"\\u0085"');
  });

  it('keeps printable non-ASCII characters', () => {
    expect(render(goString('héllo ✓'))).toBe('"héllo ✓"');
  });

  it('replaces a lone surrogate with the replacement character', () => {
    expect(render(goString('\ud800'))).toBe('"\\uFFFD"');
  });

  it('keeps the value as an empty string when it is nullish', () => {
    expect(goString(null).value).toBe('');
    expect(goString('x').value).toBe('x');
  });

  it('writes several literals through its write helper', () => {
    const builder = createBuilder();
    goString.write(builder, [goString('a'), goString('b')], { separator: ' ' });

    expect(builder.toFragmentString()).toBe('"a" "b"');
  });
});
