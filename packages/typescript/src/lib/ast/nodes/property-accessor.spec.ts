import { EOL } from 'os';

import { createPropertyGetter, createPropertySetter } from './property-accessor';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('TsPropertySetter', () => {
  it('should write the name of the method', () => {
    builder.append(createPropertySetter({ propertyName: 'x' }));
    expect(builder.toString(false)).toBe('set x(value);' + EOL);
  });

  it('should write the type if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', type: 'number' }));
    expect(builder.toString(false)).toBe('set x(value: number);' + EOL);
  });

  it('should write the body if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', body: 'this.x = value;' }));
    expect(builder.toString(false)).toBe(`set x(value) {${EOL}  this.x = value;${EOL}}${EOL}`);
  });

  it('should write the accessibility if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public set x(value);' + EOL);
  });

  it('should write the static keyword if the method is static', () => {
    builder.append(createPropertySetter({ propertyName: 'x', static: true }));
    expect(builder.toString(false)).toBe('static set x(value);' + EOL);
  });

  it('should write the abstract keyword if the method is abstract', () => {
    builder.append(createPropertySetter({ propertyName: 'x', abstract: true }));
    expect(builder.toString(false)).toBe('abstract set x(value);' + EOL);
  });

  it('should write the override keyword if the method is override', () => {
    builder.append(createPropertySetter({ propertyName: 'x', override: true }));
    expect(builder.toString(false)).toBe('override set x(value);' + EOL);
  });

  it('should write all the parts of the method', () => {
    builder.append(
      createPropertySetter({
        propertyName: 'x',
        type: 'number',
        body: 'this.x = value;',
        accessModifier: 'public',
        static: true,
        abstract: true,
        override: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      `public static abstract override set x(value: number) {${EOL}  this.x = value;${EOL}}${EOL}`,
    );
  });

  it('should render injections', () => {
    builder.append(createPropertySetter({ propertyName: 'x', inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeset x(value);${EOL}after`);
  });
});

describe('TsPropertyGetter', () => {
  it('should write the name of the method', () => {
    builder.append(createPropertyGetter({ propertyName: 'x' }));
    expect(builder.toString(false)).toBe('get x();' + EOL);
  });

  it('should write the type if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', type: 'number' }));
    expect(builder.toString(false)).toBe('get x(): number;' + EOL);
  });

  it('should write the body if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', body: 'return this.x;' }));
    expect(builder.toString(false)).toBe(`get x() {${EOL}  return this.x;${EOL}}${EOL}`);
  });

  it('should write the accessibility if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public get x();' + EOL);
  });

  it('should write the static keyword if the method is static', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', static: true }));
    expect(builder.toString(false)).toBe('static get x();' + EOL);
  });

  it('should write the abstract keyword if the method is abstract', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', abstract: true }));
    expect(builder.toString(false)).toBe('abstract get x();' + EOL);
  });

  it('should write the override keyword if the method is override', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', override: true }));
    expect(builder.toString(false)).toBe('override get x();' + EOL);
  });

  it('should write all the parts of the method', () => {
    builder.append(
      createPropertyGetter({
        propertyName: 'x',
        type: 'number',
        body: 'return this.x;',
        accessModifier: 'public',
        static: true,
        abstract: true,
        override: true,
      }),
    );
    expect(builder.toString(false)).toBe(
      `public static abstract override get x(): number {${EOL}  return this.x;${EOL}}${EOL}`,
    );
  });

  it('should render injections', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeget x();${EOL}after`);
  });
});
