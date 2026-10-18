import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goConst, goConstSpec } from './const.ts';
import { goDoc } from './doc.ts';
import { goReference } from './reference.ts';
import { goString } from './string.ts';

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  // A fixed newLine keeps the expectations below host-independent.
  const builder = new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
  builder.append(value);
  return builder.toFragmentString().trimEnd();
}

describe('goConstSpec', () => {
  it('writes the name and the value without a type', () => {
    expect(render(goConstSpec('Answer', '42'))).toBe('Answer = 42');
  });

  it('writes the type between the name and the value', () => {
    expect(render(goConstSpec('Answer', '42', { type: refs.int() }))).toBe('Answer int = 42');
  });

  it('writes a node as the value', () => {
    expect(render(goConstSpec('Status', goString('sold')))).toBe('Status = "sold"');
  });

  it('writes the doc comment above the constant', () => {
    expect(render(goConstSpec('Answer', '42', { doc: goDoc('The answer.') }))).toBe('// The answer.\nAnswer = 42');
  });

  it('writes the example of its documentation', () => {
    expect(render(goConstSpec('Answer', '42', { type: goReference('int'), doc: goDoc('The answer.') }))).toBe(
      '// The answer.\nAnswer int = 42',
    );
  });

  it('returns the cells that gofmt aligns', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);

    expect(goConstSpec('Answer', '42', { type: refs.int() }).getCells(builder)).toEqual(['Answer', 'int', '= 42']);
    expect(goConstSpec('Answer', '42').getCells(builder)).toEqual(['Answer', '', '= 42']);
  });

  it('imports the package of its type', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
      addGeneratedHeader: false,
    } as GoGeneratorConfig);
    builder.append(goConstSpec('Mode', '1', { type: goReference('Mode', 'example.com/x/modes') }));

    expect(builder.toString()).toBe('package api\n\nimport "example.com/x/modes"\n\nMode modes.Mode = 1\n');
  });

  it('writes several specs through its write helper', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);
    goConstSpec.write(builder, [goConstSpec('A', '1'), goConstSpec('B', '2')], { separator: '\n' });

    expect(builder.toFragmentString()).toBe('A = 1\nB = 2');
  });
});

describe('goConst', () => {
  it('writes nothing without specs, even with a doc comment', () => {
    expect(render(goConst([]))).toBe('');
    expect(render(goConst([null, undefined]))).toBe('');
    expect(render(goConst([], { doc: goDoc('Nothing.') }))).toBe('');
  });

  it('writes a single spec in a block', () => {
    expect(render(goConst([goConstSpec('Answer', '42')]))).toBe('const (\n\tAnswer = 42\n)');
  });

  it('skips nullish specs', () => {
    expect(render(goConst([null, goConstSpec('A', '1'), undefined]))).toBe('const (\n\tA = 1\n)');
  });

  it('writes the doc comment above the block', () => {
    expect(render(goConst([goConstSpec('A', '1')], { doc: goDoc('Block.') }))).toBe('// Block.\nconst (\n\tA = 1\n)');
  });

  it('aligns the values when no spec has a type', () => {
    expect(render(goConst([goConstSpec('A', '1'), goConstSpec('LongName', '2')]))).toBe(
      ['const (', '\tA        = 1', '\tLongName = 2', ')'].join('\n'),
    );
  });

  it('aligns the types of specs that have one, and the values of all specs', () => {
    expect(render(goConst([goConstSpec('A', '1', { type: refs.int() }), goConstSpec('LongName', '2')]))).toBe(
      ['const (', '\tA        int = 1', '\tLongName     = 2', ')'].join('\n'),
    );
  });

  it('writes the doc comment of a spec above its line and restarts the alignment after it', () => {
    expect(
      render(
        goConst([goConstSpec('A', '1'), goConstSpec('B', '2', { doc: goDoc('The b.') }), goConstSpec('LongName', '3')]),
      ),
    ).toBe(['const (', '\tA = 1', '\t// The b.', '\tB        = 2', '\tLongName = 3', ')'].join('\n'));
  });

  it('writes the injections before and after the specs', () => {
    expect(
      render(
        goConst([goConstSpec('A', '1')], {
          inject: { beforeSpecs: '/*before*/', afterSpecs: '/*after*/' },
        }),
      ),
    ).toBe(['const (', '\t/*before*/A = 1', '\t/*after*/', ')'].join('\n'));
  });

  it('writes several declarations through its write helper', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);
    goConst.write(builder, [goConst([goConstSpec('A', '1')]), goConst([goConstSpec('B', '2')])]);

    expect(builder.toFragmentString().trimEnd()).toBe('const (\n\tA = 1\n)\nconst (\n\tB = 2\n)');
  });
});
