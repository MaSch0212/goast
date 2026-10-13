import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultKotlinGeneratorConfig, type KotlinGeneratorConfig } from '../../config.ts';
import { KotlinFileBuilder } from '../../file-builder.ts';
import { ktLambdaType } from './lambda-type.ts';

describe('ktLambdaType', () => {
  let builder: KotlinFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new KotlinFileBuilder(
      undefined,
      { ...defaultKotlinGeneratorConfig, newLine: '\n' } as KotlinGeneratorConfig,
    );
  });

  it('writes an empty parameter list as ()', () => {
    builder.append(ktLambdaType([], 'Unit'));
    expect(builder.toString(false)).toBe('() -> Unit');
  });

  it('writes parameter types', () => {
    builder.append(ktLambdaType(['Int', 'String'], 'Boolean'));
    expect(builder.toString(false)).toBe('(Int, String) -> Boolean');
  });

  it('prefixes suspend', () => {
    builder.append(ktLambdaType([], 'Unit', { suspend: true }));
    expect(builder.toString(false)).toBe('suspend () -> Unit');
  });

  it('writes an extension receiver before the parameters', () => {
    builder.append(ktLambdaType(['Int'], 'Unit', { extensionFor: 'Foo' }));
    expect(builder.toString(false)).toBe('Foo.(Int) -> Unit');
  });

  it('treats a nullish parameter list as empty', () => {
    builder.append(ktLambdaType(null, 'Unit'));
    expect(builder.toString(false)).toBe('() -> Unit');
  });

  it('renders injections around the receiver, parameters and return type', () => {
    builder.append(
      ktLambdaType(['Int'], 'Unit', {
        extensionFor: 'Foo',
        inject: {
          beforeExtensionFor: '║be║',
          afterExtensionFor: '║ae║',
          beforeParams: '║bp║',
          afterParams: '║ap║',
          beforeReturnType: '║br║',
          afterReturnType: '║ar║',
        },
      }),
    );
    expect(builder.toString(false)).toBe('║be║Foo║ae║.║bp║(Int)║ap║ -> ║br║Unit║ar║');
  });
});
