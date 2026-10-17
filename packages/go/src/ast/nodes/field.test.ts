import { describe, expect, it } from 'vitest';

import { defaultGoGeneratorConfig, type GoGeneratorConfig } from '../../config.ts';
import { GoFileBuilder } from '../../file-builder.ts';
import * as refs from '../references/index.ts';
import { goDoc } from './doc.ts';
import { goField } from './field.ts';
import { goMap } from './map.ts';
import { goPointer } from './pointer.ts';
import { goReference } from './reference.ts';
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

describe('goField', () => {
  it('writes the example of its documentation', () => {
    expect(render(goField('ID', goReference('string'), { tag: [['json', 'id']] }))).toBe('ID string `json:"id"`');
  });

  it('writes the name and the type', () => {
    expect(render(goField('ID', refs.string()))).toBe('ID string');
  });

  it('writes an embedded field as its type only', () => {
    expect(render(goField(null, refs.error()))).toBe('error');
    expect(render(goField(null, goPointer(goReference('Base'))))).toBe('*Base');
  });

  it('writes a tag from its key/value pairs', () => {
    expect(
      render(
        goField('ID', refs.string(), {
          tag: [
            ['json', 'id,omitempty'],
            ['xml', 'id'],
          ],
        }),
      ),
    ).toBe('ID string `json:"id,omitempty" xml:"id"`');
  });

  it('writes a tag literal as it is', () => {
    expect(render(goField('ID', refs.string(), { tag: '`json:"id"`' }))).toBe('ID string `json:"id"`');
  });

  it('writes no tag without entries or with a null tag', () => {
    expect(render(goField('ID', refs.string(), { tag: [] }))).toBe('ID string');
    expect(render(goField('ID', refs.string(), { tag: null }))).toBe('ID string');
  });

  it('escapes quotes in the values of a tag', () => {
    expect(render(goField('ID', refs.string(), { tag: [['json', 'say "hi"']] }))).toBe(
      'ID string `json:"say \\"hi\\""`',
    );
  });

  it('writes a double-quoted tag literal when a value contains a backquote', () => {
    expect(render(goField('ID', refs.string(), { tag: [['json', 'a`b']] }))).toBe('ID string "json:\\"a`b\\""');
  });

  it('writes the doc comment on the line above', () => {
    expect(render(goField('A', refs.string(), { doc: goDoc('The a.') }))).toBe('// The a.\nA string');
  });

  it('writes a nested struct type on one line', () => {
    expect(render(goField('Meta', goStruct()))).toBe('Meta struct{}');
  });

  it('writes a map type', () => {
    expect(render(goField('Labels', goMap(refs.string(), refs.string()), { tag: [['json', 'labels']] }))).toBe(
      'Labels map[string]string `json:"labels"`',
    );
  });

  describe('getTagLiteral', () => {
    it('returns null without a tag', () => {
      expect(goField('A', refs.int()).getTagLiteral()).toBeNull();
      expect(goField('A', refs.int(), { tag: [] }).getTagLiteral()).toBeNull();
    });

    it('returns a tag literal as it is', () => {
      expect(goField('A', refs.int(), { tag: '`x:"y"`' }).getTagLiteral()).toBe('`x:"y"`');
    });

    it('returns the entries as a tag literal', () => {
      expect(goField('A', refs.int(), { tag: [['json', 'a']] }).getTagLiteral()).toBe('`json:"a"`');
    });
  });

  describe('getCells', () => {
    it('returns the name, the type and the tag', () => {
      const builder = createBuilder();

      expect(goField('ID', refs.string(), { tag: [['json', 'id']] }).getCells(builder)).toEqual([
        'ID',
        'string',
        '`json:"id"`',
      ]);
    });

    it('leaves out the name of an embedded field and a missing tag', () => {
      const builder = createBuilder();

      expect(goField(null, refs.error()).getCells(builder)).toEqual(['error']);
    });
  });

  it('writes several fields through its write helper', () => {
    const builder = createBuilder();
    goField.write(builder, [goField('A', refs.int()), goField('B', refs.bool())], { separator: '; ' });

    expect(builder.toFragmentString()).toBe('A int; B bool');
  });
});
