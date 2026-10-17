import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csAttribute } from './attribute.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csDoc } from './doc.ts';
import { csGenericParameter } from './generic-parameter.ts';
import { csInterface } from './interface.ts';
import { csMethod } from './method.ts';
import { csParameter } from './parameter.ts';
import { csProperty } from './property.ts';
import { csReference } from './reference.ts';

describe('csInterface', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an interface', () => {
    builder.append(csInterface('IFoo', { accessModifier: 'public' }));
    expect(builder.toString(false)).toBe('public interface IFoo\n{\n}\n');
  });

  it('should write partial', () => {
    builder.append(csInterface('IFoo', { partial: true }));
    expect(builder.toString(false)).toBe('partial interface IFoo\n{\n}\n');
  });

  it('should write generics and constraints', () => {
    builder.append(
      csInterface('IRepo', { generics: [csGenericParameter('T', { variance: 'out', constraints: ['class'] })] }),
    );
    expect(builder.toString(false)).toBe('interface IRepo<out T> where T : class\n{\n}\n');
  });

  it('should write extended interfaces', () => {
    builder.append(csInterface('IFoo', { extends: [csReference('IBar'), csReference('IDisposable', 'System')] }));
    expect(builder.toString(false)).toBe('interface IFoo : IBar, IDisposable\n{\n}\n');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should write members', () => {
    builder.append(
      csInterface('IFoo', {
        members: [
          csProperty('Name', { type: 'string', accessors: ['get'] }),
          csMethod('Run', { returnType: 'void' }),
          csMethod('Get', { returnType: 'int', parameters: [csParameter('id', 'int')] }),
        ],
      }),
    );
    expect(builder.toString(false)).toBe(
      'interface IFoo\n{\n    string Name { get; }\n\n    void Run();\n\n    int Get(int id);\n}\n',
    );
  });

  it('should write attributes and documentation', () => {
    builder.append(csInterface('IFoo', { doc: csDoc('A foo'), attributes: [csAttribute('Obsolete')] }));
    expect(builder.toString(false)).toBe(
      '/// <summary>\n/// A foo\n/// </summary>\n[Obsolete]\ninterface IFoo\n{\n}\n',
    );
  });

  it('should render injections', () => {
    builder.append(csInterface('IFoo', { inject: { beforeName: '/*n*/' } }));
    expect(builder.toString(false)).toBe('interface /*n*/IFoo\n{\n}\n');
  });
});
