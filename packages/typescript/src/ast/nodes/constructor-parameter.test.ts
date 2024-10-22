import { EOL } from 'node:os';

import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { tsConstructorParameter } from './constructor-parameter.ts';
import { tsDecorator } from './decorator.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsConstructorParameter', () => {
  it('should write the name of the parameter', () => {
    builder.append(tsConstructorParameter('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write decorators if they exist', () => {
    builder.append(tsConstructorParameter('x', { decorators: [tsDecorator('decorator')] }));
    expect(builder.toString(false)).toBe('@decorator x');
  });

  it('should write the type if it exists', () => {
    builder.append(tsConstructorParameter('x', { type: 'number' }));
    expect(builder.toString(false)).toBe('x: number');
  });

  it('should write the default if it exists', () => {
    builder.append(tsConstructorParameter('x', { default: '42' }));
    expect(builder.toString(false)).toBe('x = 42');
  });

  it('should write the accessibility if it exists', () => {
    builder.append(tsConstructorParameter('x', { accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public x');
  });

  it('should write the readonly keyword if the parameter is readonly', () => {
    builder.append(tsConstructorParameter('x', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly x');
  });

  it('should write the optional symbol if the parameter is optional', () => {
    builder.append(tsConstructorParameter('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?');
  });

  it('should write all the parts of the parameter', () => {
    builder.append(
      tsConstructorParameter('x', {
        decorators: [tsDecorator('decorator')],
        type: 'number',
        default: 42,
        accessModifier: 'public',
        readonly: true,
        optional: true,
      }),
    );
    expect(builder.toString(false)).toBe('@decorator public readonly x?: number = 42');
  });

  it('should render injections', () => {
    builder.append(
      tsConstructorParameter('x', {
        decorators: [tsDecorator('decorator')],
        type: 'number',
        default: 42,
        accessModifier: 'public',
        readonly: true,
        optional: true,
        inject: {
          before: '║b║',
          after: '║a║',
          beforeDecorators: '║bd║',
          afterDecorators: '║ad║',
          beforeModifiers: '║bm║',
          afterModifiers: '║am║',
          beforeName: '║bn║',
          afterName: '║an║',
          beforeType: '║bt║',
          afterType: '║at║',
          beforeDefault: '║bdf║',
          afterDefault: '║adf║',
        },
      }),
    );
    expect(builder.toString(false)).toBe(
      '║b║║bd║@decorator ║ad║║bm║public readonly ║am║║bn║x║an║?: ║bt║number║at║ = ║bdf║42║adf║║a║',
    );
  });

  describe('write', () => {
    it('should write parenthesis if the node is empty', () => {
      tsConstructorParameter.write(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write a single parameter', () => {
      tsConstructorParameter.write(builder, [tsConstructorParameter('x')]);
      expect(builder.toString(false)).toBe('(x)');
    });

    it('should write all the parameters', () => {
      tsConstructorParameter.write(builder, [tsConstructorParameter('x'), tsConstructorParameter('y')]);
      expect(builder.toString(false)).toBe('(x, y)');
    });

    it('should write multiline if more than 2 parameters', () => {
      tsConstructorParameter.write(builder, [
        tsConstructorParameter('x'),
        tsConstructorParameter('y'),
        tsConstructorParameter('z'),
      ]);
      expect(builder.toString(false)).toBe(`(${EOL}  x,${EOL}  y,${EOL}  z${EOL})`);
    });
  });
});
