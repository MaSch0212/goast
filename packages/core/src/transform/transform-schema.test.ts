import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { createDerefProxy } from '../parse/deref-proxy.ts';
import type { OpenApiDocument, OpenApiSchema } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import type { ApiSchema } from './api-types.ts';
import { IdGenerator } from './helpers.ts';
import { transformSchema } from './transform-schema.ts';
import { defaultOpenApiTransformerOptions, type OpenApiTransformerContext } from './types.ts';

function createContext(): OpenApiTransformerContext {
  return {
    config: { ...defaultOpenApiTransformerOptions },
    idGenerator: new IdGenerator(),
    incompleteSchemas: new Map(),
    schemas: new Map(),
    transformed: { schemas: new Map() },
  } as unknown as OpenApiTransformerContext;
}

const nestedSchemaKeys = ['allOf', 'anyOf', 'oneOf', 'not', 'items', 'prefixItems', 'properties'];

/** Builds a dereferenced schema the same way the parser does, so `$ref` fallthrough behaves faithfully. */
function derefSchema(
  name: string,
  schema: Record<string, unknown>,
  ref?: Deref<OpenApiSchema>,
): Deref<OpenApiSchema> {
  return derefAt(`/components/schemas/${name}`, schema, ref);
}

function derefAt(path: string, schema: Record<string, unknown>, ref?: Deref<OpenApiSchema>): Deref<OpenApiSchema> {
  for (const key of nestedSchemaKeys) {
    const value = schema[key];
    if (Array.isArray(value)) {
      schema[key] = value.map((x, i) => derefAt(`${path}/${key}/${i}`, x as Record<string, unknown>));
    } else if (value && typeof value === 'object') {
      schema[key] = key === 'properties'
        ? Object.fromEntries(
          Object.entries(value as Record<string, Record<string, unknown>>).map(([k, v]) => [
            k,
            derefAt(`${path}/${key}/${k}`, v),
          ]),
        )
        : derefAt(`${path}/${key}`, value as Record<string, unknown>);
    }
  }

  return createDerefProxy(
    schema as OpenApiSchema,
    {
      file: 'test.yml',
      pos: { line: 0, col: 0 },
      path,
      document: {} as Deref<OpenApiDocument>,
      originalComponent: schema as OpenApiSchema,
    },
    ref,
  );
}

describe('transformSchema', () => {
  describe('OpenAPI 3.1 type arrays', () => {
    it('marks a schema with an "object"/"null" type array and an allOf as a nullable object', () => {
      const schema = derefSchema('NullableWithAllOf', {
        type: ['object', 'null'],
        allOf: [{ type: 'object' }],
      });

      const result = transformSchema(createContext(), schema);

      expect(result.kind).toBe('object');
      expect(result.nullable).toBe(true);
      expect((result as ApiSchema<'object'>).allOf).toHaveLength(1);
    });

    it('resolves a "null"-only type array next to a $ref to the referenced type', () => {
      const target = derefSchema('NullableEnum', { type: ['string', 'null'], enum: ['one', 'two'] });
      const schema = derefSchema('NullableRef', { type: ['null'] }, target);

      const result = transformSchema(createContext(), schema);

      expect(result.nullable).toBe(true);
      expect(result.kind).toBe('string');
      expect((result as ApiSchema<'string'>).type).toBe('string');
    });

    it('treats a "null"-only type array without a $ref as the null type', () => {
      const schema = derefSchema('NullOnly', { type: ['null'] });

      const result = transformSchema(createContext(), schema);

      expect(result.kind).toBe('null');
      expect(result.nullable).toBe(true);
    });

    it('keeps more than one remaining type as a multi-type schema', () => {
      const schema = derefSchema('MultiType', { type: ['string', 'integer', 'null'] });

      const result = transformSchema(createContext(), schema);

      expect(result.kind).toBe('multi-type');
      expect((result as ApiSchema<'multi-type'>).type).toEqual(['string', 'integer']);
      expect(result.nullable).toBe(true);
    });

    it('keeps the allOf of a type array with two or more non-null types, and still reports it nullable', () => {
      const schema = derefSchema('MultiTypeWithAllOf', {
        type: ['string', 'integer', 'null'],
        allOf: [{ type: 'object' }],
      });

      const result = transformSchema(createContext(), schema);

      // Not `multi-type`: nothing would re-run the kind decision, and both generators would then drop the
      // `allOf` — Kotlin refuses a declaration for `multi-type`, TypeScript renders a bare union.
      expect(result.kind).toBe('combined');
      expect((result as ApiSchema<'combined'>).allOf).toHaveLength(1);
      expect(result.nullable).toBe(true);
    });

    it('keeps the allOf of an all-null type array instead of collapsing to the bare null type', () => {
      const schema = derefSchema('NullWithAllOf', { type: ['null'], allOf: [{ type: 'object' }] });

      const result = transformSchema(createContext(), schema);

      expect(result.kind).toBe('combined');
      expect((result as ApiSchema<'combined'>).allOf).toHaveLength(1);
      expect(result.nullable).toBe(true);
    });

    it('reports an empty type array as nullable, like the scalar null type', () => {
      const empty = transformSchema(createContext(), derefSchema('EmptyTypeArray', { type: [] }));
      const scalar = transformSchema(createContext(), derefSchema('NullScalar', { type: 'null' }));

      expect(empty.kind).toBe('null');
      expect(scalar.kind).toBe('null');
      expect(empty.nullable).toBe(scalar.nullable);
      expect(empty.nullable).toBe(true);
    });
  });

  describe('prefixItems', () => {
    it('does not present a tuple with a rest schema as an array of the rest type', () => {
      const schema = derefSchema('TupleWithRest', {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'integer' }],
        items: { type: 'boolean' },
      });

      const result = transformSchema(createContext(), schema) as ApiSchema<'array'>;

      expect(result.kind).toBe('array');
      expect(result.items).toBeUndefined();
    });

    it('does not present a nullable tuple with a rest schema as an array of the rest type', () => {
      const schema = derefSchema('NullableTupleWithRest', {
        type: ['array', 'null'],
        prefixItems: [{ type: 'string' }, { type: 'integer' }],
        items: { type: 'boolean' },
      });

      const result = transformSchema(createContext(), schema) as ApiSchema<'array'>;

      expect(result.kind).toBe('array');
      expect(result.nullable).toBe(true);
      expect(result.items).toBeUndefined();
    });

    it('leaves a plain array with only items untouched', () => {
      const schema = derefSchema('ArrayOfString', { type: 'array', items: { type: 'string' } });

      const result = transformSchema(createContext(), schema) as ApiSchema<'array'>;

      expect(result.items?.kind).toBe('string');
    });
  });
});
