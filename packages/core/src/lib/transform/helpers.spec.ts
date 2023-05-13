import {
  IdGenerator,
  determineEndpointName,
  determineSchemaAccessibility,
  determineSchemaKind,
  determineSchemaName,
  getCustomFields,
  transformAdditionalProperties,
  transformSchemaProperties,
} from './helpers.js';
import { OpenApiTransformerContext } from './types.js';
import { ApiSchema } from '../types.js';

describe('determineSchemaKind', () => {
  test('returns "oneOf" if schema has "oneOf" property', () => {
    const schema = { oneOf: [{}] };
    expect(determineSchemaKind(schema)).toBe('oneOf');
  });

  test('returns "combined" if schema has "allOf" or "anyOf" property', () => {
    const schema = { allOf: [{}], anyOf: [{}] };
    expect(determineSchemaKind(schema)).toBe('combined');
  });

  test('returns "multi-type" if schema has "type" property as an array', () => {
    const schema = { type: ['string', 'number'] };
    expect(determineSchemaKind(schema)).toBe('multi-type');
  });

  test('returns the value of "type" property if it is a string', () => {
    const schema = { type: 'string' };
    expect(determineSchemaKind(schema)).toBe('string');
  });

  test('returns "unknown" if schema has no recognizable properties', () => {
    const schema = {};
    expect(determineSchemaKind(schema)).toBe('unknown');
  });
});

describe('determineSchemaName', () => {
  test('returns the schema title if it exists', () => {
    const schema = { title: 'TestSchema', $src: { path: '/test/schema' } };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  test('returns the schema name extracted from $src.path if it starts with "/components/schemas/"', () => {
    const schema = { $src: { path: '/components/schemas/TestSchema' } };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  test('returns the schema name extracted from $src.path if it starts with "/definitions/"', () => {
    const schema = { $src: { path: '/definitions/TestSchema' } };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  test('returns a generated name based on the $src.path for response schemas', () => {
    const schema = {
      $src: { path: '/paths/users/{userId}/email-verification/{token}/get/responses/200/' },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'get_users_{userId}_email-verification_{token}_200_Response',
      isGenerated: true,
    });
  });

  test('returns the provided id if no other name can be determined', () => {
    const schema = { $src: { path: '/test/schema' } };
    expect(determineSchemaName(schema, 'TestId')).toEqual({ name: 'TestId', isGenerated: true });
  });
});

describe('determineSchemaAccessibility', () => {
  test('returns "readOnly" if "readOnly" property is true and "writeOnly" property is false or undefined', () => {
    const schema = { readOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('readOnly');
  });

  test('returns "writeOnly" if "writeOnly" property is true and "readOnly" property is false or undefined', () => {
    const schema = { writeOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('writeOnly');
  });

  test('returns "none" if both "readOnly" and "writeOnly" properties are true', () => {
    const schema = { readOnly: true, writeOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('none');
  });

  test('returns "all" if neither "readOnly" nor "writeOnly" properties are true', () => {
    const schema = {};
    expect(determineSchemaAccessibility(schema)).toBe('all');
  });
});

describe('getCustomFields', () => {
  test('returns an empty object if no custom fields are present', () => {
    const schema = { type: 'string' };
    expect(getCustomFields(schema)).toEqual({});
  });

  test('returns an object containing all custom fields starting with "x-"', () => {
    const schema = {
      type: 'string',
      'x-custom-field-1': 'value1',
      'x-custom-field-2': 'value2',
    };
    expect(getCustomFields(schema)).toEqual({
      'custom-field-1': 'value1',
      'custom-field-2': 'value2',
    });
  });

  test('returns an object containing only custom fields starting with "x-"', () => {
    const schema = {
      type: 'string',
      'x-custom-field-1': 'value1',
      'not-a-custom-field': 'value2',
    };
    expect(getCustomFields(schema)).toEqual({ 'custom-field-1': 'value1' });
  });

  test('returns an object with the same values as the original custom fields', () => {
    const schema = {
      type: 'string',
      'x-custom-field-1': { key1: 'value1' },
      'x-custom-field-2': ['value2'],
    };
    expect(getCustomFields(schema)).toEqual({
      'custom-field-1': { key1: 'value1' },
      'custom-field-2': ['value2'],
    });
  });
});

describe('determineEndpointName', () => {
  test('returns the operationId if it exists', () => {
    const endpointInfo = {
      method: 'get',
      path: '/users',
      operation: { operationId: 'getUserList' },
    };
    expect(determineEndpointName(endpointInfo)).toBe('getUserList');
  });

  test('returns a generated name based on the method and path if operationId is not present', () => {
    const endpointInfo = { method: 'post', path: '/users/{userId}/comments', operation: {} };
    expect(determineEndpointName(endpointInfo)).toBe('post_users_:userId_comments');
  });

  test('replaces path parameters with their names in the generated name', () => {
    const endpointInfo = {
      method: 'get',
      path: '/users/{userId}/comments/{commentId}',
      operation: {},
    };
    expect(determineEndpointName(endpointInfo)).toBe('get_users_:userId_comments_:commentId');
  });

  test('replaces slashes in the path with underscores in the generated name', () => {
    const endpointInfo = { method: 'put', path: '/users/{userId}/profile-picture', operation: {} };
    expect(determineEndpointName(endpointInfo)).toBe('put_users_:userId_profile-picture');
  });
});

describe('transformAdditionalProperties', () => {
  const context = {} as OpenApiTransformerContext;

  test('returns undefined if additionalProperties is undefined or null', () => {
    const schema1 = { additionalProperties: undefined };
    const schema2 = { additionalProperties: null };
    expect(
      transformAdditionalProperties(context, schema1, () => ({} as ApiSchema))
    ).toBeUndefined();
    expect(
      transformAdditionalProperties(context, schema2, () => ({} as ApiSchema))
    ).toBeUndefined();
  });

  test('returns a boolean value if additionalProperties is a boolean value', () => {
    const schema1 = { additionalProperties: true };
    const schema2 = { additionalProperties: false };
    expect(transformAdditionalProperties(context, schema1, () => ({} as ApiSchema))).toBe(true);
    expect(transformAdditionalProperties(context, schema2, () => ({} as ApiSchema))).toBe(false);
  });

  test('calls transformSchema with the additionalProperties schema if it exists', () => {
    const schema = { additionalProperties: { type: 'string' } };
    const transformSchema = jest.fn(() => ({} as ApiSchema));
    transformAdditionalProperties(context, schema, transformSchema);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.additionalProperties);
  });

  test('returns the result of calling transformSchema with the additionalProperties schema if it exists', () => {
    const schema = { additionalProperties: { type: 'string' } };
    const transformedSchema = { type: 'string' } as ApiSchema;
    const transformSchema = jest.fn(() => transformedSchema);
    expect(transformAdditionalProperties(context, schema, transformSchema)).toBe(transformedSchema);
  });
});

describe('transformSchemaProperties', () => {
  const context = {} as OpenApiTransformerContext;

  test('returns an empty array if properties is undefined', () => {
    const schema = {};
    const transformSchema = jest.fn(() => ({} as ApiSchema));
    expect(transformSchemaProperties(context, schema, transformSchema).size).toEqual(0);
  });

  test('calls transformSchema with each property schema and builds an array of ApiSchemaProperties', () => {
    const schema = {
      properties: {
        prop1: { type: 'string' },
        prop2: { type: 'integer' },
      },
      required: ['prop1'],
    };
    const transformedSchema1 = { type: 'string' } as ApiSchema;
    const transformedSchema2 = { type: 'integer' } as ApiSchema;
    const transformSchema = jest.fn((_, subSchema) =>
      subSchema.type === 'string' ? transformedSchema1 : transformedSchema2
    );
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
    const transformSchema = jest.fn(() => transformedSchema1);
    const result = transformSchemaProperties(context, schema, transformSchema);
    expect(Array.from(result.entries())).toEqual([
      ['prop1', { name: 'prop1', schema: transformedSchema1 }],
    ]);
    expect(transformSchema).toHaveBeenCalledTimes(1);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop1);
  });
});

describe('IdGenerator', () => {
  test('generates unique ids based on the provided name', () => {
    const idGenerator = new IdGenerator();
    const id1 = idGenerator.generateId('test');
    const id2 = idGenerator.generateId('test');
    expect(id1).not.toBe(id2);
  });

  test('generates ids with the format "{name}-{n}"', () => {
    const idGenerator = new IdGenerator();
    const id1 = idGenerator.generateId('test');
    expect(id1).toMatch(/^test-\d+$/);
  });

  test('increments the id number for each new id generated with the same name', () => {
    const idGenerator = new IdGenerator();
    const id1 = idGenerator.generateId('test');
    const id2 = idGenerator.generateId('test');
    const id3 = idGenerator.generateId('test2');
    const id4 = idGenerator.generateId('test');
    expect(id1).toBe('test-1');
    expect(id2).toBe('test-2');
    expect(id3).toBe('test2-1');
    expect(id4).toBe('test-3');
  });
});
