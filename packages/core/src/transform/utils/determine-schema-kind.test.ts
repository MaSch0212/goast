import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import type { OpenApiTransformerContext } from '../types.ts';
import { determineSchemaKind } from './determine-schema-kind.ts';

const ctx = { config: { unknownTypeBehavior: 'keep-unknown' } } as OpenApiTransformerContext;

test('returns "oneOf" if schema has "oneOf" property', () => {
  const schema = { oneOf: [{}] };
  expect(determineSchemaKind(ctx, schema)).toBe('oneOf');
});

test('returns "combined" if schema has "allOf" or "anyOf" property', () => {
  const schema = { allOf: [{}], anyOf: [{}] };
  expect(determineSchemaKind(ctx, schema)).toBe('combined');
});

test('returns "multi-type" if schema has "type" property as an array', () => {
  const schema = { type: ['string', 'number'] };
  expect(determineSchemaKind(ctx, schema)).toBe('multi-type');
});

test('returns the value of "type" property if it is a string', () => {
  const schema = { type: 'string' };
  expect(determineSchemaKind(ctx, schema)).toBe('string');
});

test('returns "unknown" if schema has no recognizable properties', () => {
  const schema = {};
  expect(determineSchemaKind(ctx, schema)).toBe('unknown');
});
