import { mergeSchemaProperties } from './schema.utils.js';
import { ApiSchema } from '../types.js';

describe('mergeSchemaProperties', () => {
  it('should return undefined if the schema is not valid for merge and ignoreNonObjectParts is false', () => {
    const schema = {
      kind: 'combined',
      allOf: [],
      anyOf: [
        {
          kind: 'string',
          type: 'string',
        },
      ],
    } as unknown as ApiSchema<'combined'>;

    const result = mergeSchemaProperties(schema, false);
    expect(result).toBeUndefined();
  });

  it('should merge properties from allOf and anyOf', () => {
    const schema = {
      kind: 'object',
      properties: [
        {
          name: 'prop0',
          required: true,
          schema: {},
        },
      ],
      allOf: [
        {
          kind: 'object',
          type: 'object',
          properties: [
            {
              name: 'prop1',
              required: true,
              schema: {},
            },
          ],
        },
      ],
      anyOf: [
        {
          kind: 'object',
          type: 'object',
          properties: [
            {
              name: 'prop2',
              required: true,
              schema: {},
            },
          ],
        },
      ],
    } as ApiSchema<'object'>;

    const expectedResult = expect.objectContaining({
      kind: 'object',
      type: 'object',
      anyOf: [],
      allOf: [],
      properties: [
        expect.objectContaining({
          name: 'prop0',
          required: true,
        }),
        expect.objectContaining({
          name: 'prop1',
          required: true,
        }),
        expect.objectContaining({
          name: 'prop2',
          required: false,
        }),
      ],
    });

    const result = mergeSchemaProperties(schema, true);
    expect(result).toEqual(expectedResult);
  });

  it('should merge properties from allOf and anyOf recursively', () => {
    const schema = {
      kind: 'combined',
      allOf: [
        {
          kind: 'object',
          type: 'object',
          properties: [
            {
              name: 'prop1',
              required: true,
              schema: {},
            },
          ],
        },
      ],
      anyOf: [
        {
          kind: 'combined',
          allOf: [
            {
              kind: 'object',
              type: 'object',
              properties: [
                {
                  name: 'prop2',
                  required: true,
                  schema: {},
                },
              ],
            },
          ],
          anyOf: [
            {
              kind: 'object',
              type: 'object',
              properties: [
                {
                  name: 'prop3',
                  required: true,
                  schema: {},
                },
              ],
            },
          ],
        },
      ],
    } as ApiSchema<'combined'>;

    const expectedResult = expect.objectContaining({
      kind: 'object',
      type: 'object',
      anyOf: [],
      allOf: [],
      properties: [
        expect.objectContaining({
          name: 'prop1',
          required: true,
        }),
        expect.objectContaining({
          name: 'prop2',
          required: false,
        }),
        expect.objectContaining({
          name: 'prop3',
          required: false,
        }),
      ],
    });

    const result = mergeSchemaProperties(schema, true);
    expect(result).toEqual(expectedResult);
  });
});
