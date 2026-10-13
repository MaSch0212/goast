import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefSchemaAt } from '../parse/deref.test-utils.ts';
import type { ApiSchema } from './api-types.ts';
import { transformSchema } from './transform-schema.ts';
import { createTransformerContext } from './transform.test-utils.ts';

describe('transformSchema', () => {
  describe('OpenAPI 3.1 type arrays', () => {
    it('marks a schema with an "object"/"null" type array and an allOf as a nullable object', () => {
      const schema = derefSchemaAt('/components/schemas/NullableWithAllOf', {
        type: ['object', 'null'],
        allOf: [{ type: 'object' }],
      });

      const result = transformSchema(createTransformerContext(), schema);

      expect(result.kind).toBe('object');
      expect(result.nullable).toBe(true);
      expect((result as ApiSchema<'object'>).allOf).toHaveLength(1);
    });

    it('resolves a "null"-only type array next to a $ref to the referenced type', () => {
      const target = derefSchemaAt('/components/schemas/NullableEnum', {
        type: ['string', 'null'],
        enum: ['one', 'two'],
      });
      const schema = derefSchemaAt('/components/schemas/NullableRef', { type: ['null'] }, target);

      const result = transformSchema(createTransformerContext(), schema);

      expect(result.nullable).toBe(true);
      expect(result.kind).toBe('string');
      expect((result as ApiSchema<'string'>).type).toBe('string');
    });

    it('treats a "null"-only type array without a $ref as the null type', () => {
      const schema = derefSchemaAt('/components/schemas/NullOnly', { type: ['null'] });

      const result = transformSchema(createTransformerContext(), schema);

      expect(result.kind).toBe('null');
      expect(result.nullable).toBe(true);
    });

    it('keeps more than one remaining type as a multi-type schema', () => {
      const schema = derefSchemaAt('/components/schemas/MultiType', { type: ['string', 'integer', 'null'] });

      const result = transformSchema(createTransformerContext(), schema);

      expect(result.kind).toBe('multi-type');
      expect((result as ApiSchema<'multi-type'>).type).toEqual(['string', 'integer']);
      expect(result.nullable).toBe(true);
    });

    it('keeps the allOf of a type array with two or more non-null types, and still reports it nullable', () => {
      const schema = derefSchemaAt('/components/schemas/MultiTypeWithAllOf', {
        type: ['string', 'integer', 'null'],
        allOf: [{ type: 'object' }],
      });

      const result = transformSchema(createTransformerContext(), schema);

      // Not `multi-type`: nothing would re-run the kind decision, and both generators would then drop the
      // `allOf` — Kotlin refuses a declaration for `multi-type`, TypeScript renders a bare union.
      expect(result.kind).toBe('combined');
      expect((result as ApiSchema<'combined'>).allOf).toHaveLength(1);
      expect(result.nullable).toBe(true);
    });

    it('keeps the allOf of an all-null type array instead of collapsing to the bare null type', () => {
      const schema = derefSchemaAt('/components/schemas/NullWithAllOf', {
        type: ['null'],
        allOf: [{ type: 'object' }],
      });

      const result = transformSchema(createTransformerContext(), schema);

      expect(result.kind).toBe('combined');
      expect((result as ApiSchema<'combined'>).allOf).toHaveLength(1);
      expect(result.nullable).toBe(true);
    });

    it('reports an empty type array as nullable, like the scalar null type', () => {
      const empty = transformSchema(
        createTransformerContext(),
        derefSchemaAt('/components/schemas/EmptyTypeArray', { type: [] }),
      );
      const scalar = transformSchema(
        createTransformerContext(),
        derefSchemaAt('/components/schemas/NullScalar', { type: 'null' }),
      );

      expect(empty.kind).toBe('null');
      expect(scalar.kind).toBe('null');
      expect(empty.nullable).toBe(scalar.nullable);
      expect(empty.nullable).toBe(true);
    });
  });

  describe('prefixItems', () => {
    it('does not present a tuple with a rest schema as an array of the rest type', () => {
      const schema = derefSchemaAt('/components/schemas/TupleWithRest', {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'integer' }],
        items: { type: 'boolean' },
      });

      const result = transformSchema(createTransformerContext(), schema) as ApiSchema<'array'>;

      expect(result.kind).toBe('array');
      expect(result.items).toBeUndefined();
    });

    it('does not present a nullable tuple with a rest schema as an array of the rest type', () => {
      const schema = derefSchemaAt('/components/schemas/NullableTupleWithRest', {
        type: ['array', 'null'],
        prefixItems: [{ type: 'string' }, { type: 'integer' }],
        items: { type: 'boolean' },
      });

      const result = transformSchema(createTransformerContext(), schema) as ApiSchema<'array'>;

      expect(result.kind).toBe('array');
      expect(result.nullable).toBe(true);
      expect(result.items).toBeUndefined();
    });

    it('leaves a plain array with only items untouched', () => {
      const schema = derefSchemaAt('/components/schemas/ArrayOfString', {
        type: 'array',
        items: { type: 'string' },
      });

      const result = transformSchema(createTransformerContext(), schema) as ApiSchema<'array'>;

      expect(result.items?.kind).toBe('string');
    });
  });
});
