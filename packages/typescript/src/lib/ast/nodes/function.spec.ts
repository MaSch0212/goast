import { EOL } from 'os';

import { tsFunction } from './function';
import { tsGenericParameter } from './generic-parameter';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the function', () => {
  builder.append(tsFunction('X'));
  expect(builder.toString(false)).toBe('function X() {}' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsFunction('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('function X<T, U>() {}' + EOL);
});

it('should write the parameters if they exist', () => {
  builder.append(tsFunction('X', { parameters: [tsParameter('y'), tsParameter('z')] }));
  expect(builder.toString(false)).toBe('function X(y, z) {}' + EOL);
});

it('should write the return type if it exists', () => {
  builder.append(tsFunction('X', { returnType: 'number' }));
  expect(builder.toString(false)).toBe('function X(): number {}' + EOL);
});

it('should write the body if it exists', () => {
  builder.append(tsFunction('X', { body: 'return 42;' }));
  expect(builder.toString(false)).toBe(`function X() {${EOL}  return 42;${EOL}}${EOL}`);
});

it('should write export keyword if configured', () => {
  builder.append(tsFunction('X', { export: true }));
  expect(builder.toString(false)).toBe('export function X() {}' + EOL);
});

it('should write all the parts of the function', () => {
  builder.append(
    tsFunction('X', {
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      parameters: [tsParameter('y'), tsParameter('z')],
      returnType: 'number',
      body: 'return 42;',
      export: true,
    }),
  );
  expect(builder.toString(false)).toBe(
    'export function X<T, U>(y, z): number {' + EOL + '  return 42;' + EOL + '}' + EOL,
  );
});

it('should render injections', () => {
  builder.append(tsFunction('X', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforefunction X() {}${EOL}after`);
});
