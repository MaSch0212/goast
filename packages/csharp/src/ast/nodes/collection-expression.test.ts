import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { csCollectionExpression } from './collection-expression.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csString } from './string.ts';

describe('csCollectionExpression', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write an empty collection', () => {
    builder.append(csCollectionExpression());
    expect(builder.toString(false)).toBe('[]');
  });

  it('should write items', () => {
    builder.append(csCollectionExpression(['1', csString('a'), 'x']));
    expect(builder.toString(false)).toBe('[1, "a", x]');
  });

  it('should write spread elements', () => {
    builder.append(csCollectionExpression(['..other', '1']));
    expect(builder.toString(false)).toBe('[..other, 1]');
  });

  it('should write more than three items on separate lines', () => {
    builder.append(csCollectionExpression(['1', '2', '3', '4']));
    expect(builder.toString(false)).toBe('[\n    1,\n    2,\n    3,\n    4\n]');
  });

  it('should skip nullish items', () => {
    builder.append(csCollectionExpression(['1', null, undefined]));
    expect(builder.toString(false)).toBe('[1]');
  });
});
