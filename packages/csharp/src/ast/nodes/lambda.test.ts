import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csLambda } from './lambda.ts';
import { csParameter } from './parameter.ts';
import { csReference } from './reference.ts';

describe('csLambda', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an expression lambda with a single parameter', () => {
    builder.append(csLambda(['x'], 'x.Id', { singleExpression: true }));
    expect(builder.toString(false)).toBe('x => x.Id');
  });

  it('should write an expression lambda without parameters', () => {
    builder.append(csLambda([], '1', { singleExpression: true }));
    expect(builder.toString(false)).toBe('() => 1');
  });

  it('should write multiple parameters in parentheses', () => {
    builder.append(csLambda(['a', 'b'], 'a + b', { singleExpression: true }));
    expect(builder.toString(false)).toBe('(a, b) => a + b');
  });

  it('should write typed parameters in parentheses', () => {
    builder.append(csLambda([csParameter('a', csReference('int'))], 'a', { singleExpression: true }));
    expect(builder.toString(false)).toBe('(int a) => a');
  });

  it('should omit the parentheses for a single untyped parameter node', () => {
    builder.append(csLambda([csParameter('a')], 'a', { singleExpression: true }));
    expect(builder.toString(false)).toBe('a => a');
  });

  it('should write async and static', () => {
    builder.append(csLambda(['x'], 'await x', { singleExpression: true, async: true, static: true }));
    expect(builder.toString(false)).toBe('static async x => await x');
  });

  it('should write a block body', () => {
    builder.append(csLambda(['x'], 'return x;'));
    expect(builder.toString(false)).toBe('x =>\n{\n    return x;\n}');
  });

  it('should write an empty block body', () => {
    builder.append(csLambda([], null));
    expect(builder.toString(false)).toBe('() =>\n{\n}');
  });
});
