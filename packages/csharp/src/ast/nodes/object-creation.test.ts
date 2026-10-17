import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csObjectCreation } from './object-creation.ts';
import { csReference } from './reference.ts';
import { csString } from './string.ts';

describe('csObjectCreation', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a creation without arguments', () => {
    builder.append(csObjectCreation('Foo'));
    expect(builder.toString(false)).toBe('new Foo()');
  });

  it('should write a creation with arguments and register the using of the type', () => {
    builder.append(csObjectCreation(csReference('Uri', 'System'), [csString('http://x'), '1']));
    expect(builder.toString(false)).toBe('new Uri("http://x", 1)');
    expect(builder.usings.usings).toEqual(['System']);
  });

  it('should write a target-typed creation', () => {
    builder.append(csObjectCreation(null, ['1']));
    expect(builder.toString(false)).toBe('new(1)');
  });

  it('should write an empty target-typed creation', () => {
    builder.append(csObjectCreation());
    expect(builder.toString(false)).toBe('new()');
  });

  it('should write an object initializer without parentheses', () => {
    builder.append(csObjectCreation('Foo', null, { properties: { A: '1', B: csString('b') } }));
    expect(builder.toString(false)).toBe('new Foo { A = 1, B = "b" }');
  });

  it('should write an object initializer after arguments', () => {
    builder.append(csObjectCreation('Foo', ['x'], { properties: { A: '1' } }));
    expect(builder.toString(false)).toBe('new Foo(x) { A = 1 }');
  });

  it('should write a target-typed object initializer', () => {
    builder.append(csObjectCreation(null, null, { properties: { A: '1' } }));
    expect(builder.toString(false)).toBe('new() { A = 1 }');
  });

  it('should skip nullish initializer values', () => {
    builder.append(csObjectCreation('Foo', null, { properties: { A: '1', B: null, C: undefined } }));
    expect(builder.toString(false)).toBe('new Foo { A = 1 }');
  });

  it('should write many initializer properties on separate lines', () => {
    builder.append(csObjectCreation('Foo', null, { properties: { A: '1', B: '2', C: '3' } }));
    expect(builder.toString(false)).toBe('new Foo\n{\n    A = 1,\n    B = 2,\n    C = 3\n}');
  });

  it('should write a collection initializer', () => {
    builder.append(csObjectCreation('List<int>', null, { items: ['1', '2'] }));
    expect(builder.toString(false)).toBe('new List<int> { 1, 2 }');
  });
});
