import { EOL } from 'node:os';

import { tsProperty } from './property.ts';
import { TypeScriptFileBuilder } from '../../file-builder.ts';
import { expect } from '@std/expect/expect';
import { beforeEach, describe, it } from '@std/testing/bdd';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('tsProperty', () => {
  it('should write the name of the property', () => {
    builder.append(tsProperty('x'));
    expect(builder.toString(false)).toBe('x;' + EOL);
  });

  it('should put name in quotes if needed', () => {
    builder.append(tsProperty('x y'));
    expect(builder.toString(false)).toBe("'x y';" + EOL);
  });

  it('should write the type if it exists', () => {
    builder.append(tsProperty('x', { type: 'number' }));
    expect(builder.toString(false)).toBe('x: number;' + EOL);
  });

  it('should write the value if it exists', () => {
    builder.append(tsProperty('x', { value: '42' }));
    expect(builder.toString(false)).toBe('x = 42;' + EOL);
  });

  it('should write the readonly keyword if the property is readonly', () => {
    builder.append(tsProperty('x', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly x;' + EOL);
  });

  it('should write the accessibility if it exists', () => {
    builder.append(tsProperty('x', { accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public x;' + EOL);
  });

  it('should write the static keyword if the property is static', () => {
    builder.append(tsProperty('x', { static: true }));
    expect(builder.toString(false)).toBe('static x;' + EOL);
  });

  it('should write the abstract keyword if the property is abstract', () => {
    builder.append(tsProperty('x', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract x;' + EOL);
  });

  it('should write the override keyword if the property is override', () => {
    builder.append(tsProperty('x', { override: true }));
    expect(builder.toString(false)).toBe('override x;' + EOL);
  });

  it('should write the optional symbol if the property is optional', () => {
    builder.append(tsProperty('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?;' + EOL);
  });

  it('should write all the parts of the property', () => {
    builder.append(
      tsProperty('x', {
        type: 'number',
        value: 42,
        readonly: true,
        accessModifier: 'public',
        static: true,
        abstract: true,
        override: true,
        optional: true,
      }),
    );
    expect(builder.toString(false)).toBe('public static abstract override readonly x?: number = 42;' + EOL);
  });

  it('should write getter and setter', () => {
    builder.append(tsProperty('x', { get: tsProperty.getter(), set: tsProperty.setter() }));
    expect(builder.toString(false)).toBe('get x();' + EOL + 'set x(value);' + EOL);
  });

  it('should write getter only', () => {
    builder.append(tsProperty('x', { get: tsProperty.getter() }));
    expect(builder.toString(false)).toBe('get x();' + EOL);
  });

  it('should write setter only', () => {
    builder.append(tsProperty('x', { set: tsProperty.setter() }));
    expect(builder.toString(false)).toBe('set x(value);' + EOL);
  });

  it('should render injections', () => {
    builder.append(tsProperty('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforex;${EOL}after`);
  });

  it('should render injections with getter and setter', () => {
    builder.append(
      tsProperty('x', {
        get: tsProperty.getter(),
        set: tsProperty.setter(),
        inject: { before: ['before'], after: ['after'] },
      }),
    );
    expect(builder.toString(false)).toBe(`beforeget x();${EOL}set x(value);${EOL}after`);
  });
});
