import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import {
  createCombinedSchema,
  createObjectSchema,
  createStringSchema,
  createUnknownProperty,
} from '../../tests/schema-factory.ts';
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
});
