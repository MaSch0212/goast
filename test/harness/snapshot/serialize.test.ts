import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { serializeValue } from './serialize.ts';

describe('serializeValue', () => {
  it('passes strings through unchanged', () => {
    expect(serializeValue('already text')).toBe('already text');
  });

  it('sorts object keys so output is order-independent', () => {
    expect(serializeValue({ b: 1, a: 2 })).toBe(serializeValue({ a: 2, b: 1 }));
    expect(serializeValue({ b: 1, a: 2 })).toContain('a: 2');
  });

  it('descends deeply nested structures', () => {
    let nested: unknown = 'leaf';
    for (let i = 0; i < 20; i++) nested = { next: nested };
    expect(serializeValue(nested)).toContain('leaf');
  });
});
