import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csInterface } from './interface.ts';
import { csMethod } from './method.ts';
import { csParameter } from './parameter.ts';
import { csReference } from './reference.ts';

describe('csMethod', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a void method with an empty body', () => {
    builder.append(csMethod('Run'));
    expect(builder.toString(false)).toBe('void Run()\n{\n}\n');
  });

  it('should write access modifier, return type, parameters and body', () => {
    builder.append(
      csMethod('Add', {
        accessModifier: 'public',
        returnType: 'int',
        parameters: [csParameter('a', 'int'), csParameter('b', 'int')],
        body: 'return a + b;',
      }),
    );
    expect(builder.toString(false)).toBe('public int Add(int a, int b)\n{\n    return a + b;\n}\n');
  });

  it('should write a multi-line body indented', () => {
    builder.append(csMethod('Run', { accessModifier: 'public', body: 'var x = 1;\nConsole.Write(x);' }));
    expect(builder.toString(false)).toBe('public void Run()\n{\n    var x = 1;\n    Console.Write(x);\n}\n');
  });

  it('should write an expression body', () => {
    builder.append(
      csMethod('Add', {
        accessModifier: 'public',
        returnType: 'int',
        parameters: [csParameter('a', 'int'), csParameter('b', 'int')],
        body: 'a + b',
        singleExpression: true,
      }),
    );
    expect(builder.toString(false)).toBe('public int Add(int a, int b) => a + b;\n');
  });

  it('should write an abstract method without a body', () => {
    builder.append(
      csMethod('GetAsync', {
        accessModifier: 'public',
        abstract: true,
        returnType: csReference('Task', 'System.Threading.Tasks', { generics: [csReference('Pet')] }),
        parameters: [csParameter('id', 'int')],
      }),
    );
    expect(builder.toString(false)).toBe('public abstract Task<Pet> GetAsync(int id);\n');
    expect(builder.usings.usings).toEqual(['System.Threading.Tasks']);
  });

  it('should write static, async, virtual, override and sealed', () => {
    builder.append(csMethod('A', { accessModifier: 'public', static: true, async: true, returnType: 'Task' }));
    builder.append(csMethod('B', { accessModifier: 'protected', virtual: true }));
    builder.append(csMethod('C', { accessModifier: 'public', sealed: true, override: true, returnType: 'string' }));
    expect(builder.toString(false)).toBe(
      'public static async Task A()\n{\n}\nprotected virtual void B()\n{\n}\npublic sealed override string C()\n{\n}\n',
    );
  });

  it('should write an extension method', () => {
    builder.append(
      csMethod('Shout', {
        accessModifier: 'public',
        static: true,
        returnType: 'string',
        parameters: [csParameter('value', 'string', { this: true })],
        body: 'return value.ToUpper();',
      }),
    );
    expect(builder.toString(false)).toBe(
      'public static string Shout(this string value)\n{\n    return value.ToUpper();\n}\n',
    );
  });

  it('should write generics', () => {
    builder.append(csMethod('Get', { returnType: 'T', generics: [csGenericParameter('T'), csGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('T Get<T, U>()\n{\n}\n');
  });

  it('should write a single constraint on the same line', () => {
    builder.append(
      csMethod('Get', { returnType: 'T', generics: [csGenericParameter('T', { constraints: ['class', 'new()'] })] }),
    );
    expect(builder.toString(false)).toBe('T Get<T>() where T : class, new()\n{\n}\n');
  });

  it('should write multiple constraints on separate lines', () => {
    builder.append(
      csMethod('Get', {
        generics: [
          csGenericParameter('T', { constraints: ['class'] }),
          csGenericParameter('U', { constraints: ['struct'] }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe('void Get<T, U>()\n    where T : class\n    where U : struct\n{\n}\n');
  });

  it('should write attributes on separate lines', () => {
    builder.append(csMethod('Run', { attributes: [csAttribute('HttpGet'), csAttribute('Obsolete')] }));
    expect(builder.toString(false)).toBe('[HttpGet]\n[Obsolete]\nvoid Run()\n{\n}\n');
  });

  it('should write documentation including parameter descriptions', () => {
    builder.append(
      csMethod('Run', {
        doc: csDoc('Runs it'),
        parameters: [csParameter('id', 'int', { description: 'The id' })],
        generics: [csGenericParameter('T', { description: 'The type' })],
      }),
    );
    expect(builder.toString(false)).toBe(
      [
        '/// <summary>',
        '/// Runs it',
        '/// </summary>',
        '/// <typeparam name="T">The type</typeparam>',
        '/// <param name="id">The id</param>',
        'void Run<T>(int id)',
        '{',
        '}',
        '',
      ].join('\n'),
    );
  });

  it('should write parameters with attributes on separate lines', () => {
    builder.append(
      csMethod('Get', {
        parameters: [
          csParameter('id', 'int', { attributes: [csAttribute('FromRoute')] }),
          csParameter('name', 'string'),
        ],
      }),
    );
    expect(builder.toString(false)).toBe('void Get(\n    [FromRoute] int id,\n    string name\n)\n{\n}\n');
  });

  it('should write a partial method without a body as a declaration', () => {
    builder.append(csMethod('OnCreated', { partial: true }));
    expect(builder.toString(false)).toBe('partial void OnCreated();\n');
  });

  it('should write a method without a body as a declaration in an interface', () => {
    builder.append(
      csInterface('IFoo', {
        members: [csMethod('Run', { returnType: 'int', parameters: [csParameter('x', 'int')] })],
      }),
    );
    expect(builder.toString(false)).toBe('interface IFoo\n{\n    int Run(int x);\n}\n');
  });

  it('should write a default interface method with a body', () => {
    builder.append(csInterface('IFoo', { members: [csMethod('Run', { body: 'Console.Write(1);' })] }));
    expect(builder.toString(false)).toBe(
      'interface IFoo\n{\n    void Run()\n    {\n        Console.Write(1);\n    }\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(csMethod('Run', { inject: { beforeName: '/*n*/', afterBody: '/*b*/' } }));
    expect(builder.toString(false)).toBe('void /*n*/Run()\n{\n}/*b*/\n');
  });
});
