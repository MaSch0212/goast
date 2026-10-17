import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goFunction } from './function.ts';
import { goMap } from './map.ts';
import { goParameter } from './parameter.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';

function createBuilder(): GoFileBuilder {
  // A fixed newLine keeps the expectations below host-independent.
  return new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
    addGeneratedHeader: false,
  } as GoGeneratorConfig);
}

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  const builder = createBuilder();
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goFunction', () => {
  it('writes the example of its documentation', () => {
    expect(
      render(
        goFunction('IsValid', {
          receiver: goParameter('v', goReference('PetStatus')),
          results: [goParameter(null, goReference('bool'))],
          body: 'return v != ""',
        }),
      ),
    ).toBe('func (v PetStatus) IsValid() bool {\n\treturn v != ""\n}');
  });

  it('writes an empty body when there is none', () => {
    expect(render(goFunction('Run'))).toBe('func Run() {}');
  });

  it('writes the doc comment above the function', () => {
    expect(render(goFunction('Run', { doc: goDoc('Run runs.') }))).toBe('// Run runs.\nfunc Run() {}');
  });

  it('writes a deprecated doc comment above the function', () => {
    expect(render(goFunction('Run', { doc: goDoc(null, { deprecated: 'Use Start.' }) }))).toBe(
      '// Deprecated: Use Start.\nfunc Run() {}',
    );
  });

  it('writes parameters, separated by commas', () => {
    expect(
      render(
        goFunction('Get', {
          parameters: [goParameter('ctx', refs.context.context()), goParameter('id', refs.string())],
        }),
      ),
    ).toBe('func Get(ctx context.Context, id string) {}');
  });

  it('writes a variadic parameter with an ellipsis before its type', () => {
    expect(render(goFunction('Run', { parameters: [goParameter('ids', refs.string(), { variadic: true })] }))).toBe(
      'func Run(ids ...string) {}',
    );
  });

  it('writes a single unnamed result without parentheses', () => {
    expect(render(goFunction('Run', { results: [goParameter(null, refs.error())] }))).toBe('func Run() error {}');
  });

  it('writes several unnamed results in parentheses', () => {
    expect(
      render(goFunction('Run', { results: [goParameter(null, refs.int()), goParameter(null, refs.error())] })),
    ).toBe('func Run() (int, error) {}');
  });

  it('writes a single named result in parentheses', () => {
    expect(render(goFunction('Run', { results: [goParameter('n', refs.int())] }))).toBe('func Run() (n int) {}');
  });

  it('writes a pointer receiver with its name', () => {
    expect(
      render(
        goFunction('Reset', {
          receiver: goParameter('p', goPointer(goReference('Pet'))),
          body: 'return',
        }),
      ),
    ).toBe('func (p *Pet) Reset() {\n\treturn\n}');
  });

  it('writes an unnamed receiver as its type', () => {
    expect(render(goFunction('Run', { receiver: goParameter(null, goReference('Pet')) }))).toBe('func (Pet) Run() {}');
  });

  it('writes type parameters in square brackets after the name', () => {
    expect(
      render(
        goFunction('Keys', {
          typeParameters: [goParameter('K', refs.any()), goParameter('V', refs.any())],
          parameters: [goParameter('m', goMap(goReference('K'), goReference('V')))],
        }),
      ),
    ).toBe('func Keys[K any, V any](m map[K]V) {}');
  });

  it('writes a multi-line body with one indentation per line', () => {
    expect(
      render(
        goFunction('Run', {
          results: [goParameter(null, refs.int())],
          body: 'x := 1\nreturn x',
        }),
      ),
    ).toBe('func Run() int {\n\tx := 1\n\treturn x\n}');
  });

  it('skips nullish parameters, results and type parameters', () => {
    expect(
      render(
        goFunction('Run', {
          typeParameters: [null, goParameter('T', refs.any()), undefined],
          parameters: [null, goParameter('a', refs.int()), undefined],
          results: [undefined, goParameter(null, refs.error()), null],
        }),
      ),
    ).toBe('func Run[T any](a int) error {}');
  });

  it('writes the injections around each part of the function', () => {
    expect(
      render(
        goFunction('Run', {
          receiver: goParameter('v', goReference('T')),
          parameters: [goParameter('a', refs.int())],
          results: [goParameter(null, refs.error())],
          body: 'return nil',
          inject: {
            beforeReceiver: '<brv>',
            afterReceiver: '<arv>',
            beforeName: '<bn>',
            afterName: '<an>',
            beforeParameters: '<bp>',
            afterParameters: '<ap>',
            beforeResults: '<brs>',
            afterResults: '<ars>',
            beforeBody: '<bb>',
            afterBody: '<ab>',
          },
        }),
      ),
    ).toBe('func <brv>(v T)<arv> <bn>Run<an><bp>(a int)<ap> <brs>error<ars> <bb>{\n\treturn nil\n}<ab>');
  });

  it('writes the injections before and after the doc comment', () => {
    expect(
      render(
        goFunction('Run', {
          doc: goDoc('Run runs.'),
          inject: { beforeDoc: '/* before doc */\n', afterDoc: '/* after doc */\n' },
        }),
      ),
    ).toBe('/* before doc */\n// Run runs.\n/* after doc */\nfunc Run() {}');
  });

  it('does not write the result injections without results', () => {
    expect(
      render(
        goFunction('Run', {
          inject: { beforeResults: '<brs>', afterResults: '<ars>' },
        }),
      ),
    ).toBe('func Run() {}');
  });

  it('writes several functions through its write helper', () => {
    const builder = createBuilder();
    goFunction.write(builder, [goFunction('A'), goFunction('B')]);

    expect(builder.toFragmentString().trimEnd()).toBe('func A() {}\nfunc B() {}');
  });
});
