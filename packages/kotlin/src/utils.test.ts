import { describe, expect, it } from 'vitest';

import type { ApiSchema } from '@goast/core';

import { getArrayItemStringEnumSchema, getStringEnumSchema } from './utils.ts';

function createSchema(kind: string, overrides: Record<string, unknown> = {}): ApiSchema {
  return { kind, type: kind, enum: undefined, ...overrides } as unknown as ApiSchema;
}

describe('getStringEnumSchema', () => {
  it('returns a string schema with enum values', () => {
    const schema = createSchema('string', { enum: ['a', 'b'] });

    expect(getStringEnumSchema(schema)).toBe(schema);
  });

  it('returns undefined for a string schema without enum values', () => {
    expect(getStringEnumSchema(createSchema('string'))).toBeUndefined();
    expect(getStringEnumSchema(createSchema('string', { enum: [] }))).toBeUndefined();
  });

  it('returns undefined for a non-string schema with enum values', () => {
    expect(getStringEnumSchema(createSchema('integer', { enum: [1, 2] }))).toBeUndefined();
  });

  it('returns undefined for a missing schema', () => {
    expect(getStringEnumSchema(undefined)).toBeUndefined();
    expect(getStringEnumSchema(null)).toBeUndefined();
  });
});

describe('getArrayItemStringEnumSchema', () => {
  it('returns the item schema of an array of string enums', () => {
    const items = createSchema('string', { enum: ['a', 'b'] });

    expect(getArrayItemStringEnumSchema(createSchema('array', { items }))).toBe(items);
  });

  it('returns undefined for an array of plain strings', () => {
    expect(getArrayItemStringEnumSchema(createSchema('array', { items: createSchema('string') }))).toBeUndefined();
  });

  it('returns undefined for a string enum that is not an array', () => {
    expect(getArrayItemStringEnumSchema(createSchema('string', { enum: ['a'] }))).toBeUndefined();
  });

  it('returns undefined for a missing schema', () => {
    expect(getArrayItemStringEnumSchema(undefined)).toBeUndefined();
  });
});
