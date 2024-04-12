import { EOL } from 'os';

import { tsDoc } from './doc';
import { tsEnumValue } from './enum-value';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
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
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}x`);
  });

  it('should write all the parts of the enum value', () => {
    builder.append(tsEnumValue('x', { value: '42', doc: tsDoc({ description: 'description' }) }));
    expect(builder.toString(false)).toBe(`/**${EOL} * description${EOL} */${EOL}x = 42`);
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
      `║b║║bd║${EOL}/**${EOL} * description${EOL} */${EOL}║ad║║bn║x║an║ = ║bv║42║av║║a║`,
    );
  });

  describe('write', () => {
    it('should write multiple enum values', () => {
      tsEnumValue.write(builder, [tsEnumValue('x', { value: '42' }), tsEnumValue('y', { value: '43' })]);
      expect(builder.toString(false)).toBe(`x = 42,${EOL}y = 43`);
    });
  });
});
