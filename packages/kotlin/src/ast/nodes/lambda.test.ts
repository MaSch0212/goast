import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktLambda } from './lambda.ts';

describe('ktLambda', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('writes an empty lambda when there is no body', () => {
    builder.append(ktLambda(null, null));
    expect(builder.toString(false)).toBe('{ }');
  });

  it('writes arguments followed by an arrow', () => {
    builder.append(ktLambda(['a', 'b'], 'a + b', { singleline: true }));
    expect(builder.toString(false)).toBe('{ a, b -> a + b }');
  });

  it('puts the body on its own line unless singleline is set', () => {
    builder.append(ktLambda(['a'], 'println(a)'));
    expect(builder.toString(false)).toBe('{ a ->\n    println(a)\n}');
  });

  it('renders injections around the arguments and the body', () => {
    builder.append(
      ktLambda(['a'], 'x', {
        singleline: true,
        inject: { beforeArguments: '║ba║', afterArguments: '║aa║', beforeBody: '║bb║', afterBody: '║ab║' },
      }),
    );
    expect(builder.toString(false)).toBe('{ ║ba║a║aa║ -> ║bb║x║ab║ }');
  });
});
