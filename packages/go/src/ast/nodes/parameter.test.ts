import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goParameter } from './parameter.ts';
import { goReference } from './reference.ts';

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

describe('goParameter', () => {
  it('writes the example of its documentation', () => {
    expect(render(goParameter('ids', refs.string(), { variadic: true }))).toBe('ids ...string');
  });

  it('writes the name before the type', () => {
    expect(render(goParameter('id', refs.string()))).toBe('id string');
  });

  it('writes an unnamed parameter as its type only', () => {
    expect(render(goParameter(null, refs.error()))).toBe('error');
    expect(render(goParameter('', refs.error()))).toBe('error');
  });

  it('writes the ellipsis before the type of a variadic parameter', () => {
    expect(render(goParameter('ids', refs.string(), { variadic: true }))).toBe('ids ...string');
    expect(render(goParameter(null, refs.string(), { variadic: true }))).toBe('...string');
  });

  it('is not variadic unless asked to be', () => {
    expect(render(goParameter('ids', refs.string(), { variadic: false }))).toBe('ids string');
    expect(render(goParameter('ids', refs.string(), { variadic: null }))).toBe('ids string');
    expect(goParameter('ids', refs.string()).variadic).toBe(false);
  });

  it('writes the type with its import', () => {
    expect(render(goParameter('ctx', goReference('Context', 'context')))).toBe('ctx context.Context');
  });

  describe('writeList', () => {
    it('writes parameters in parentheses, separated by commas', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [goParameter('a', refs.int()), goParameter(null, refs.bool())]);

      expect(builder.toFragmentString()).toBe('(a int, bool)');
    });

    it('writes a single unnamed parameter in parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [goParameter(null, refs.int())]);

      expect(builder.toFragmentString()).toBe('(int)');
    });

    it('writes empty parameters as empty parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, []);

      expect(builder.toFragmentString()).toBe('()');
    });

    it('writes a single unnamed result without parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [goParameter(null, refs.error())], { results: true });

      expect(builder.toFragmentString()).toBe('error');
    });

    it('writes a single named result in parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [goParameter('n', refs.int())], { results: true });

      expect(builder.toFragmentString()).toBe('(n int)');
    });

    it('writes several results in parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [goParameter(null, refs.int()), goParameter(null, refs.error())], {
        results: true,
      });

      expect(builder.toFragmentString()).toBe('(int, error)');
    });

    it('writes an empty result list in parentheses', () => {
      const builder = createBuilder();
      goParameter.writeList(builder, [], { results: true });

      expect(builder.toFragmentString()).toBe('()');
    });
  });

  it('writes several parameters through its write helper', () => {
    const builder = createBuilder();
    goParameter.write(builder, [goParameter('a', refs.int()), goParameter('b', refs.string())], { separator: ', ' });

    expect(builder.toFragmentString()).toBe('a int, b string');
  });
});
