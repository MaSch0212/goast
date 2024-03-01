import { EOL } from 'os';

import * as f from './factories';
import * as w from './writers';
import { TypeScriptFileBuilder } from '../file-builder';

let builder: TypeScriptFileBuilder;

beforeEach(() => {
  builder = new TypeScriptFileBuilder();
});

describe('writeTsCode', () => {
  it('should not write anything if the node is empty', () => {
    w.writeTsCode(builder, { lang: 'ts', kind: 'code', parts: [], multiline: true, inject: { before: [], after: [] } });
    expect(builder.toString(false)).toBe('');
  });

  it('should write all the parts of the node', () => {
    w.writeTsCode(builder, f.tsCode('const x = 1;', 'const y = 2;'));
    expect(builder.toString(false)).toBe(`const x = 1;${EOL}const y = 2;${EOL}`);
  });

  it('should render injections', () => {
    w.writeTsCode(builder, {
      lang: 'ts',
      kind: 'code',
      parts: ['<code>'],
      multiline: true,
      inject: { before: ['before'], after: ['after'] },
    });
    expect(builder.toString(false)).toBe(`before<code>${EOL}after`);
  });
});

describe('writeTsGenericParameter', () => {
  it('should write the name of the parameter', () => {
    w.writeTsGenericParameter(builder, f.tsGenericParameter('T'));
    expect(builder.toString(false)).toBe('T');
  });

  it('should write the constraint if it exists', () => {
    w.writeTsGenericParameter(builder, f.tsGenericParameter('T', { constraint: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('T extends number');
  });

  it('should write the default if it exists', () => {
    w.writeTsGenericParameter(builder, f.tsGenericParameter('T', { default: f.tsCode('string') }));
    expect(builder.toString(false)).toBe('T = string');
  });

  it('should write the const keyword if the parameter is const', () => {
    w.writeTsGenericParameter(builder, f.tsGenericParameter('T', { const: true }));
    expect(builder.toString(false)).toBe('const T');
  });

  it('should write all the parts of the parameter', () => {
    w.writeTsGenericParameter(
      builder,
      f.tsGenericParameter('T', { constraint: f.tsCode('number'), default: f.tsCode('4711'), const: true })
    );
    expect(builder.toString(false)).toBe('const T extends number = 4711');
  });

  it('should render injections', () => {
    w.writeTsGenericParameter(builder, f.tsGenericParameter('T', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforeTafter');
  });
});

describe('writeTsGenericParameters', () => {
  it('should not write anything if the node is empty', () => {
    w.writeTsGenericParameters(builder, []);
    expect(builder.toString(false)).toBe('');
  });

  it('should write a single parameter', () => {
    w.writeTsGenericParameters(builder, [f.tsGenericParameter('T')]);
    expect(builder.toString(false)).toBe('<T>');
  });

  it('should write all the parameters', () => {
    w.writeTsGenericParameters(builder, [f.tsGenericParameter('T'), f.tsGenericParameter('U')]);
    expect(builder.toString(false)).toBe('<T, U>');
  });
});

describe('writeTsParameter', () => {
  it('should write the name of the parameter', () => {
    w.writeTsParameter(builder, f.tsParameter('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write the type if it exists', () => {
    w.writeTsParameter(builder, f.tsParameter('x', { type: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('x: number');
  });

  it('should write the default if it exists', () => {
    w.writeTsParameter(builder, f.tsParameter('x', { default: f.tsCode('42') }));
    expect(builder.toString(false)).toBe('x = 42');
  });

  it('should write the optional symbol if the parameter is optional', () => {
    w.writeTsParameter(builder, f.tsParameter('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?');
  });

  it('should write all the parts of the parameter', () => {
    w.writeTsParameter(
      builder,
      f.tsParameter('x', { type: f.tsCode('number'), default: f.tsCode('42'), optional: true })
    );
    expect(builder.toString(false)).toBe('x?: number = 42');
  });

  it('should render injections', () => {
    w.writeTsParameter(builder, f.tsParameter('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe('beforexafter');
  });
});

describe('writeTsParameters', () => {
  it('should write parenthesis if the node is empty', () => {
    w.writeTsParameters(builder, []);
    expect(builder.toString(false)).toBe('()');
  });

  it('should write a single parameter', () => {
    w.writeTsParameters(builder, [f.tsParameter('x')]);
    expect(builder.toString(false)).toBe('(x)');
  });

  it('should write all the parameters', () => {
    w.writeTsParameters(builder, [f.tsParameter('x'), f.tsParameter('y')]);
    expect(builder.toString(false)).toBe('(x, y)');
  });
});

describe('writeTsConstructorParameter', () => {
  it('should write the name of the parameter', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write the type if it exists', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x', { type: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('x: number');
  });

  it('should write the default if it exists', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x', { default: f.tsCode('42') }));
    expect(builder.toString(false)).toBe('x = 42');
  });

  it('should write the accessibility if it exists', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x', { accessibility: 'public' }));
    expect(builder.toString(false)).toBe('public x');
  });

  it('should write the readonly keyword if the parameter is readonly', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly x');
  });

  it('should write the optional symbol if the parameter is optional', () => {
    w.writeTsConstructorParameter(builder, f.tsConstructorParameter('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?');
  });

  it('should write all the parts of the parameter', () => {
    w.writeTsConstructorParameter(
      builder,
      f.tsConstructorParameter('x', {
        type: f.tsCode('number'),
        default: f.tsCode('42'),
        accessibility: 'public',
        readonly: true,
        optional: true,
      })
    );
    expect(builder.toString(false)).toBe('public readonly x?: number = 42');
  });

  it('should render injections', () => {
    w.writeTsConstructorParameter(
      builder,
      f.tsConstructorParameter('x', { inject: { before: ['before'], after: ['after'] } })
    );
    expect(builder.toString(false)).toBe('beforexafter');
  });
});

describe('writeTsConstructorParameters', () => {
  it('should write parenthesis if the node is empty', () => {
    w.writeTsConstructorParameters(builder, []);
    expect(builder.toString(false)).toBe('()');
  });

  it('should write a single parameter', () => {
    w.writeTsConstructorParameters(builder, [f.tsConstructorParameter('x')]);
    expect(builder.toString(false)).toBe('(x)');
  });

  it('should write all the parameters', () => {
    w.writeTsConstructorParameters(builder, [f.tsConstructorParameter('x'), f.tsConstructorParameter('y')]);
    expect(builder.toString(false)).toBe('(x, y)');
  });
});

describe('writeTsConstructor', () => {
  it('should write empty constructor', () => {
    w.writeTsConstructor(builder, f.tsConstructor());
    expect(builder.toString(false)).toBe('constructor() {}' + EOL);
  });

  it('should write the parameters and the body', () => {
    w.writeTsConstructor(
      builder,
      f.tsConstructor({
        parameters: [f.tsConstructorParameter('x'), f.tsConstructorParameter('y')],
        body: f.tsCode('this.x = x;'),
      })
    );
    expect(builder.toString(false)).toBe(`constructor(x, y) {${EOL}  this.x = x;${EOL}}${EOL}`);
  });

  it('should render injections', () => {
    w.writeTsConstructor(
      builder,
      f.tsConstructor({
        inject: { before: ['before'], after: ['after'], beforeParams: ['beforeParams'], afterParams: ['afterParams'] },
        parameters: [f.tsConstructorParameter('x'), 'custom', f.tsConstructorParameter('y')],
        body: f.tsCode('this.x = x;'),
      })
    );
    expect(builder.toString(false)).toBe(
      `beforeconstructorbeforeParams(x, custom, y)afterParams {${EOL}  this.x = x;${EOL}}${EOL}after`
    );
  });
});

describe('writeTsMethod', () => {
  it('should write the name of the method', () => {
    w.writeTsMethod(builder, f.tsMethod('x'));
    expect(builder.toString(false)).toBe('x();' + EOL);
  });

  it('should write the generics if they exist', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('x<T, U>();' + EOL);
  });

  it('should write the parameters if they exist', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { parameters: [f.tsParameter('y'), f.tsParameter('z')] }));
    expect(builder.toString(false)).toBe('x(y, z);' + EOL);
  });

  it('should write the return type if it exists', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { returnType: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('x(): number;' + EOL);
  });

  it('should write the body if it exists', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { body: f.tsCode('return 42;') }));
    expect(builder.toString(false)).toBe(`x() {${EOL}  return 42;${EOL}}${EOL}`);
  });

  it('should write the accessibility if it exists', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { accessibility: 'public' }));
    expect(builder.toString(false)).toBe('public x();' + EOL);
  });

  it('should write the static keyword if the method is static', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { static: true }));
    expect(builder.toString(false)).toBe('static x();' + EOL);
  });

  it('should write the abstract keyword if the method is abstract', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract x();' + EOL);
  });

  it('should write the override keyword if the method is override', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { override: true }));
    expect(builder.toString(false)).toBe('override x();' + EOL);
  });

  it('should write the optional symbol if the method is optional', () => {
    w.writeTsMethod(builder, f.tsMethod('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?();' + EOL);
  });

  it('should write all the parts of the method', () => {
    w.writeTsMethod(
      builder,
      f.tsMethod('x', {
        generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')],
        parameters: [f.tsParameter('y'), f.tsParameter('z')],
        returnType: f.tsCode('number'),
        body: f.tsCode('return 42;'),
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
    w.writeTsMethod(builder, f.tsMethod('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforex();${EOL}after`);
  });
});

describe('writeTsPropertyMethod', () => {
  describe('setter', () => {
    it('should write the name of the method', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod());
      expect(builder.toString(false)).toBe('set x(value);' + EOL);
    });

    it('should write the type if it exists', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ type: f.tsCode('number') }));
      expect(builder.toString(false)).toBe('set x(value: number);' + EOL);
    });

    it('should write the body if it exists', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ body: f.tsCode('this.x = value;') }));
      expect(builder.toString(false)).toBe(`set x(value) {${EOL}  this.x = value;${EOL}}${EOL}`);
    });

    it('should write the accessibility if it exists', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ accessibility: 'public' }));
      expect(builder.toString(false)).toBe('public set x(value);' + EOL);
    });

    it('should write the static keyword if the method is static', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ static: true }));
      expect(builder.toString(false)).toBe('static set x(value);' + EOL);
    });

    it('should write the abstract keyword if the method is abstract', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ abstract: true }));
      expect(builder.toString(false)).toBe('abstract set x(value);' + EOL);
    });

    it('should write the override keyword if the method is override', () => {
      w.writeTsPropertyMethod(builder, 'set', 'x', f.tsPropertyMethod({ override: true }));
      expect(builder.toString(false)).toBe('override set x(value);' + EOL);
    });

    it('should write all the parts of the method', () => {
      w.writeTsPropertyMethod(
        builder,
        'set',
        'x',
        f.tsPropertyMethod({
          type: f.tsCode('number'),
          body: f.tsCode('this.x = value;'),
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
      w.writeTsPropertyMethod(
        builder,
        'set',
        'x',
        f.tsPropertyMethod({ inject: { before: ['before'], after: ['after'] } })
      );
      expect(builder.toString(false)).toBe(`beforeset x(value);${EOL}after`);
    });
  });

  describe('getter', () => {
    it('should write the name of the method', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod());
      expect(builder.toString(false)).toBe('get x();' + EOL);
    });

    it('should write the type if it exists', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ type: f.tsCode('number') }));
      expect(builder.toString(false)).toBe('get x(): number;' + EOL);
    });

    it('should write the body if it exists', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ body: f.tsCode('return this.x;') }));
      expect(builder.toString(false)).toBe(`get x() {${EOL}  return this.x;${EOL}}${EOL}`);
    });

    it('should write the accessibility if it exists', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ accessibility: 'public' }));
      expect(builder.toString(false)).toBe('public get x();' + EOL);
    });

    it('should write the static keyword if the method is static', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ static: true }));
      expect(builder.toString(false)).toBe('static get x();' + EOL);
    });

    it('should write the abstract keyword if the method is abstract', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ abstract: true }));
      expect(builder.toString(false)).toBe('abstract get x();' + EOL);
    });

    it('should write the override keyword if the method is override', () => {
      w.writeTsPropertyMethod(builder, 'get', 'x', f.tsPropertyMethod({ override: true }));
      expect(builder.toString(false)).toBe('override get x();' + EOL);
    });

    it('should write all the parts of the method', () => {
      w.writeTsPropertyMethod(
        builder,
        'get',
        'x',
        f.tsPropertyMethod({
          type: f.tsCode('number'),
          body: f.tsCode('return this.x;'),
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
      w.writeTsPropertyMethod(
        builder,
        'get',
        'x',
        f.tsPropertyMethod({ inject: { before: ['before'], after: ['after'] } })
      );
      expect(builder.toString(false)).toBe(`beforeget x();${EOL}after`);
    });
  });
});

describe('writeTsProperty', () => {
  it('should write the name of the property', () => {
    w.writeTsProperty(builder, f.tsProperty('x'));
    expect(builder.toString(false)).toBe('x;' + EOL);
  });

  it('should write the type if it exists', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { type: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('x: number;' + EOL);
  });

  it('should write the value if it exists', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { value: f.tsCode('42') }));
    expect(builder.toString(false)).toBe('x = 42;' + EOL);
  });

  it('should write the readonly keyword if the property is readonly', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { readonly: true }));
    expect(builder.toString(false)).toBe('readonly x;' + EOL);
  });

  it('should write the accessibility if it exists', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { accessibility: 'public' }));
    expect(builder.toString(false)).toBe('public x;' + EOL);
  });

  it('should write the static keyword if the property is static', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { static: true }));
    expect(builder.toString(false)).toBe('static x;' + EOL);
  });

  it('should write the abstract keyword if the property is abstract', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract x;' + EOL);
  });

  it('should write the override keyword if the property is override', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { override: true }));
    expect(builder.toString(false)).toBe('override x;' + EOL);
  });

  it('should write the optional symbol if the property is optional', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { optional: true }));
    expect(builder.toString(false)).toBe('x?;' + EOL);
  });

  it('should write all the parts of the property', () => {
    w.writeTsProperty(
      builder,
      f.tsProperty('x', {
        type: f.tsCode('number'),
        value: f.tsCode('42'),
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
    w.writeTsProperty(builder, f.tsProperty('x', { get: f.tsPropertyMethod(), set: f.tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('get x();' + EOL + 'set x(value);' + EOL);
  });

  it('should write getter only', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { get: f.tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('get x();' + EOL);
  });

  it('should write setter only', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { set: f.tsPropertyMethod() }));
    expect(builder.toString(false)).toBe('set x(value);' + EOL);
  });

  it('should render injections', () => {
    w.writeTsProperty(builder, f.tsProperty('x', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforex;${EOL}after`);
  });

  it('should render injections with getter and setter', () => {
    w.writeTsProperty(
      builder,
      f.tsProperty('x', {
        get: f.tsPropertyMethod(),
        set: f.tsPropertyMethod(),
        inject: { before: ['before'], after: ['after'] },
      })
    );
    expect(builder.toString(false)).toBe(`beforeget x();${EOL}set x(value);${EOL}after`);
  });
});

describe('writeTsClass', () => {
  it('should write the name of the class', () => {
    w.writeTsClass(builder, f.tsClass('X'));
    expect(builder.toString(false)).toBe('class X {}' + EOL);
  });

  it('should write the generics if they exist', () => {
    w.writeTsClass(builder, f.tsClass('X', { generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('class X<T, U> {}' + EOL);
  });

  it('should write the extends if it exists', () => {
    w.writeTsClass(builder, f.tsClass('X', { extends: f.tsCode('Y') }));
    expect(builder.toString(false)).toBe('class X extends Y {}' + EOL);
  });

  it('should write the implements if it exists', () => {
    w.writeTsClass(builder, f.tsClass('X', { implements: [f.tsCode('Y'), f.tsCode('Z')] }));
    expect(builder.toString(false)).toBe('class X implements Y, Z {}' + EOL);
  });

  it('should write the properties if they exist', () => {
    w.writeTsClass(builder, f.tsClass('X', { properties: [f.tsProperty('x'), f.tsProperty('y')] }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  x;' + EOL + '  y;' + EOL + '}' + EOL);
  });

  it('should write the methods if they exist', () => {
    w.writeTsClass(builder, f.tsClass('X', { methods: [f.tsMethod('x'), f.tsMethod('y')] }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}' + EOL);
  });

  it('should write the constructor if it exists', () => {
    w.writeTsClass(builder, f.tsClass('X', { ctor: f.tsConstructor() }));
    expect(builder.toString(false)).toBe('class X {' + EOL + '  constructor() {}' + EOL + '}' + EOL);
  });

  it('should write export keyword if configured', () => {
    w.writeTsClass(builder, f.tsClass('X', { export: true }));
    expect(builder.toString(false)).toBe('export class X {}' + EOL);
  });

  it('should write the abstract keyword if configured', () => {
    w.writeTsClass(builder, f.tsClass('X', { abstract: true }));
    expect(builder.toString(false)).toBe('abstract class X {}' + EOL);
  });

  it('should write all the parts of the class', () => {
    w.writeTsClass(
      builder,
      f.tsClass('X', {
        generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')],
        extends: f.tsCode('Y'),
        implements: [f.tsCode('Z')],
        properties: [f.tsProperty('x'), f.tsProperty('y')],
        methods: [f.tsMethod('x'), f.tsMethod('y')],
        ctor: f.tsConstructor(),
        export: true,
        abstract: true,
      })
    );
    expect(builder.toString(false)).toBe(
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
    w.writeTsClass(builder, f.tsClass('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeclass X {}${EOL}after`);
  });
});

describe('writeTsInterface', () => {
  it('should write the name of the interface', () => {
    w.writeTsInterface(builder, f.tsInterface('X'));
    expect(builder.toString(false)).toBe('interface X {}' + EOL);
  });

  it('should write the generics if they exist', () => {
    w.writeTsInterface(
      builder,
      f.tsInterface('X', { generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')] })
    );
    expect(builder.toString(false)).toBe('interface X<T, U> {}' + EOL);
  });

  it('should write the extends if it exists', () => {
    w.writeTsInterface(builder, f.tsInterface('X', { extends: [f.tsCode('Y'), f.tsCode('Z')] }));
    expect(builder.toString(false)).toBe('interface X extends Y, Z {}' + EOL);
  });

  it('should write the properties if they exist', () => {
    w.writeTsInterface(builder, f.tsInterface('X', { properties: [f.tsProperty('x'), f.tsProperty('y')] }));
    expect(builder.toString(false)).toBe('interface X {' + EOL + '  x;' + EOL + '  y;' + EOL + '}' + EOL);
  });

  it('should write the methods if they exist', () => {
    w.writeTsInterface(builder, f.tsInterface('X', { methods: [f.tsMethod('x'), f.tsMethod('y')] }));
    expect(builder.toString(false)).toBe('interface X {' + EOL + '  x();' + EOL + EOL + '  y();' + EOL + '}' + EOL);
  });

  it('should write export keyword if configured', () => {
    w.writeTsInterface(builder, f.tsInterface('X', { export: true }));
    expect(builder.toString(false)).toBe('export interface X {}' + EOL);
  });

  it('should write all the parts of the interface', () => {
    w.writeTsInterface(
      builder,
      f.tsInterface('X', {
        generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')],
        extends: [f.tsCode('Y'), f.tsCode('Z')],
        properties: [f.tsProperty('x'), f.tsProperty('y')],
        methods: [f.tsMethod('x'), f.tsMethod('y')],
        export: true,
      })
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
        EOL
    );
  });

  it('should render injections', () => {
    w.writeTsInterface(builder, f.tsInterface('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeinterface X {}${EOL}after`);
  });
});

describe('writeTypeAlias', () => {
  it('should write the name of the type alias', () => {
    w.writeTsTypeAlias(builder, f.tsTypeAlias('X', { type: f.tsCode('number') }));
    expect(builder.toString(false)).toBe('type X = number;' + EOL);
  });

  it('should write the generics if they exist', () => {
    w.writeTsTypeAlias(
      builder,
      f.tsTypeAlias('X', { type: f.tsCode('number'), generics: [f.tsGenericParameter('T'), f.tsGenericParameter('U')] })
    );
    expect(builder.toString(false)).toBe('type X<T, U> = number;' + EOL);
  });

  it('should write export keyword if configured', () => {
    w.writeTsTypeAlias(builder, f.tsTypeAlias('X', { type: f.tsCode('number'), export: true }));
    expect(builder.toString(false)).toBe('export type X = number;' + EOL);
  });

  it('should render injections', () => {
    w.writeTsTypeAlias(
      builder,
      f.tsTypeAlias('X', { type: f.tsCode('number'), inject: { before: ['before'], after: ['after'] } })
    );
    expect(builder.toString(false)).toBe(`beforetype X = number;${EOL}after`);
  });
});

describe('writeTsEnumMember', () => {
  it('should write the name of the member', () => {
    w.writeTsEnumMember(builder, f.tsEnumMember('X'));
    expect(builder.toString(false)).toBe('X');
  });

  it('should write the value if it exists', () => {
    w.writeTsEnumMember(builder, f.tsEnumMember('X', { value: f.tsCode('42') }));
    expect(builder.toString(false)).toBe('X = 42');
  });

  it('should render injections', () => {
    w.writeTsEnumMember(builder, f.tsEnumMember('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeXafter`);
  });
});

describe('writeTsEnum', () => {
  it('should write the name of the enum', () => {
    w.writeTsEnum(builder, f.tsEnum('X'));
    expect(builder.toString(false)).toBe('enum X {}' + EOL);
  });

  it('should write the members if they exist', () => {
    w.writeTsEnum(builder, f.tsEnum('X', { members: [f.tsEnumMember('A'), f.tsEnumMember('B')] }));
    expect(builder.toString(false)).toBe('enum X {' + EOL + '  A,' + EOL + '  B' + EOL + '}' + EOL);
  });

  it('should write export keyword if configured', () => {
    w.writeTsEnum(builder, f.tsEnum('X', { export: true }));
    expect(builder.toString(false)).toBe('export enum X {}' + EOL);
  });

  it('should write const keyword if configured', () => {
    w.writeTsEnum(builder, f.tsEnum('X', { const: true }));
    expect(builder.toString(false)).toBe('const enum X {}' + EOL);
  });

  it('should write all the parts of the enum', () => {
    w.writeTsEnum(
      builder,
      f.tsEnum('X', { members: [f.tsEnumMember('A'), f.tsEnumMember('B')], export: true, const: true })
    );
    expect(builder.toString(false)).toBe('export const enum X {' + EOL + '  A,' + EOL + '  B' + EOL + '}' + EOL);
  });

  it('should render injections', () => {
    w.writeTsEnum(builder, f.tsEnum('X', { inject: { before: ['before'], after: ['after'] } }));
    expect(builder.toString(false)).toBe(`beforeenum X {}${EOL}after`);
  });
});
