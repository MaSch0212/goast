import { tsConstructorParameter, writeTsConstructorParameters } from './constructor-parameter';
import { tsDecorator } from './decorator';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('single', () => {
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
    builder.append(tsConstructorParameter('x', { accessibility: 'public' }));
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
        accessibility: 'public',
        readonly: true,
        optional: true,
      })
    );
    expect(builder.toString(false)).toBe('@decorator public readonly x?: number = 42');
  });

  it('should render injections', () => {
    builder.append(tsConstructorParameter('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforexafter');
  });
});

describe('multiple', () => {
  it('should write parenthesis if the node is empty', () => {
    writeTsConstructorParameters(builder, []);
    expect(builder.toString(false)).toBe('()');
  });

  it('should write a single parameter', () => {
    writeTsConstructorParameters(builder, [tsConstructorParameter('x')]);
    expect(builder.toString(false)).toBe('(x)');
  });

  it('should write all the parameters', () => {
    writeTsConstructorParameters(builder, [tsConstructorParameter('x'), tsConstructorParameter('y')]);
    expect(builder.toString(false)).toBe('(x, y)');
  });
});
