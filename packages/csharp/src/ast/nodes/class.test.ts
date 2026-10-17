import { beforeEach, describe, expect, it } from 'vitest';

import { appendValueGroup } from '@goast/core';
import { dedent } from '@goast/test-harness';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csArgument } from './argument.ts';
import { csAttribute } from './attribute.ts';
import { csClass } from './class.ts';
import { csConstructor } from './constructor.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csEnum } from './enum.ts';
import { csField } from './field.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csMethod } from './method.ts';
import { csParameter } from './parameter.ts';
import { csProperty } from './property.ts';
import { csReference } from './reference.ts';

describe('csClass', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write class', () => {
    builder.append(csClass('Foo'));
    expect(builder.toString(false)).toBe('class Foo\n{\n}\n');
  });

  it('should write modifiers', () => {
    builder.append(csClass('Foo', { accessModifier: 'public', static: true }));
    builder.append(csClass('Bar', { accessModifier: 'internal', abstract: true, partial: true }));
    builder.append(csClass('Baz', { accessModifier: 'public', sealed: true }));
    expect(builder.toString(false)).toBe(
      'public static class Foo\n{\n}\ninternal abstract partial class Bar\n{\n}\npublic sealed class Baz\n{\n}\n',
    );
  });

  it('should write generics', () => {
    builder.append(csClass('Foo', { generics: [csGenericParameter('T'), csGenericParameter('U')] }));
    expect(builder.toString(false)).toBe('class Foo<T, U>\n{\n}\n');
  });

  it('should write generic constraints', () => {
    builder.append(csClass('Foo', { generics: [csGenericParameter('T', { constraints: ['class'] })] }));
    expect(builder.toString(false)).toBe('class Foo<T> where T : class\n{\n}\n');
  });

  it('should write base class and interfaces', () => {
    builder.append(
      csClass('Foo', {
        extends: csReference('Base'),
        implements: [csReference('IFoo'), csReference('IDisposable', 'System')],
      }),
    );
    expect(builder.toString(false)).toBe('class Foo : Base, IFoo, IDisposable\n{\n}\n');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should write only interfaces', () => {
    builder.append(csClass('Foo', { implements: [csReference('IFoo')] }));
    expect(builder.toString(false)).toBe('class Foo : IFoo\n{\n}\n');
  });

  it('should write primary constructor', () => {
    builder.append(csClass('Foo', { primaryConstructor: [csParameter('x', 'int'), csParameter('y', 'string')] }));
    expect(builder.toString(false)).toBe('class Foo(int x, string y)\n{\n}\n');
  });

  it('should write base arguments of the primary constructor', () => {
    builder.append(
      csClass('Foo', {
        primaryConstructor: [csParameter('x', 'int')],
        extends: csReference('Base'),
        baseArguments: [csArgument('x')],
        implements: [csReference('IFoo')],
      }),
    );
    expect(builder.toString(false)).toBe('class Foo(int x) : Base(x), IFoo\n{\n}\n');
  });

  it('should write members', () => {
    builder.append(
      csClass('Foo', {
        accessModifier: 'public',
        members: [
          csField('_x', { type: 'int', accessModifier: 'private', readonly: true }),
          csConstructor([csParameter('x', 'int')], '_x = x;', { accessModifier: 'public' }),
          csProperty('Y', { type: 'int?', accessModifier: 'public' }),
          csProperty('Z', { type: 'string?', accessModifier: 'public' }),
          csMethod('Bar', {
            accessModifier: 'public',
            parameters: [csParameter('x', 'int')],
            body: 'Console.Write(x);',
          }),
          csClass('Nested', { accessModifier: 'public' }),
          csEnum('Kind'),
          '// Comment 1',
          appendValueGroup(['// Comment 2', '// Comment 3'], '\n'),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `public class Foo
        {
            private readonly int _x;

            public Foo(int x)
            {
                _x = x;
            }

            public int? Y { get; set; }
            public string? Z { get; set; }

            public void Bar(int x)
            {
                Console.Write(x);
            }

            public class Nested
            {
            }

            enum Kind
            {
            }

            // Comment 1
            // Comment 2
            // Comment 3
        }
        `,
      ),
    );
  });

  it('should separate properties with attributes by blank lines', () => {
    builder.append(
      csClass('Foo', {
        members: [
          csProperty('A', { type: 'int', attributes: [csAttribute('Required')] }),
          csProperty('B', { type: 'int', attributes: [csAttribute('Required')] }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      'class Foo\n{\n    [Required]\n    int A { get; set; }\n\n    [Required]\n    int B { get; set; }\n}\n',
    );
  });

  it('should write attributes', () => {
    builder.append(csClass('Foo', { attributes: [csAttribute('ApiController'), csAttribute('Route', ['"x"'])] }));
    expect(builder.toString(false)).toBe('[ApiController]\n[Route("x")]\nclass Foo\n{\n}\n');
  });

  it('should write documentation', () => {
    builder.append(csClass('Foo', { doc: csDoc('This is a class') }));
    expect(builder.toString(false)).toBe('/// <summary>\n/// This is a class\n/// </summary>\nclass Foo\n{\n}\n');
  });

  it('should write primary constructor parameter and type parameter descriptions', () => {
    builder.append(
      csClass('Foo', {
        doc: csDoc('This is a class'),
        generics: [csGenericParameter('T', { description: 'The type' })],
        primaryConstructor: [csParameter('x', 'int', { description: 'The x' })],
      }),
    );
    expect(builder.toString(false)).toBe(
      dedent(8)(
        `/// <summary>
        /// This is a class
        /// </summary>
        /// <typeparam name="T">The type</typeparam>
        /// <param name="x">The x</param>
        class Foo<T>(int x)
        {
        }
        `,
      ),
    );
  });

  it('should render injections', () => {
    builder.append(csClass('Foo', { inject: { beforeName: '/*n*/', afterBody: '/*b*/' } }));
    expect(builder.toString(false)).toBe('class /*n*/Foo\n{\n}/*b*/\n');
  });
});
