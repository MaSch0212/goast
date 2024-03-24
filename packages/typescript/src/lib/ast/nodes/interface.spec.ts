import { EOL } from 'os';

import { tsGenericParameter } from './generic-parameter';
import { tsInterface } from './interface';
import { tsMethod } from './method';
import { tsProperty } from './property';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the interface', () => {
  builder.append(tsInterface('X'));
  expect(builder.toString(false)).toBe('interface X {}' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsInterface('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('interface X<T, U> {}' + EOL);
});

it('should write the extends if it exists', () => {
  builder.append(tsInterface('X', { extends: ['Y', 'Z'] }));
  expect(builder.toString(false)).toBe('interface X extends Y, Z {}' + EOL);
});

it('should write the properties if they exist', () => {
  builder.append(tsInterface('X', { properties: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('interface X {' + EOL + '  x;' + EOL + '  y;' + EOL + '}' + EOL);
});

it('should write the methods if they exist', () => {
  builder.append(tsInterface('X', { methods: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('interface X {' + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}' + EOL);
});

it('should write export keyword if configured', () => {
  builder.append(tsInterface('X', { export: true }));
  expect(builder.toString(false)).toBe('export interface X {}' + EOL);
});

it('should write all the parts of the interface', () => {
  builder.append(
    tsInterface('X', {
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      extends: ['Y', 'Z'],
      properties: [tsProperty('x'), tsProperty('y')],
      methods: [tsMethod('x'), tsMethod('y')],
      export: true,
    }),
  );
  expect(builder.toString(false)).toBe(
    'export interface X<T, U> extends Y, Z {' +
      EOL +
      '  x;' +
      EOL +
      '  y;' +
      EOL +
      EOL +
      '  x();' +
      EOL +
      EOL +
      '  y();' +
      EOL +
      '}' +
      EOL,
  );
});

it('should render injections', () => {
  builder.append(tsInterface('X', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforeinterface X {}${EOL}after`);
});
