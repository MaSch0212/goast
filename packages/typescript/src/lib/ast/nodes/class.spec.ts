import { EOL } from 'os';

import { tsClass } from './class';
import { tsConstructor } from './constructor';
import { tsDecorator } from './decorator';
import { tsDoc } from './doc';
import { tsGenericParameter } from './generic-parameter';
import { tsMethod } from './method';
import { tsProperty } from './property';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

it('should write the name of the class', () => {
  builder.append(tsClass('X'));
  expect(builder.toString(false)).toBe('class X {}' + EOL);
});

it('should write documenation if it exists', () => {
  builder.append(tsClass('X', { doc: tsDoc({ description: 'description' }) }));
  expect(builder.toString(false)).toBe('/**' + EOL + ' * description' + EOL + ' */' + EOL + 'class X {}' + EOL);
});

it('should write decorators if they exist', () => {
  builder.append(tsClass('X', { decorators: [tsDecorator('decorator')] }));
  expect(builder.toString(false)).toBe('@decorator' + EOL + 'class X {}' + EOL);
});

it('should write the generics if they exist', () => {
  builder.append(tsClass('X', { generics: [tsGenericParameter('T'), tsGenericParameter('U')] }));
  expect(builder.toString(false)).toBe('class X<T, U> {}' + EOL);
});

it('should write the descriptions of the generics if they exist', () => {
  builder.append(
    tsClass('X', {
      generics: [tsGenericParameter('T', { description: 'description' }), tsGenericParameter('U')],
    })
  );
  expect(builder.toString(false)).toBe(
    '/**' + EOL + ' * @template T description' + EOL + ' */' + EOL + 'class X<T, U> {}' + EOL
  );
});

it('should write the extends if it exists', () => {
  builder.append(tsClass('X', { extends: 'Y' }));
  expect(builder.toString(false)).toBe('class X extends Y {}' + EOL);
});

it('should write the implements if it exists', () => {
  builder.append(tsClass('X', { implements: ['Y', 'Z'] }));
  expect(builder.toString(false)).toBe('class X implements Y, Z {}' + EOL);
});

it('should write the properties if they exist', () => {
  builder.append(tsClass('X', { properties: [tsProperty('x'), tsProperty('y')] }));
  expect(builder.toString(false)).toBe('class X {' + EOL + '  x;' + EOL + '  y;' + EOL + '}' + EOL);
});

it('should write the methods if they exist', () => {
  builder.append(tsClass('X', { methods: [tsMethod('x'), tsMethod('y')] }));
  expect(builder.toString(false)).toBe('class X {' + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}' + EOL);
});

it('should write the constructor if it exists', () => {
  builder.append(tsClass('X', { ctor: tsConstructor() }));
  expect(builder.toString(false)).toBe('class X {' + EOL + '  constructor() {}' + EOL + '}' + EOL);
});

it('should write export keyword if configured', () => {
  builder.append(tsClass('X', { export: true }));
  expect(builder.toString(false)).toBe('export class X {}' + EOL);
});

it('should write the abstract keyword if configured', () => {
  builder.append(tsClass('X', { abstract: true }));
  expect(builder.toString(false)).toBe('abstract class X {}' + EOL);
});

it('should write all the parts of the class', () => {
  builder.append(
    tsClass('X', {
      doc: tsDoc({ description: 'description' }),
      decorators: [tsDecorator('decorator')],
      generics: [tsGenericParameter('T'), tsGenericParameter('U')],
      extends: 'Y',
      implements: ['Z'],
      properties: [tsProperty('x'), tsProperty('y')],
      methods: [tsMethod('x'), tsMethod('y')],
      ctor: tsConstructor(),
      export: true,
      abstract: true,
    })
  );
  expect(builder.toString(false)).toBe(
    '/**' +
      EOL +
      ' * description' +
      EOL +
      ' */' +
      EOL +
      '@decorator' +
      EOL +
      'export abstract class X<T, U> extends Y implements Z {' +
      EOL +
      '  x;' +
      EOL +
      '  y;' +
      EOL +
      EOL +
      '  constructor() {}' +
      EOL +
      EOL +
      '  x();' +
      EOL +
      EOL +
      '  y();' +
      EOL +
      '}' +
      EOL
  );
});

it('should render injections', () => {
  builder.append(tsClass('X', { inject: { before: ['before'], after: ['after'] } }));
  expect(builder.toString(false)).toBe(`beforeclass X {}${EOL}after`);
});
