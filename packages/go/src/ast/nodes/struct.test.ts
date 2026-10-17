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
});
