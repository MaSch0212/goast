import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goField } from './field.ts';
import { goPointer } from './pointer.ts';
import { goSlice } from './slice.ts';
import { goStruct } from './struct.ts';

function render(value: Parameters<GoFileBuilder['append']>[0]): string {
  // A fixed newLine keeps the expectations below host-independent.
  const builder = new GoFileBuilder('api', undefined, {
    ...defaultGoGeneratorConfig,
    newLine: '\n',
  } as GoGeneratorConfig);
  builder.append(value);
  return builder.toFragmentString();
}

describe('goStruct', () => {
  it('writes an empty struct on one line', () => {
    expect(render(goStruct())).toBe('struct{}');
  });

  it('aligns names, types and tags like gofmt', () => {
    expect(
      render(
        goStruct([
          goField('ID', refs.string(), { tag: [['json', 'id']] }),
          goField('Tags', goSlice(refs.string()), { tag: [['json', 'tags,omitempty']] }),
          goField('Owner', goPointer(refs.string()), { tag: [['json', 'owner,omitempty']] }),
        ]),
      ),
    ).toBe(
      [
        'struct {',
        '\tID    string   `json:"id"`',
        '\tTags  []string `json:"tags,omitempty"`',
        '\tOwner *string  `json:"owner,omitempty"`',
        '}',
      ].join('\n'),
    );
  });

  it('writes the doc of a field above it and restarts the alignment after it', () => {
    expect(
      render(
        goStruct([
          goField('LongName', refs.int()),
          goField('A', refs.string(), { doc: goDoc('The a.') }),
          goField('B', refs.bool()),
        ]),
      ),
    ).toBe(['struct {', '\tLongName int', '\t// The a.', '\tA string', '\tB bool', '}'].join('\n'));
  });

  it('writes an embedded field', () => {
    expect(render(goStruct([goField(null, refs.error())]))).toBe('struct {\n\terror\n}');
  });

  it('writes the example of its documentation', () => {
    expect(
      render(
        goStruct([
          goField('ID', refs.string(), { tag: [['json', 'id']] }),
          goField('Tags', goSlice(refs.string()), { tag: [['json', 'tags,omitempty']] }),
        ]),
      ),
    ).toBe(['struct {', '\tID   string   `json:"id"`', '\tTags []string `json:"tags,omitempty"`', '}'].join('\n'));
  });

  it('skips nullish fields', () => {
    expect(render(goStruct([null, goField('A', refs.int()), undefined]))).toBe('struct {\n\tA int\n}');
  });

  it('writes an empty struct on one line when only nullish fields are given', () => {
    expect(render(goStruct([null, undefined]))).toBe('struct{}');
  });

  it('writes an empty struct with an injection on several lines', () => {
    expect(render(goStruct([], { inject: { beforeFields: '/* empty */' } }))).toBe('struct {\n\t/* empty */\n}');
  });

  it('writes the injections before and after the fields', () => {
    expect(
      render(
        goStruct([goField('A', refs.int())], {
          inject: { beforeFields: '/* before */', afterFields: '/* after */' },
        }),
      ),
    ).toBe('struct {\n\t/* before */A int\n\t/* after */\n}');
  });

  it('writes the struct of a field of another struct', () => {
    expect(render(goStruct([goField('Meta', goStruct([goField('Version', refs.int())]))]))).toBe(
      'struct {\n\tMeta struct {\n\t\tVersion int\n\t}\n}',
    );
  });

  it('writes several structs through its write helper', () => {
    const builder = new GoFileBuilder('api', undefined, {
      ...defaultGoGeneratorConfig,
      newLine: '\n',
    } as GoGeneratorConfig);
    goStruct.write(builder, [goStruct(), goStruct([goField('A', refs.int())])], { separator: '\n' });

    expect(builder.toFragmentString()).toBe('struct{}\nstruct {\n\tA int\n}');
  });
});
