import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csClass } from './class.ts';
import { csConstructor } from './constructor.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csParameter } from './parameter.ts';
import { csRecord } from './record.ts';

describe('csConstructor', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write the name of the enclosing class', () => {
    builder.append(
      csClass('Foo', { members: [csConstructor([csParameter('x', 'int')], '_x = x;', { accessModifier: 'public' })] }),
    );
    expect(builder.toString(false)).toBe('class Foo\n{\n    public Foo(int x)\n    {\n        _x = x;\n    }\n}\n');
  });

  it('should write the name of the enclosing record', () => {
    builder.append(csRecord('Foo', { members: [csConstructor([], null, { accessModifier: 'private' })] }));
    expect(builder.toString(false)).toBe('record Foo\n{\n    private Foo()\n    {\n    }\n}\n');
  });

  it('should write an explicit name', () => {
    builder.append(csConstructor([], null, { name: 'Bar', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public Bar()\n{\n}\n');
  });

  it('should throw without a name outside of a type', () => {
    expect(() => builder.append(csConstructor())).toThrow(/needs a name/);
  });

  it('should write a base call', () => {
    builder.append(
      csConstructor([csParameter('x', 'int')], null, {
        name: 'Foo',
        delegateTarget: 'base',
        delegateArguments: ['x'],
      }),
    );
    expect(builder.toString(false)).toBe('Foo(int x) : base(x)\n{\n}\n');
  });

  it('should write a this call without arguments', () => {
    builder.append(csConstructor([], null, { name: 'Foo', delegateTarget: 'this', delegateArguments: [] }));
    expect(builder.toString(false)).toBe('Foo() : this()\n{\n}\n');
  });

  it('should write a static constructor', () => {
    builder.append(csConstructor([], 'Init();', { name: 'Foo', static: true }));
    expect(builder.toString(false)).toBe('static Foo()\n{\n    Init();\n}\n');
  });

  it('should write an expression body', () => {
    builder.append(csConstructor([csParameter('x', 'int')], '_x = x', { name: 'Foo', singleExpression: true }));
    expect(builder.toString(false)).toBe('Foo(int x) => _x = x;\n');
  });

  it('should write documentation including parameter descriptions', () => {
    builder.append(
      csConstructor([csParameter('x', 'int', { description: 'The x' })], null, { name: 'Foo', doc: csDoc('Creates') }),
    );
    expect(builder.toString(false)).toBe(
      '/// <summary>\n/// Creates\n/// </summary>\n/// <param name="x">The x</param>\nFoo(int x)\n{\n}\n',
    );
  });
});
