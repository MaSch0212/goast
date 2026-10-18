import { describe, expect, it } from 'vitest';

import { alignCells } from './align.ts';

describe('alignCells', () => {
  it('pads every column but the last to the widest cell of its block', () => {
    expect(
      alignCells([
        ['ID', 'string', '`json:"id"`'],
        ['Name', '*string', '`json:"name,omitempty"`'],
      ]),
    ).toEqual(['ID   string  `json:"id"`', 'Name *string `json:"name,omitempty"`']);
  });

  it('ends a column block at a line without that column', () => {
    expect(
      alignCells([
        ['A', 'int', '`json:"a"`'],
        ['LongName', 'int'],
        ['B', 'string', '`json:"b"`'],
      ]),
    ).toEqual(['A        int `json:"a"`', 'LongName int', 'B        string `json:"b"`']);
  });

  it('keeps a single-cell line as it is and ends the blocks at it', () => {
    expect(alignCells([['A', 'int'], ['// comment'], ['Longer', 'int']])).toEqual([
      'A int',
      '// comment',
      'Longer int',
    ]);
  });
});
