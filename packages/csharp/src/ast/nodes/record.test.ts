import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csArgument } from './argument.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csParameter } from './parameter.ts';
import { csProperty } from './property.ts';
import { csRecord } from './record.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csRecord', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a record without members as a declaration', () => {
    builder.append(csRecord('Foo'));
    expect(builder.toString(false)).toBe('record Foo;\n');
  });

  it('should write modifiers', () => {
    builder.append(csRecord('Foo', { accessModifier: 'public', sealed: true }));
    builder.append(csRecord('Bar', { accessModifier: 'public', abstract: true, partial: true }));
    expect(builder.toString(false)).toBe('public sealed record Foo;\npublic abstract partial record Bar;\n');
  });

  it('should write a record struct', () => {
    builder.append(
      csRecord('Point', {
        accessModifier: 'public',
        kind: 'struct',
        readonly: true,
        parameters: [csParameter('X', 'int')],
      }),
    );
    expect(builder.toString(false)).toBe('public readonly record struct Point(int X);\n');
  });

  it('should write positional parameters', () => {
    builder.append(
      csRecord('Pet', {
        accessModifier: 'public',
        sealed: true,
        parameters: [csParameter('Id', 'int'), csParameter('Name', csReference('string', null, { nullable: true }))],
      }),
    );
    expect(builder.toString(false)).toBe('public sealed record Pet(int Id, string? Name);\n');
  });

  it('should write empty positional parameters', () => {
    builder.append(csRecord('Foo', { parameters: [] }));
    expect(builder.toString(false)).toBe('record Foo();\n');
  });

  it('should write positional parameters with attributes on separate lines', () => {
    builder.append(
      csRecord('Pet', {
        parameters: [
          csParameter('Id', 'int', {
            attributes: [csAttribute('JsonPropertyName', [csString('id')], { target: 'property' })],
          }),
          csParameter('Name', 'string'),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      'record Pet(\n    [property: JsonPropertyName("id")] int Id,\n    string Name\n);\n',
    );
  });

  it('should write base record with arguments and interfaces', () => {
    builder.append(
      csRecord('Dog', {
        parameters: [csParameter('Id', 'int'), csParameter('Barks', 'bool')],
        extends: csReference('Pet'),
        baseArguments: [csArgument('Id')],
        implements: [csReference('IAnimal')],
      }),
    );
    expect(builder.toString(false)).toBe('record Dog(int Id, bool Barks) : Pet(Id), IAnimal;\n');
  });

  it('should write a base record without arguments', () => {
    builder.append(csRecord('Dog', { extends: csReference('Pet') }));
    expect(builder.toString(false)).toBe('record Dog : Pet;\n');
  });

  it('should write members', () => {
    builder.append(
      csRecord('Pet', {
        accessModifier: 'public',
        members: [
          csProperty('Id', { type: 'int', accessModifier: 'public', required: true, accessors: ['get', 'init'] }),
          csProperty('Name', { type: 'string', accessModifier: 'public', accessors: ['get', 'init'] }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      'public record Pet\n{\n    public required int Id { get; init; }\n    public string Name { get; init; }\n}\n',
    );
  });

  it('should write generics and constraints', () => {
    builder.append(
      csRecord('Page', {
        generics: [csGenericParameter('T', { constraints: ['class'] })],
        parameters: [csParameter('Items', 'IReadOnlyList<T>')],
      }),
    );
    expect(builder.toString(false)).toBe('record Page<T>(IReadOnlyList<T> Items) where T : class;\n');
  });

  it('should write attributes and documentation', () => {
    builder.append(
      csRecord('Pet', {
        doc: csDoc('A pet'),
        attributes: [
          csAttribute('JsonPolymorphic', null, { properties: { TypeDiscriminatorPropertyName: csString('type') } }),
        ],
        parameters: [csParameter('Id', 'int', { description: 'The id' })],
      }),
    );
    expect(builder.toString(false)).toBe(
      [
        '/// <summary>',
        '/// A pet',
        '/// </summary>',
        '/// <param name="Id">The id</param>',
        '[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]',
        'record Pet(int Id);',
        '',
      ].join('\n'),
    );
  });

  it('should render injections', () => {
    builder.append(csRecord('Foo', { inject: { beforeName: '/*n*/' } }));
    expect(builder.toString(false)).toBe('record /*n*/Foo;\n');
  });
});
