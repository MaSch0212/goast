import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsLookupType } from './lookup-type.ts';

describe('tsLookupType', () => {
  let builder: TypeScriptFileBuilder;

  beforeEach(() => {
    // A fixed newLine keeps the expectations below host-independent.
    builder = new TypeScriptFileBuilder(
      undefined,
      { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
    );
  });

  it('parenthesizes the type and brackets the index', () => {
    builder.append(tsLookupType('Foo', "'bar'"));
    expect(builder.toString(false)).toBe("(Foo)['bar']");
  });

  it('renders injections around the type and the index', () => {
    builder.append(
      tsLookupType('Foo', "'bar'", {
        inject: { beforeType: '║bt║', afterType: '║at║', beforeIndex: '║bi║', afterIndex: '║ai║' },
      }),
    );
    expect(builder.toString(false)).toBe("(║bt║Foo║at║)[║bi║'bar'║ai║]");
  });
});
