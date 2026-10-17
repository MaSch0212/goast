import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csParameter } from './parameter.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csParameter', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a typed parameter', () => {
    builder.append(csParameter('id', csReference('int')));
    expect(builder.toString(false)).toBe('int id');
  });

  it('should write an untyped parameter', () => {
    builder.append(csParameter('x'));
    expect(builder.toString(false)).toBe('x');
  });

  it('should write a default value', () => {
    builder.append(csParameter('name', csReference('string', null, { nullable: true }), { default: 'null' }));
    expect(builder.toString(false)).toBe('string? name = null');
  });

  it('should write a string default value', () => {
    builder.append(csParameter('name', 'string', { default: csString('x') }));
    expect(builder.toString(false)).toBe('string name = "x"');
  });

  it('should write attributes inline', () => {
    builder.append(
      csParameter('id', 'int', {
        attributes: [csAttribute('FromRoute', null, { properties: { Name: csString('id') } }), csAttribute('Required')],
      }),
    );
    expect(builder.toString(false)).toBe('[FromRoute(Name = "id")] [Required] int id');
  });

  it('should write the this modifier of an extension method parameter', () => {
    builder.append(csParameter('value', 'string', { this: true }));
    expect(builder.toString(false)).toBe('this string value');
  });

  it('should write the params modifier', () => {
    builder.append(csParameter('values', csReference.array(csReference('int')), { params: true }));
    expect(builder.toString(false)).toBe('params int[] values');
  });

  it('should write ref, out and in modifiers', () => {
    builder.append(csParameter('value', 'int', { modifier: 'out' }));
    expect(builder.toString(false)).toBe('out int value');
  });

  it('should register the using of the type', () => {
    builder.append(csParameter('token', csReference('CancellationToken', 'System.Threading')));
    expect(builder.usings.usings).toEqual(['System.Threading']);
  });

  it('should render injections', () => {
    builder.append(csParameter('x', 'int', { inject: { beforeName: '/*a*/', afterType: '/*b*/' } }));
    expect(builder.toString(false)).toBe('int/*b*/ /*a*/x');
  });

  describe('write', () => {
    it('should write empty parentheses without parameters', () => {
      csParameter.write(builder, []);
      expect(builder.toString(false)).toBe('()');
    });

    it('should write parameters separated by commas', () => {
      csParameter.write(builder, [csParameter('a', 'int'), csParameter('b', 'string')]);
      expect(builder.toString(false)).toBe('(int a, string b)');
    });

    it('should write more than three parameters on separate lines', () => {
      csParameter.write(builder, [
        csParameter('a', 'int'),
        csParameter('b', 'int'),
        csParameter('c', 'int'),
        csParameter('d', 'int'),
      ]);
      expect(builder.toString(false)).toBe('(\n    int a,\n    int b,\n    int c,\n    int d\n)');
    });

    it('should write parameters with attributes on separate lines', () => {
      csParameter.write(builder, [
        csParameter('a', 'int', { attributes: [csAttribute('A')] }),
        csParameter('b', 'int'),
      ]);
      expect(builder.toString(false)).toBe('(\n    [A] int a,\n    int b\n)');
    });
  });
});
