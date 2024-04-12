import { EOL } from 'os';

import { tsGenericParameter } from './generic-parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsGenericParameter', () => {
  it('should write the name of the parameter', () => {
    builder.append(tsGenericParameter('T'));
    expect(builder.toString(false)).toBe('T');
  });

  it('should write the constraint if it exists', () => {
    builder.append(tsGenericParameter('T', { constraint: 'number' }));
    expect(builder.toString(false)).toBe('T extends number');
  });

  it('should write the default if it exists', () => {
    builder.append(tsGenericParameter('T', { default: 'string' }));
    expect(builder.toString(false)).toBe('T = string');
  });

  it('should write the const keyword if the parameter is const', () => {
    builder.append(tsGenericParameter('T', { const: true }));
    expect(builder.toString(false)).toBe('const T');
  });

  it('should write all the parts of the parameter', () => {
    builder.append(tsGenericParameter('T', { constraint: 'number', default: '4711', const: true }));
    expect(builder.toString(false)).toBe('const T extends number = 4711');
  });

  it('should render injections', () => {
    builder.append(
      tsGenericParameter('T', {
        constraint: 'number',
        default: '4711',
        const: true,
        inject: {
          before: '║b║',
          after: '║a║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeConstraint: '║bc║',
          afterConstraint: '║ac║',
          beforeDefault: '║bd║',
          afterDefault: '║ad║',
        },
      }),
    );
    expect(builder.toString(false)).toBe('║b║║bm║const ║am║║bn║T║an║ extends ║bc║number║ac║ = ║bd║4711║ad║║a║');
  });

  describe('write', () => {
    it('should not write anything if the node is empty', () => {
      tsGenericParameter.write(builder, []);
      expect(builder.toString(false)).toBe('');
    });

    it('should write a single parameter', () => {
      tsGenericParameter.write(builder, [tsGenericParameter('T')]);
      expect(builder.toString(false)).toBe('<T>');
    });

    it('should write all the parameters', () => {
      tsGenericParameter.write(builder, [tsGenericParameter('T'), tsGenericParameter('U')]);
      expect(builder.toString(false)).toBe('<T, U>');
    });

    it('should write multiline if more than 2 parameters', () => {
      tsGenericParameter.write(builder, [tsGenericParameter('T'), tsGenericParameter('U'), tsGenericParameter('V')]);
      expect(builder.toString(false)).toBe(`<${EOL}  T,${EOL}  U,${EOL}  V${EOL}>`);
    });
  });
});
