import { beforeEach, describe, expect, it } from 'vitest';

import type { CSharpFileBuilder } from '../../file-builder.ts';
import { createBuilder } from './create-builder.test-utils.ts';
import { csString } from './string.ts';
import { csSwitchExpression } from './switch-expression.ts';

describe('csSwitchExpression', () => {
  let builder: CSharpFileBuilder;

  beforeEach(() => {
    builder = createBuilder();
  });

  it('should write a switch expression', () => {
    builder.append(
      csSwitchExpression('code', [
        csSwitchExpression.arm('200', csString('ok')),
        csSwitchExpression.arm('404', csString('not found')),
        csSwitchExpression.arm('_', csString('other')),
      ]),
    );
    expect(builder.toString(false)).toBe(
      'code switch\n{\n    200 => "ok",\n    404 => "not found",\n    _ => "other"\n}',
    );
  });

  it('should write when guards', () => {
    builder.append(
      csSwitchExpression('x', [
        { pattern: 'int i', when: 'i > 0', value: 'i' },
        { pattern: '_', value: '0' },
      ]),
    );
    expect(builder.toString(false)).toBe('x switch\n{\n    int i when i > 0 => i,\n    _ => 0\n}');
  });

  it('should write an empty switch expression', () => {
    builder.append(csSwitchExpression('x'));
    expect(builder.toString(false)).toBe('x switch\n{\n}');
  });

  it('should be usable as an initializer value', () => {
    builder.append('var y = ', csSwitchExpression('x', [csSwitchExpression.arm('_', '1')]), ';');
    expect(builder.toString(false)).toBe('var y = x switch\n{\n    _ => 1\n};');
  });
});
