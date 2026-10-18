import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goMap } from './map.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
import { goSlice } from './slice.ts';

function createBuilder(): GoFileBuilder {
  // A fixed newLine keeps the expectations below host-independent.
  return new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
}

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  const builder = createBuilder();
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goPointer', () => {
  it('writes the example of its documentation', () => {
    expect(render(goPointer(goReference('Pet')))).toBe('*Pet');
  });

  it('writes the star before a predeclared type', () => {
    expect(render(goPointer(refs.string()))).toBe('*string');
  });

  it('writes a pointer to a slice, a map or another pointer', () => {
    expect(render(goPointer(goSlice(refs.int())))).toBe('*[]int');
    expect(render(goPointer(goMap(refs.string(), refs.int())))).toBe('*map[string]int');
    expect(render(goPointer(goPointer(refs.int())))).toBe('**int');
  });

  it('exposes the type it points to', () => {
    const type = refs.int();

    expect(goPointer(type).type).toBe(type);
  });

  it('writes several pointers through its write helper', () => {
    const builder = createBuilder();
    goPointer.write(builder, [goPointer(refs.int()), goPointer(refs.bool())], { separator: ' ' });

    expect(builder.toFragmentString()).toBe('*int *bool');
  });
});
