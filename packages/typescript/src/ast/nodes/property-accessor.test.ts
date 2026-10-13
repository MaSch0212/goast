import { expect } from '@std/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

import { defaultTypeScriptGeneratorConfig, type TypeScriptGeneratorConfig } from '../../config.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { createPropertyGetter, createPropertySetter } from './property-accessor.ts';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  // A fixed newLine keeps the expectations below host-independent.
  builder = new TypeScriptFileBuilder(
    undefined,
    { ...defaultTypeScriptGeneratorConfig, newLine: '\n' } as TypeScriptGeneratorConfig,
  );
});

describe('TsPropertySetter', () => {
  it('should write the name of the method', () => {
    builder.append(createPropertySetter({ propertyName: 'x' }));
    expect(builder.toString(false)).toBe('set x(value);\n');
  });

  it('should write the type if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', type: 'number' }));
    expect(builder.toString(false)).toBe('set x(value: number);\n');
  });

  it('should write the body if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', body: 'this.x = value;' }));
    expect(builder.toString(false)).toBe('set x(value) {\n  this.x = value;\n}\n');
  });

  it('should write the accessibility if it exists', () => {
    builder.append(createPropertySetter({ propertyName: 'x', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public set x(value);\n');
  });

  it('should write the static keyword if the method is static', () => {
    builder.append(createPropertySetter({ propertyName: 'x', static: true }));
    expect(builder.toString(false)).toBe('static set x(value);\n');
  });

  it('should write the abstract keyword if the method is abstract', () => {
    builder.append(createPropertySetter({ propertyName: 'x', abstract: true }));
    expect(builder.toString(false)).toBe('abstract set x(value);\n');
  });

  it('should write the override keyword if the method is override', () => {
    builder.append(createPropertySetter({ propertyName: 'x', override: true }));
    expect(builder.toString(false)).toBe('override set x(value);\n');
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
      'public static abstract override set x(value: number) {\n  this.x = value;\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(createPropertySetter({ propertyName: 'x', inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforeset x(value);\nafter');
  });
});

describe('TsPropertyGetter', () => {
  it('should write the name of the method', () => {
    builder.append(createPropertyGetter({ propertyName: 'x' }));
    expect(builder.toString(false)).toBe('get x();\n');
  });

  it('should write the type if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', type: 'number' }));
    expect(builder.toString(false)).toBe('get x(): number;\n');
  });

  it('should write the body if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', body: 'return this.x;' }));
    expect(builder.toString(false)).toBe('get x() {\n  return this.x;\n}\n');
  });

  it('should write the accessibility if it exists', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public get x();\n');
  });

  it('should write the static keyword if the method is static', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', static: true }));
    expect(builder.toString(false)).toBe('static get x();\n');
  });

  it('should write the abstract keyword if the method is abstract', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', abstract: true }));
    expect(builder.toString(false)).toBe('abstract get x();\n');
  });

  it('should write the override keyword if the method is override', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', override: true }));
    expect(builder.toString(false)).toBe('override get x();\n');
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
      'public static abstract override get x(): number {\n  return this.x;\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(createPropertyGetter({ propertyName: 'x', inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforeget x();\nafter');
  });
});
