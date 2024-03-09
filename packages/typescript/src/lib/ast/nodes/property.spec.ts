import { EOL } from 'os';

import { writeTsPropertyMethod, tsPropertyMethod, tsProperty } from './property';
import { TypeScriptFileBuilder } from '../../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('property-method', () => {
  describe('setter', () => {
    it('should write the name of the method', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod());
      expect(builder.toString(false)).toBe('set x(value);' + EOL);
    });

    it('should write the type if it exists', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ type: 'number' }));
      expect(builder.toString(false)).toBe('set x(value: number);' + EOL);
    });

    it('should write the body if it exists', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ body: 'this.x = value;' }));
      expect(builder.toString(false)).toBe(`set x(value) {${EOL}  this.x = value;${EOL}}${EOL}`);
    });

    it('should write the accessibility if it exists', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ accessibility: 'public' }));
      expect(builder.toString(false)).toBe('public set x(value);' + EOL);
    });

    it('should write the static keyword if the method is static', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ static: true }));
      expect(builder.toString(false)).toBe('static set x(value);' + EOL);
    });

    it('should write the abstract keyword if the method is abstract', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ abstract: true }));
      expect(builder.toString(false)).toBe('abstract set x(value);' + EOL);
    });

    it('should write the override keyword if the method is override', () => {
      writeTsPropertyMethod(builder, 'set', 'x', tsPropertyMethod({ override: true }));
      expect(builder.toString(false)).toBe('override set x(value);' + EOL);
    });

    it('should write all the parts of the method', () => {
      writeTsPropertyMethod(
        builder,
        'set',
        'x',
        tsPropertyMethod({
          type: 'number',
          body: 'this.x = value;',
          accessibility: 'public',
          static: true,
          abstract: true,
          override: true,
        })
      );
      expect(builder.toString(false)).toBe(
        `public static abstract override set x(value: number) {${EOL}  this.x = value;${EOL}}${EOL}`
      );
    });

    it('should render injections', () => {
      writeTsPropertyMethod(
        builder,
        'set',
        'x',
        tsPropertyMethod({ inject: { before: ['before'], after: ['after'] } })
      );
      expect(builder.toString(false)).toBe(`beforeset x(value);${EOL}after`);
    });
  });

  describe('getter', () => {
    it('should write the name of the method', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod());
      expect(builder.toString(false)).toBe('get x();' + EOL);
    });

    it('should write the type if it exists', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ type: 'number' }));
      expect(builder.toString(false)).toBe('get x(): number;' + EOL);
    });

    it('should write the body if it exists', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ body: 'return this.x;' }));
      expect(builder.toString(false)).toBe(`get x() {${EOL}  return this.x;${EOL}}${EOL}`);
    });

    it('should write the accessibility if it exists', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ accessibility: 'public' }));
      expect(builder.toString(false)).toBe('public get x();' + EOL);
    });

    it('should write the static keyword if the method is static', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ static: true }));
      expect(builder.toString(false)).toBe('static get x();' + EOL);
    });

    it('should write the abstract keyword if the method is abstract', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ abstract: true }));
      expect(builder.toString(false)).toBe('abstract get x();' + EOL);
    });

    it('should write the override keyword if the method is override', () => {
      writeTsPropertyMethod(builder, 'get', 'x', tsPropertyMethod({ override: true }));
      expect(builder.toString(false)).toBe('override get x();' + EOL);
    });

    it('should write all the parts of the method', () => {
      writeTsPropertyMethod(
        builder,
        'get',
        'x',
        tsPropertyMethod({
          type: 'number',
          body: 'return this.x;',
          accessibility: 'public',
          static: true,
          abstract: true,
          override: true,
        })
      );
      expect(builder.toString(false)).toBe(
        `public static abstract override get x(): number {${EOL}  return this.x;${EOL}}${EOL}`
      );
    });

    it('should render injections', () => {
      writeTsPropertyMethod(
        builder,
        'get',
        'x',
        tsPropertyMethod({ inject: { before: ['before'], after: ['after'] } })
      );
      expect(builder.toString(false)).toBe(`beforeget x();${EOL}after`);
    });
  });
});

describe('property', () => {
  it('should write the name of the property', () => {
    builder.append(tsProperty('x'));
    expect(builder.toString(false)).toBe('x;' + EOL);
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
    builder.append(tsProperty('x', { accessibility: 'public' }));
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
        accessibility: 'public',
        static: true,
        abstract: true,
        override: true,
        optional: true,
      })
    );
    expect(builder.toString(false)).toBe('public static abstract override readonly x?: number = 42;' + EOL);
  });

  it('should write getter and setter', () => {
    builder.append(tsProperty('x', { get: tsPropertyMethod(), set: tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('get x();' + EOL + 'set x(value);' + EOL);
  });

  it('should write getter only', () => {
    builder.append(tsProperty('x', { get: tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('get x();' + EOL);
  });

  it('should write setter only', () => {
    builder.append(tsProperty('x', { set: tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('set x(value);' + EOL);
  });

  it('should render injections', () => {
    builder.append(tsProperty('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforex;${EOL}after`);
  });

  it('should render injections with getter and setter', () => {
    builder.append(
      tsProperty('x', {
        get: tsPropertyMethod(),
        set: tsPropertyMethod(),
        inject: { before: ['before'], after: ['after'] },
      })
    );
    expect(builder.toString(false)).toBe(`beforeget x();${EOL}set x(value);${EOL}after`);
  });
});
