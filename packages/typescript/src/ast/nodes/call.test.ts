import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsCall } from './call.ts';

describe('tsCall', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('joins a path with dots', () => {
    builder.append(tsCall(['a', 'b', 'c'], []));
    expect(builder.toString(false)).toBe('a.b.c()');
  });

  it('writes no parentheses at all when arguments are omitted', () => {
    builder.append(tsCall(['a', 'b']));
    expect(builder.toString(false)).toBe('a.b');
  });

  it('writes empty parentheses for an empty argument list', () => {
    builder.append(tsCall('foo', []));
    expect(builder.toString(false)).toBe('foo()');
  });

  it('writes arguments', () => {
    builder.append(tsCall('foo', ['1', "'x'"]));
    expect(builder.toString(false)).toBe("foo(1, 'x')");
  });

  it('drops nullish path segments and nullish arguments', () => {
    builder.append(tsCall(['a', null, 'b'], ['1', null]));
    expect(builder.toString(false)).toBe('a.b(1)');
  });
});
