import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import type { ApiSchema } from '../transform/api-types.ts';
import {
  createCombinedSchema,
  createIntegerProperty,
  createObjectSchema,
  createOneOfSchema,
  createStringProperty,
  createStringSchema,
  createUnknownProperty,
  createUnknownSchema,
} from './schema-factory.ts';
import { resolveAnyOfAndAllOf } from './schema.utils.ts';

describe('resolveAnyOfAndAllOf', () => {
  it('should return undefined if the schema is not valid for merge and ignoreNonObjectParts is false', () => {
    const schema = createCombinedSchema({
      anyOf: [createStringSchema()],
    });

    const result = resolveAnyOfAndAllOf(schema, false);
    expect(result).toBeUndefined();
  });

  it('should resolve schema from allOf and anyOf', () => {
    const prop0 = createUnknownProperty('prop0');
    const prop1 = createUnknownProperty('prop1');
    const prop2 = createUnknownProperty('prop2');
    const schema = createObjectSchema({
      name: 'root',
      properties: [prop0],
      required: ['prop0'],
      allOf: [createObjectSchema({ properties: [prop1], required: ['prop1'] })],
      anyOf: [createObjectSchema({ properties: [prop2], required: ['prop2'] })],
    });

    const expectedResult = expect.objectContaining(
      createObjectSchema({
        name: 'root',
        properties: [prop0, prop1, prop2],
        required: ['prop0', 'prop1'],
      }),
    );

    const result = resolveAnyOfAndAllOf(schema, true);
    expect(result).toEqual(expectedResult);
  });

  it('should collect required from an allOf branch that contributes nothing but required', () => {
    const id = createUnknownProperty('id');
    const name = createUnknownProperty('name');
    const schema = createCombinedSchema({
      name: 'AllOfRequiredOnly',
      allOf: [
        createObjectSchema({ properties: [id, name], required: ['id'] }),
        createUnknownSchema({ required: ['name'] }),
      ],
    });

    const result = resolveAnyOfAndAllOf(schema, true);

    expect(Array.from(result?.required ?? [])).toEqual(['id', 'name']);
  });

  it('should not collect required from an anyOf branch that contributes nothing but required', () => {
    const id = createUnknownProperty('id');
    const schema = createCombinedSchema({
      name: 'AnyOfRequiredOnly',
      allOf: [createObjectSchema({ properties: [id], required: ['id'] })],
      anyOf: [createUnknownSchema({ required: ['name'] })],
    });

    const result = resolveAnyOfAndAllOf(schema, true);

    expect(Array.from(result?.required ?? [])).toEqual(['id']);
  });

  it('should merge properties from allOf and anyOf recursively', () => {
    const prop1 = createUnknownProperty('prop1');
    const prop2 = createUnknownProperty('prop2');
    const prop3 = createUnknownProperty('prop3');
    const schema = createCombinedSchema({
      name: 'root',
      allOf: [
        createObjectSchema({
          properties: [prop1],
          required: ['prop1'],
        }),
      ],
      anyOf: [
        createCombinedSchema({
          allOf: [
            createObjectSchema({
              properties: [prop2],
              required: ['prop2'],
            }),
          ],
          anyOf: [
            createObjectSchema({
              properties: [prop3],
              required: ['prop3'],
            }),
          ],
        }),
      ],
    });

    const expectedResult = expect.objectContaining(
      createObjectSchema({
        name: 'root',
        properties: [prop1, prop2, prop3],
        required: ['prop1'],
      }),
    );

    const result = resolveAnyOfAndAllOf(schema, true);
    expect(result).toEqual(expectedResult);
  });

  describe('composition cycles', () => {
    it('should terminate when an anyOf branch composes back to its own holder', () => {
      // The shape of test/specs/v3/anyof-cycle.yml: the holder's anyOf branches allOf back to the holder.
      const root = createObjectSchema({
        name: 'AnyOfDiscriminator',
        properties: [createStringProperty('kind')],
        required: ['kind'],
      });
      const branchA = createCombinedSchema({
        name: 'AnyOfDiscriminatorA',
        allOf: [root, createObjectSchema({ properties: [createStringProperty('aValue')] })],
      });
      const branchB = createCombinedSchema({
        name: 'AnyOfDiscriminatorB',
        allOf: [root, createObjectSchema({ properties: [createStringProperty('bValue')] })],
      });
      root.anyOf.push(branchA, branchB);

      const result = resolveAnyOfAndAllOf(root, true);

      // Depth-first: branch A composes back to the holder, whose anyOf reaches B before A unwinds. The
      // order is a consequence of the cycle rather than of the declaration order, but it is deterministic,
      // which is what byte-exact output needs.
      expect([...(result?.properties.keys() ?? [])]).toEqual(['kind', 'bValue', 'aValue']);
      expect([...(result?.required ?? [])]).toEqual(['kind']);
    });

    it('should terminate when a cycling branch also declares additionalProperties', () => {
      const root = createObjectSchema({
        name: 'AdditionalPropertiesCycle',
        properties: [createStringProperty('kind')],
        additionalProperties: createStringSchema({ name: 'Extra' }),
      });
      root.anyOf.push(createCombinedSchema({ name: 'Branch', allOf: [root] }));

      const result = resolveAnyOfAndAllOf(root, true);

      expect([...(result?.properties.keys() ?? [])]).toEqual(['kind']);
    });
  });

  describe('nested oneOf branches', () => {
    it('should collect the properties of a oneOf nested inside an allOf', () => {
      const schema = createCombinedSchema({
        name: 'AllOfContainingOneOf',
        allOf: [
          createOneOfSchema({
            oneOf: [
              createObjectSchema({ name: 'NestedBranchA', properties: [createStringProperty('a')] }),
              createObjectSchema({ name: 'NestedBranchB', properties: [createIntegerProperty('b')] }),
            ],
          }),
          createObjectSchema({ properties: [createStringProperty('extra')] }),
        ],
      });

      const result = resolveAnyOfAndAllOf(schema, true);

      expect([...(result?.properties.keys() ?? [])]).toEqual(['a', 'b', 'extra']);
    });

    it('should not collect required from a oneOf branch, since only one branch applies', () => {
      const schema = createCombinedSchema({
        name: 'AllOfContainingRequiredOneOf',
        allOf: [
          createOneOfSchema({
            oneOf: [
              createObjectSchema({ properties: [createStringProperty('a')], required: ['a'] }),
              createObjectSchema({ properties: [createIntegerProperty('b')], required: ['b'] }),
            ],
          }),
          createObjectSchema({ properties: [createStringProperty('extra')], required: ['extra'] }),
        ],
      });

      const result = resolveAnyOfAndAllOf(schema, true);

      expect([...(result?.required ?? [])]).toEqual(['extra']);
    });
  });

  describe('conflicting property types', () => {
    it('should widen a same-name allOf conflict instead of dropping one side', () => {
      const schema = createCombinedSchema({
        name: 'AllOfConflicting',
        allOf: [
          createObjectSchema({ properties: [createStringProperty('value')] }),
          createObjectSchema({ properties: [createIntegerProperty('value')] }),
        ],
      });

      const result = resolveAnyOfAndAllOf(schema, true);
      const value = result?.properties.get('value')?.schema as ApiSchema<'oneOf'> | undefined;

      expect(value?.kind).toBe('oneOf');
      expect(value?.oneOf.map((x) => x.kind)).toEqual(['string', 'integer']);
    });

    it('should give a widened conflict a deterministic id', () => {
      const build = () =>
        resolveAnyOfAndAllOf(
          createCombinedSchema({
            name: 'AllOfConflicting',
            allOf: [
              createObjectSchema({ properties: [createStringProperty('value', { id: 'a' })] }),
              createObjectSchema({ properties: [createIntegerProperty('value', { id: 'b' })] }),
            ],
          }),
          true,
        );

      expect(build()?.properties.get('value')?.schema.id).toBe(build()?.properties.get('value')?.schema.id);
    });

    it('should keep the first declaration when two branches agree on the kind', () => {
      const first = createStringProperty('value', { name: 'First' });
      const schema = createCombinedSchema({
        name: 'AllOfAgreeing',
        allOf: [
          createObjectSchema({ properties: [first] }),
          createObjectSchema({ properties: [createStringProperty('value', { name: 'Second' })] }),
        ],
      });

      const result = resolveAnyOfAndAllOf(schema, true);

      expect(result?.properties.get('value')).toBe(first);
    });

    it('should not treat a branch that says nothing about the type as a conflict', () => {
      const first = createStringProperty('value', { name: 'First' });
      const schema = createCombinedSchema({
        name: 'AllOfUnknownSide',
        allOf: [
          createObjectSchema({ properties: [first] }),
          createObjectSchema({ properties: [createUnknownProperty('value')] }),
        ],
      });

      const result = resolveAnyOfAndAllOf(schema, true);

      expect(result?.properties.get('value')).toBe(first);
    });
  });
});
