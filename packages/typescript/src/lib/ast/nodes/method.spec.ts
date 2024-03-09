import { EOL } from 'os';

import { tsGenericParameter } from './generic-parameter';
import { tsMethod } from './method';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the method', () => {
  builder.append(tsMethod('x'));
  expect(builder.toString(false)).toBe('x();' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsMethod('x', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('x<T, U>();' + EOL);
});

it('should write the parameters if they exist', () => {
  builder.append(tsMethod('x', { parameters: [tsParameter('y'), tsParameter('z')] }));
  expect(builder.toString(false)).toBe('x(y, z);' + EOL);
});

it('should write the return type if it exists', () => {
  builder.append(tsMethod('x', { returnType: 'number' }));
  expect(builder.toString(false)).toBe('x(): number;' + EOL);
});

it('should write the body if it exists', () => {
  builder.append(tsMethod('x', { body: 'return 42;' }));
  expect(builder.toString(false)).toBe(`x() {${EOL}  return 42;${EOL}}${EOL}`);
});

it('should write the accessibility if it exists', () => {
  builder.append(tsMethod('x', { accessibility: 'public' }));
  expect(builder.toString(false)).toBe('public x();' + EOL);
});

it('should write the static keyword if the method is static', () => {
  builder.append(tsMethod('x', { static: true }));
  expect(builder.toString(false)).toBe('static x();' + EOL);
});

it('should write the abstract keyword if the method is abstract', () => {
  builder.append(tsMethod('x', { abstract: true }));
  expect(builder.toString(false)).toBe('abstract x();' + EOL);
});

it('should write the override keyword if the method is override', () => {
  builder.append(tsMethod('x', { override: true }));
  expect(builder.toString(false)).toBe('override x();' + EOL);
});

it('should write the optional symbol if the method is optional', () => {
  builder.append(tsMethod('x', { optional: true }));
  expect(builder.toString(false)).toBe('x?();' + EOL);
});

it('should write all the parts of the method', () => {
  builder.append(
    tsMethod('x', {
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      parameters: [tsParameter('y'), tsParameter('z')],
      returnType: 'number',
      body: 'return 42;',
      accessibility: 'public',
      static: true,
      abstract: true,
      override: true,
      optional: true,
    })
  );
  expect(builder.toString(false)).toBe(
    `public static abstract override x?<T, U>(y, z): number {${EOL}  return 42;${EOL}}${EOL}`
  );
});

it('should render injections', () => {
  builder.append(tsMethod('x', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforex();${EOL}after`);
});
