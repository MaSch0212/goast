import { expect } from '@std/expect/expect';
import { fn } from '@std/expect/fn';
import { test } from '@std/testing/bdd';
import type { ApiSchema } from '../api-types.ts';
import type { OpenApiTransformerContext } from '../types.ts';
import { transformSchemaProperties } from './transform-schema-properties.ts';

const context = {} as OpenApiTransformerContext;

test('returns an empty array if properties is undefined', () => {
  const schema = {};
  const transformSchema = fn(() => ({})) as () => ApiSchema;
  expect(transformSchemaProperties(context, schema, transformSchema).size).toEqual(0);
});

test('calls transformSchema with each property schema and builds an array of ApiSchemaProperties', () => {
  const schema = {
    properties: {
      prop1: { type: 'string' } as ApiSchema,
      prop2: { type: 'integer' } as ApiSchema,
    },
    required: ['prop1'],
  };
  const transformedSchema1 = { type: 'string' } as ApiSchema;
  const transformedSchema2 = { type: 'integer' } as ApiSchema;
  // deno-lint-ignore no-explicit-any
  const transformSchema = fn((_: unknown, subSchema: any) =>
    subSchema.type === 'string' ? transformedSchema1 : transformedSchema2
  ) as (ctx: OpenApiTransformerContext, schema: ApiSchema) => ApiSchema;
  const result = transformSchemaProperties(context, schema, transformSchema);
  expect(Array.from(result.entries())).toEqual([
    ['prop1', { name: 'prop1', schema: transformedSchema1 }],
    ['prop2', { name: 'prop2', schema: transformedSchema2 }],
  ]);
  expect(transformSchema).toHaveBeenCalledTimes(2);
  expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop1);
  expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop2);
});

test('ignores properties with the name "$src"', () => {
  const schema = { properties: { prop1: { type: 'string' }, $src: { path: '/test/schema' } } };
  const transformedSchema1 = { type: 'string' } as ApiSchema;
  const transformSchema = fn(() => transformedSchema1) as () => ApiSchema;
  const result = transformSchemaProperties(context, schema, transformSchema);
  expect(Array.from(result.entries())).toEqual([['prop1', { name: 'prop1', schema: transformedSchema1 }]]);
  expect(transformSchema).toHaveBeenCalledTimes(1);
  expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop1);
});
