import { tsParameter, writeTsParameters } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

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

  it('should write all the parts of the parameter', () => {
    builder.append(tsParameter('x', { type: 'number', default: '42', optional: true }));
    expect(builder.toString(false)).toBe('x?: number = 42');
  });

  it('should render injections', () => {
    builder.append(tsParameter('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforexafter');
  });
});

describe('multiple', () => {
  it('should write parenthesis if the node is empty', () => {
    writeTsParameters(builder, []);
    expect(builder.toString(false)).toBe('()');
  });

  it('should write a single parameter', () => {
    writeTsParameters(builder, [tsParameter('x')]);
    expect(builder.toString(false)).toBe('(x)');
  });

  it('should write all the parameters', () => {
    writeTsParameters(builder, [tsParameter('x'), tsParameter('y')]);
    expect(builder.toString(false)).toBe('(x, y)');
  });
});
