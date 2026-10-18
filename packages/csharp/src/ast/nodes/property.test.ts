import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csProperty } from './property.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csProperty', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an auto property with get and set by default', () => {
    builder.append(csProperty('Name', { type: 'string', accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public string Name { get; set; }\n');
  });

  it('should write init accessors', () => {
    builder.append(csProperty('Name', { type: 'string', accessModifier: 'public', accessors: ['get', 'init'] }));
    expect(builder.toString(false)).toBe('public string Name { get; init; }\n');
  });

  it('should write a read-only property', () => {
    builder.append(csProperty('Name', { type: 'string', accessors: ['get'] }));
    expect(builder.toString(false)).toBe('string Name { get; }\n');
  });

  it('should write accessors with their own access modifier', () => {
    builder.append(
      csProperty('Name', {
        type: 'string',
        accessModifier: 'public',
        accessors: ['get', csProperty.accessor('set', { accessModifier: 'private' })],
      }),
    );
    expect(builder.toString(false)).toBe('public string Name { get; private set; }\n');
  });

  it('should write the required modifier', () => {
    builder.append(
      csProperty('Name', { type: 'string', accessModifier: 'public', required: true, accessors: ['get', 'init'] }),
    );
    expect(builder.toString(false)).toBe('public required string Name { get; init; }\n');
  });

  it('should write modifiers in a stable order', () => {
    builder.append(csProperty('A', { type: 'int', accessModifier: 'public', static: true }));
    builder.append(csProperty('B', { type: 'int', accessModifier: 'public', abstract: true, accessors: ['get'] }));
    builder.append(csProperty('C', { type: 'int', accessModifier: 'protected', virtual: true, accessors: ['get'] }));
    builder.append(
      csProperty('D', { type: 'int', accessModifier: 'public', sealed: true, override: true, accessors: ['get'] }),
    );
    expect(builder.toString(false)).toBe(
      'public static int A { get; set; }\npublic abstract int B { get; }\nprotected virtual int C { get; }\npublic sealed override int D { get; }\n',
    );
  });

  it('should write an initializer', () => {
    builder.append(csProperty('Name', { type: 'string', accessModifier: 'public', initializer: csString('x') }));
    expect(builder.toString(false)).toBe('public string Name { get; set; } = "x";\n');
  });

  it('should write an expression body', () => {
    builder.append(csProperty('Count', { type: 'int', accessModifier: 'public', expressionBody: 'items.Length' }));
    expect(builder.toString(false)).toBe('public int Count => items.Length;\n');
  });

  it('should write accessors with bodies on separate lines', () => {
    builder.append(
      csProperty('Value', {
        type: 'int',
        accessModifier: 'public',
        accessors: [
          csProperty.accessor('get', { body: '_value', singleExpression: true }),
          csProperty.accessor('set', { body: '_value = value;' }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      'public int Value\n{\n    get => _value;\n    set\n    {\n        _value = value;\n    }\n}\n',
    );
  });

  it('should write attributes on separate lines', () => {
    builder.append(
      csProperty('Name', {
        type: 'string',
        accessModifier: 'public',
        attributes: [csAttribute('JsonPropertyName', [csString('name')]), csAttribute('Required')],
      }),
    );
    expect(builder.toString(false)).toBe('[JsonPropertyName("name")]\n[Required]\npublic string Name { get; set; }\n');
  });

  it('should write attributes on accessors', () => {
    builder.append(
      csProperty('Name', {
        type: 'string',
        accessors: [csProperty.accessor('get', { attributes: [csAttribute('A')] }), 'set'],
      }),
    );
    expect(builder.toString(false)).toBe('string Name\n{\n    [A] get;\n    set;\n}\n');
  });

  it('should write documentation', () => {
    builder.append(csProperty('Name', { type: 'string', accessModifier: 'public', doc: csDoc('The name') }));
    expect(builder.toString(false)).toBe(
      '/// <summary>\n/// The name\n/// </summary>\npublic string Name { get; set; }\n',
    );
  });

  it('should write the type and register its using', () => {
    builder.append(
      csProperty('Id', { type: csReference('Guid', 'System', { nullable: true }), accessModifier: 'public' }),
    );
    expect(builder.toString(false)).toBe('public Guid? Id { get; set; }\n');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should render injections', () => {
    builder.append(csProperty('A', { type: 'int', inject: { beforeName: '/*n*/', afterAccessors: '/*a*/' } }));
    expect(builder.toString(false)).toBe('int /*n*/A { get; set; }/*a*/\n');
  });
});
