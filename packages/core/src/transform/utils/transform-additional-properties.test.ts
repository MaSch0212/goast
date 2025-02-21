import { expect } from '@std/expect/expect';
import { fn } from '@std/expect/fn';
import { test } from '@std/testing/bdd';
import type { ApiSchema } from '../api-types.ts';
import type { OpenApiTransformerContext } from '../types.ts';
import { transformAdditionalProperties } from './transform-additional-properties.ts';

const context = {} as OpenApiTransformerContext;

test('returns undefined if additionalProperties is undefined or null', () => {
  const schema1 = { additionalProperties: undefined };
  const schema2 = { additionalProperties: null };
  expect(transformAdditionalProperties(context, schema1, () => ({}) as ApiSchema)).toBeUndefined();
  expect(transformAdditionalProperties(context, schema2, () => ({}) as ApiSchema)).toBeUndefined();
});

test('returns a boolean value if additionalProperties is a boolean value', () => {
  const schema1 = { additionalProperties: true };
  const schema2 = { additionalProperties: false };
  expect(transformAdditionalProperties(context, schema1, () => ({}) as ApiSchema)).toBe(true);
  expect(transformAdditionalProperties(context, schema2, () => ({}) as ApiSchema)).toBe(false);
});

test('calls transformSchema with the additionalProperties schema if it exists', () => {
  const schema = { additionalProperties: { type: 'string' } };
  const transformSchema = fn(() => ({})) as () => ApiSchema;
  transformAdditionalProperties(context, schema, transformSchema);
  expect(transformSchema).toHaveBeenCalledWith(context, schema.additionalProperties);
});

test('returns the result of calling transformSchema with the additionalProperties schema if it exists', () => {
  const schema = { additionalProperties: { type: 'string' } };
  const transformedSchema = { type: 'string' } as ApiSchema;
  const transformSchema = fn(() => transformedSchema) as () => ApiSchema;
  expect(transformAdditionalProperties(context, schema, transformSchema)).toBe(transformedSchema);
});
