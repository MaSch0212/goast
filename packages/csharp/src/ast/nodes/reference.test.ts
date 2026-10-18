import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csReference } from './reference.ts';

describe('csReference', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write reference', () => {
    builder.append(csReference('MyClass'));
    expect(builder.toString(false)).toBe('MyClass');
  });

  it('should write reference with generics', () => {
    builder.append(csReference('MyClass', null, { generics: [csReference('string')] }));
    expect(builder.toString(false)).toBe('MyClass<string>');
  });

  it('should write reference with multiple generics', () => {
    builder.append(csReference('Dictionary', null, { generics: [csReference('string'), csReference('int')] }));
    expect(builder.toString(false)).toBe('Dictionary<string, int>');
  });

  it('should add using to builder', () => {
    builder.append(csReference('MyClass', 'My.Namespace'));
    expect(builder.usings.usings).toEqual(['My.Namespace']);
  });

  it('should not add a using for references without a namespace', () => {
    builder.append(csReference('int'));
    expect(builder.usings.hasUsings).toBe(false);
  });

  it('should add the usings of generic arguments', () => {
    builder.append(csReference('List', 'System.Collections.Generic', { generics: [csReference('Guid', 'System')] }));
    expect(builder.usings.usings).toEqual(['System', 'System.Collections.Generic']);
  });

  it('should render nullable', () => {
    builder.append(csReference('MyClass', null, { nullable: true }));
    expect(builder.toString(false)).toBe('MyClass?');
  });

  it('should render nullable generics', () => {
    builder.append(
      csReference('List', null, { generics: [csReference('int', null, { nullable: true })], nullable: true }),
    );
    expect(builder.toString(false)).toBe('List<int?>?');
  });

  it('should render nested type names', () => {
    builder.append(csReference('Outer.Inner', 'My.Namespace'));
    expect(builder.toString(false)).toBe('Outer.Inner');
    expect(builder.usings.usings).toEqual(['My.Namespace']);
  });

  it('should render injections', () => {
    builder.append(csReference('MyClass', null, { inject: { before: 'before', after: 'after' } }));
    expect(builder.toString(false)).toBe('beforeMyClassafter');
  });

  describe('array', () => {
    it('should render an array type', () => {
      builder.append(csReference.array(csReference('string')));
      expect(builder.toString(false)).toBe('string[]');
    });

    it('should render a nullable array', () => {
      builder.append(csReference.array(csReference('string'), { nullable: true }));
      expect(builder.toString(false)).toBe('string[]?');
    });

    it('should render an array of nullable elements', () => {
      builder.append(csReference.array(csReference('string', null, { nullable: true })));
      expect(builder.toString(false)).toBe('string?[]');
    });

    it('should render nested arrays', () => {
      builder.append(csReference.array(csReference.array(csReference('int'))));
      expect(builder.toString(false)).toBe('int[][]');
    });

    it('should add the using of the element type', () => {
      builder.append(csReference.array(csReference('Guid', 'System')));
      expect(builder.usings.usings).toEqual(['System']);
    });
  });

  describe('factory', () => {
    const guid = csReference.factory('Guid', 'System');

    it('should create references', () => {
      builder.append(guid({ nullable: true }));
      expect(builder.toString(false)).toBe('Guid?');
      expect(builder.usings.usings).toEqual(['System']);
    });

    it('should expose name and namespace', () => {
      expect(guid.refName).toBe('Guid');
      expect(guid.namespace).toBe('System');
    });

    it('should match references it created', () => {
      expect(guid.matches(guid())).toBe(true);
      expect(guid.matches(csReference('Guid'))).toBe(false);
      expect(guid.matches('Guid')).toBe(false);
    });
  });

  describe('genericFactory', () => {
    const list = csReference.genericFactory<1>('List', 'System.Collections.Generic');

    it('should create references with generics', () => {
      builder.append(list([csReference('int')]));
      expect(builder.toString(false)).toBe('List<int>');
      expect(builder.usings.usings).toEqual(['System.Collections.Generic']);
    });

    it('should create references without generics using infer', () => {
      builder.append(list.infer());
      expect(builder.toString(false)).toBe('List');
    });

    it('should match references it created', () => {
      expect(list.matches(list([csReference('int')]))).toBe(true);
      expect(list.matches(csReference('List'))).toBe(false);
    });
  });

  describe('using', () => {
    it('should add the usings of the references to the builder', () => {
      csReference.using(builder, [csReference('A', 'Ns.A'), csReference('B', 'Ns.B')]);
      expect(builder.usings.usings).toEqual(['Ns.A', 'Ns.B']);
    });
  });
});
