import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goMap } from './map.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
import { goSlice } from './slice.ts';
import { goStruct } from './struct.ts';

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

describe('goSlice', () => {
  it('writes the example of its documentation', () => {
    expect(render(goSlice(goReference('Pet')))).toBe('[]Pet');
  });

  it('writes the brackets before a predeclared type', () => {
    expect(render(goSlice(refs.string()))).toBe('[]string');
  });

  it('writes a slice of pointers, maps, slices and structs', () => {
    expect(render(goSlice(goPointer(goReference('Pet'))))).toBe('[]*Pet');
    expect(render(goSlice(goMap(refs.string(), refs.int())))).toBe('[]map[string]int');
    expect(render(goSlice(goSlice(refs.int())))).toBe('[][]int');
    expect(render(goSlice(goStruct()))).toBe('[]struct{}');
  });

  it('exposes the type of its elements', () => {
    const elementType = refs.int();

    expect(goSlice(elementType).elementType).toBe(elementType);
  });

  it('writes several slices through its write helper', () => {
    const builder = createBuilder();
    goSlice.write(builder, [goSlice(refs.int()), goSlice(refs.string())], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('[]int, []string');
  });
});
