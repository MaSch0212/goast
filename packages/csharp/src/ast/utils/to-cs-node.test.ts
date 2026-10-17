import { describe, expect, it } from 'vitest';

import { createBuilder } from '../nodes/create-builder.test-utils.ts';
import { CsString } from '../nodes/string.ts';
import { toCsNode } from './to-cs-node.ts';

describe('toCsNode', () => {
  it('should convert strings to string literals', () => {
    const node = toCsNode('a "b"');
    expect(node).toBeInstanceOf(CsString);
    expect(createBuilder().append(node).toString(false)).toBe('"a \\"b\\""');
  });

  it('should convert numbers', () => {
    expect(toCsNode(42)).toBe('42');
    expect(toCsNode(1.5)).toBe('1.5');
    expect(toCsNode(-1)).toBe('-1');
  });

  it('should convert booleans', () => {
    expect(toCsNode(true)).toBe('true');
    expect(toCsNode(false)).toBe('false');
  });

  it('should convert null and undefined to null', () => {
    expect(toCsNode(null)).toBe('null');
    expect(toCsNode(undefined)).toBe('null');
  });

  it('should convert arrays to collection expressions', () => {
    expect(
      createBuilder()
        .append(toCsNode([1, 'a', null]))
        .toString(false),
    ).toBe('[1, "a", null]');
  });

  it('should convert nested arrays', () => {
    expect(
      createBuilder()
        .append(toCsNode([[1], []]))
        .toString(false),
    ).toBe('[[1], []]');
  });

  it('should throw for objects', () => {
    expect(() => toCsNode({ a: 1 })).toThrow(/object/);
  });
});
