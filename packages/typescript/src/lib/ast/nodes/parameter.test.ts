import { tsDecorator } from './decorator.ts';
import { tsParameter } from './parameter.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('single', () => {
  it('should write the name of the parameter', () => {
    builder.append(tsParameter('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write the type if it exists', () => {
    builder.append(tsParameter('x', { type: 'number' }));
    expect(builder.toString(false)).toBe('x: number');
  });

  it('should write the default if it exists', () => {
    builder.append(tsParameter('x', { default: '42' }));
    expect(builder.toString(false)).toBe('x = 42');
  });

  it('should write the optional symbol if the parameter is optional', () => {
    builder.append(tsParameter('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?');
  });

  it('should write decorators', () => {
    builder.append(tsParameter('x', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator x');
  });

  it('should write all the parts of the parameter', () => {
    builder.append(
      tsParameter('x', { decorators: [tsDecorator('decorator')], type: 'number', default: '42', optional: true }),
    );
    expect(builder.toString(false)).toBe('@decorator x?: number = 42');
  });

  it('should render injections', () => {
    builder.append(
      tsParameter('x', {
        decorators: [tsDecorator('decorator')],
        type: 'number',
        default: '42',
        optional: true,
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDecorators: '║bd║',
          afterDecorators: '║ad║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeType: '║bt║',
          afterType: '║at║',
          beforeDefault: '║bdf║',
          afterDefault: '║adf║',
        },
      }),
    );
    expect(builder.toString(false)).toBe('║b║║bd║@decorator ║ad║║bn║x║an║?: ║bt║number║at║ = ║bdf║42║adf║║a║');
  });
});

describe('multiple', () => {
  it('should write parenthesis if the node is empty', () => {
    tsParameter.write(builder, []);
    expect(builder.toString(false)).toBe('()');
  });

  it('should write a single parameter', () => {
    tsParameter.write(builder, [tsParameter('x')]);
    expect(builder.toString(false)).toBe('(x)');
  });

  it('should write all the parameters', () => {
    tsParameter.write(builder, [tsParameter('x'), tsParameter('y')]);
    expect(builder.toString(false)).toBe('(x, y)');
  });
});
