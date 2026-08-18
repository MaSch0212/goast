import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsDoc } from './doc.ts';
import { tsEnumValue } from './enum-value.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('tsEnumValue', () => {
  it('should write the name of the enum value', () => {
    builder.append(tsEnumValue('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write the value if it exists', () => {
    builder.append(tsEnumValue('x', { value: '42' }));
    expect(builder.toString(false)).toBe('x = 42');
  });

  it('should write documentation if it exists', () => {
    builder.append(tsEnumValue('x', { doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nx');
  });

  it('should write all the parts of the enum value', () => {
    builder.append(tsEnumValue('x', { value: '42', doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe('/**\n * description\n */\nx = 42');
  });

  it('should write injections', () => {
    builder.append(
      tsEnumValue('x', {
        value: '42',
        doc: tsDoc({ description: 'description' }),
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDoc: '║bd║',
          afterDoc: '║ad║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeValue: '║bv║',
          afterValue: '║av║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      '║b║║bd║\n/**\n * description\n */\n║ad║║bn║x║an║ = ║bv║42║av║║a║',
    );
  });

  describe('write', () => {
    it('should write multiple enum values', () => {
      tsEnumValue.write(builder, [tsEnumValue('x', { value: '42' }), tsEnumValue('y', { value: '43' })]);
      expect(builder.toString(false)).toBe('x = 42,\ny = 43');
    });
  });
});
