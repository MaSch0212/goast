import { tsGenericParameter, writeTsGenericParameters } from './generic-parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('single', () => {
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
    builder.append(tsGenericParameter('T', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforeTafter');
  });
});

describe('multiple', () => {
  it('should not write anything if the node is empty', () => {
    writeTsGenericParameters(builder, []);
    expect(builder.toString(false)).toBe('');
  });

  it('should write a single parameter', () => {
    writeTsGenericParameters(builder, [tsGenericParameter('T')]);
    expect(builder.toString(false)).toBe('<T>');
  });

  it('should write all the parameters', () => {
    writeTsGenericParameters(builder, [tsGenericParameter('T'), tsGenericParameter('U')]);
    expect(builder.toString(false)).toBe('<T, U>');
  });
});
