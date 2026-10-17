import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goMethod } from './method.ts';
import { goParameter } from './parameter.ts';
import { goPointer } from './pointer.ts';
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

describe('goMethod', () => {
  it('writes the example of its documentation', () => {
    expect(
      render(
        goMethod('Get', {
          parameters: [goParameter('id', refs.string())],
          results: [goParameter(null, refs.error())],
        }),
      ),
    ).toBe('Get(id string) error');
  });

  it('writes the name and empty parentheses without parameters or results', () => {
    expect(render(goMethod('Ping'))).toBe('Ping()');
    expect(render(goMethod('Ping', { parameters: [], results: [] }))).toBe('Ping()');
  });

  it('writes the doc comment above the method', () => {
    expect(render(goMethod('Count', { doc: goDoc('Counts.') }))).toBe('// Counts.\nCount()');
  });

  it('writes a deprecated doc comment above the method', () => {
    expect(render(goMethod('Count', { doc: goDoc(null, { deprecated: true }) }))).toBe(
      '// Deprecated: This is deprecated by the API description.\nCount()',
    );
  });

  it('writes a single unnamed result without parentheses', () => {
    expect(render(goMethod('Ping', { results: [goParameter(null, refs.error())] }))).toBe('Ping() error');
  });

  it('writes a single named result in parentheses', () => {
    expect(render(goMethod('Count', { results: [goParameter('n', refs.int())] }))).toBe('Count() (n int)');
  });

  it('writes several results in parentheses, separated by commas', () => {
    expect(
      render(
        goMethod('Get', {
          parameters: [goParameter('id', refs.string())],
          results: [goParameter('pet', goPointer(goReference('Pet'))), goParameter('err', refs.error())],
        }),
      ),
    ).toBe('Get(id string) (pet *Pet, err error)');
  });

  it('skips nullish parameters and results', () => {
    expect(
      render(
        goMethod('Run', {
          parameters: [null, goParameter('a', refs.int()), undefined],
          results: [undefined, goParameter(null, refs.error()), null],
        }),
      ),
    ).toBe('Run(a int) error');
  });

  it('writes the injections around the parameters', () => {
    expect(
      render(
        goMethod('Count', {
          inject: { beforeParameters: '<bp>', afterParameters: '<ap>' },
        }),
      ),
    ).toBe('Count<bp>()<ap>');
  });

  it('writes the injections around the results', () => {
    expect(
      render(
        goMethod('Ping', {
          results: [goParameter(null, refs.error())],
          inject: { beforeResults: '<br>', afterResults: '<ar>' },
        }),
      ),
    ).toBe('Ping() <br>error<ar>');
  });

  it('does not write the result injections without results', () => {
    expect(
      render(
        goMethod('Ping', {
          inject: { beforeResults: '<br>', afterResults: '<ar>' },
        }),
      ),
    ).toBe('Ping()');
  });

  it('writes several methods through its write helper', () => {
    const builder = createBuilder();
    goMethod.write(builder, [goMethod('A'), goMethod('B')], { separator: '\n' });

    expect(builder.toFragmentString()).toBe('A()\nB()');
  });
});
