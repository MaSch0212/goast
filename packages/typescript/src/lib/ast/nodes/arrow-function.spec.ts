import { EOL } from 'os';

import { tsArrowFunction } from './arrow-function';
import { tsGenericParameter } from './generic-parameter';
import { tsParameter } from './parameter';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write empty function', () => {
  builder.append(tsArrowFunction());
  expect(builder.toString(false)).toBe('() => {}');
});

it('should write the parameters', () => {
  builder.append(tsArrowFunction({ parameters: [tsParameter('x'), tsParameter('y')] }));
  expect(builder.toString(false)).toBe('(x, y) => {}');
});

it('should write the return type', () => {
  builder.append(tsArrowFunction({ returnType: 'number' }));
  expect(builder.toString(false)).toBe('(): number => {}');
});

it('should write the body', () => {
  builder.append(tsArrowFunction({ body: 'return 42;' }));
  expect(builder.toString(false)).toBe('() => {' + EOL + '  return 42;' + EOL + '}');
});

it('should write the generics if they exist', () => {
  builder.append(tsArrowFunction({ generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('<T, U>() => {}');
});

it('should write all the parts of the arrow function', () => {
  builder.append(
    tsArrowFunction({
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      parameters: [tsParameter('x'), tsParameter('y')],
      returnType: 'number',
      body: 'return 42;',
    })
  );
  expect(builder.toString(false)).toBe('<T, U>(x, y): number => {' + EOL + '  return 42;' + EOL + '}');
});

it('should render injections', () => {
  builder.append(tsArrowFunction({ inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`before() => {}after`);
});
