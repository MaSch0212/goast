import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsTypeof } from './typeof.ts';

describe('tsTypeof', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('prefixes the value with typeof', () => {
    builder.append(tsTypeof('foo'));
    expect(builder.toString(false)).toBe('typeof foo');
  });

  it('renders injections around the value', () => {
    builder.append(tsTypeof('foo', { inject: { beforeValue: '║bv║', afterValue: '║av║' } }));
    expect(builder.toString(false)).toBe('typeof ║bv║foo║av║');
  });
});
