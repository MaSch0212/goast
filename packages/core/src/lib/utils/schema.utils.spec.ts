import { createCombinedSchema, createStringSchema, createObjectSchema, createUnknownProperty } from '@goast/test/utils';

import { resolveAnyOfAndAllOf } from './schema.utils.js';

describe('resolveAnyOfAndAllOf', () => {
  it('should return undefined if the schema is not valid for merge and ignoreNonObjectParts is false', () => {
    const schema = createCombinedSchema({
      anyOf: [createStringSchema()],
    });

    const result = resolveAnyOfAndAllOf(schema, false);
    expect(result).toBeUndefined();
  });

  it('should resolve schema from allOf and anyOf', () => {
    const schema = createObjectSchema({
      name: 'root',
      properties: [createUnknownProperty('prop0')],
      required: ['prop0'],
      allOf: [createObjectSchema({ properties: [createUnknownProperty('prop1')], required: ['prop1'] })],
      anyOf: [createObjectSchema({ properties: [createUnknownProperty('prop2')], required: ['prop2'] })],
    });

    const expectedResult = expect.objectContaining(
      createObjectSchema({
        name: 'root',
        properties: [
          expect.objectContaining(createUnknownProperty('prop0')),
          expect.objectContaining(createUnknownProperty('prop1')),
          expect.objectContaining(createUnknownProperty('prop2')),
        ],
        required: ['prop0', 'prop1', 'prop2'],
      })
    );

    const result = resolveAnyOfAndAllOf(schema, true);
    expect(result).toEqual(expectedResult);
  });

  it('should merge properties from allOf and anyOf recursively', () => {
    const schema = createCombinedSchema({
      name: 'root',
      allOf: [
        createObjectSchema({
          properties: [createUnknownProperty('prop1')],
          required: ['prop1'],
        }),
      ],
      anyOf: [
        createCombinedSchema({
          allOf: [
            createObjectSchema({
              properties: [createUnknownProperty('prop2')],
              required: ['prop2'],
            }),
          ],
          anyOf: [
            createObjectSchema({
              properties: [createUnknownProperty('prop3')],
              required: ['prop3'],
            }),
          ],
        }),
      ],
    });

    const expectedResult = expect.objectContaining(
      createObjectSchema({
        name: 'root',
        properties: [
          expect.objectContaining(createUnknownProperty('prop1')),
          expect.objectContaining(createUnknownProperty('prop2')),
          expect.objectContaining(createUnknownProperty('prop3')),
        ],
        required: ['prop1'],
      })
    );

    const result = resolveAnyOfAndAllOf(schema, true);
    expect(result).toEqual(expectedResult);
  });
});
