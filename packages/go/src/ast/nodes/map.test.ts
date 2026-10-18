import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goMap } from './map.ts';
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

describe('goMap', () => {
  it('writes the example of its documentation', () => {
    expect(render(goMap(goReference('string'), goReference('Pet')))).toBe('map[string]Pet');
  });

  it('writes the key type in brackets, followed by the value type', () => {
    expect(render(goMap(refs.string(), refs.int()))).toBe('map[string]int');
  });

  it('writes a slice as the value type', () => {
    expect(render(goMap(refs.string(), goSlice(refs.int())))).toBe('map[string][]int');
  });

  it('writes a nested map as the value type', () => {
    expect(render(goMap(refs.string(), goMap(refs.string(), refs.int())))).toBe('map[string]map[string]int');
  });

  it('writes a struct as the value type', () => {
    expect(render(goMap(refs.int(), goStruct()))).toBe('map[int]struct{}');
  });

  it('exposes the key and the value type', () => {
    const keyType = refs.string();
    const valueType = refs.int();
    const map = goMap(keyType, valueType);

    expect(map.keyType).toBe(keyType);
    expect(map.valueType).toBe(valueType);
  });

  it('writes several maps through its write helper', () => {
    const builder = createBuilder();
    goMap.write(builder, [goMap(refs.string(), refs.int()), goMap(refs.int(), refs.string())], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('map[string]int, map[int]string');
  });
});
