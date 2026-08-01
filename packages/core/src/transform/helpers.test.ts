import { expect, fn } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { parseYamlWithInfo } from '../utils/yaml-info.ts';
import type { ApiSchema } from './api-types.ts';
import {
  determineEndpointName,
  determineSchemaAccessibility,
  determineSchemaKind,
  determineSchemaName,
  getCustomFields,
  IdGenerator,
  transformAdditionalProperties,
  transformSchemaProperties,
} from './helpers.ts';
import type { OpenApiTransformerContext } from './types.ts';

describe('determineSchemaKind', () => {
  const ctx = { config: { unknownTypeBehavior: 'keep-unknown' } } as OpenApiTransformerContext;

  it('returns "oneOf" if schema has "oneOf" property', () => {
    const schema = { oneOf: [{}] };
    expect(determineSchemaKind(ctx, schema)).toBe('oneOf');
  });

  it('returns "combined" if schema has "allOf" or "anyOf" property', () => {
    const schema = { allOf: [{}], anyOf: [{}] };
    expect(determineSchemaKind(ctx, schema)).toBe('combined');
  });

  it('returns "multi-type" if schema has "type" property as an array', () => {
    const schema = { type: ['string', 'number'] };
    expect(determineSchemaKind(ctx, schema)).toBe('multi-type');
  });

  it('returns "multi-type" if a 3.1 type array is combined with "allOf"', () => {
    const schema = { type: ['object', 'null'], allOf: [{ type: 'object' }] };
    expect(determineSchemaKind(ctx, schema)).toBe('multi-type');
  });

  it('returns "multi-type" if a 3.1 type array is combined with "anyOf"', () => {
    const schema = { type: ['string', 'null'], anyOf: [{ type: 'string' }] };
    expect(determineSchemaKind(ctx, schema)).toBe('multi-type');
  });

  // A type array with two or more non-null types is not normalized away by `transformSchema`, so nothing
  // re-runs this function for it. It therefore has to keep yielding the same kind as before the 3.1 type
  // array was given precedence, otherwise such a schema silently loses its `allOf` merge downstream.
  it('still returns "combined" if a type array with two or more non-null types has "allOf"', () => {
    expect(determineSchemaKind(ctx, { type: ['string', 'integer'], allOf: [{ type: 'string' }] })).toBe('combined');
    expect(determineSchemaKind(ctx, { type: ['string', 'integer', 'null'], anyOf: [{ type: 'string' }] })).toBe(
      'combined',
    );
  });

  it('still returns "object" if a type array with two or more non-null types has "allOf" and properties', () => {
    expect(
      determineSchemaKind(ctx, { type: ['string', 'integer'], properties: { a: {} }, allOf: [{ type: 'object' }] }),
    ).toBe('object');
    expect(
      determineSchemaKind(ctx, {
        type: ['string', 'integer', 'null'],
        properties: { a: {} },
        allOf: [{ type: 'object' }],
      }),
    ).toBe('object');
  });

  it('returns "multi-type" for a type array with two or more non-null types and no composition', () => {
    expect(determineSchemaKind(ctx, { type: ['string', 'integer'] })).toBe('multi-type');
    expect(determineSchemaKind(ctx, { type: ['string', 'integer', 'null'] })).toBe('multi-type');
  });

  it('returns the value of "type" property if it is a string', () => {
    const schema = { type: 'string' };
    expect(determineSchemaKind(ctx, schema)).toBe('string');
  });

  it('returns "unknown" if schema has no recognizable properties', () => {
    const schema = {};
    expect(determineSchemaKind(ctx, schema)).toBe('unknown');
  });
});

describe('determineSchemaName', () => {
  it('returns the schema title if it exists', () => {
    const schema = {
      title: 'TestSchema',
      $src: {
        file: 'my-api.yml',
        pos: { line: 0, col: 0 },
        path: '/test/schema',
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  it("returns the json schema file name if the schema title doesn't exist", () => {
    const schema = {
      $src: {
        path: '/',
        file: 'test.json',
        pos: { line: 0, col: 0 },
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'test',
      isGenerated: true,
    });
  });

  it('returns the schema name extracted from $src.path if it starts with "/components/schemas/"', () => {
    const schema = {
      $src: {
        file: 'my-api.yml',
        pos: { line: 0, col: 0 },
        path: '/components/schemas/TestSchema',
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  it('returns the schema name extracted from $src.path if it starts with "/definitions/"', () => {
    const schema = {
      $src: {
        file: 'my-api.yml',
        pos: { line: 0, col: 0 },
        path: '/definitions/TestSchema',
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'TestSchema',
      isGenerated: false,
    });
  });

  it('returns a generated name based on the $src.path for response schemas', () => {
    const schema = {
      $src: {
        file: 'my-api.yml',
        pos: { line: 0, col: 0 },
        path: '/paths/users/{userId}/email-verification/{token}/get/responses/200/',
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({
      name: 'get_users_:userId_email-verification_:token_200_Response',
      isGenerated: true,
    });
  });

  it('composes the names of inline objects nested more than one level deep', () => {
    const document = parseYamlWithInfo(`
components:
  schemas:
    NestedInlineObject:
      type: object
      properties:
        middle:
          type: object
          properties:
            inner:
              type: object
              properties:
                value:
                  type: string
`) as Deref<OpenApiDocument>;

    const nameOf = (path: string) =>
      determineSchemaName(
        {
          $src: { file: 'my-api.yml', pos: { line: 0, col: 0 }, path, document, originalComponent: {} },
        },
        'schema-15',
      );

    expect(nameOf('/components/schemas/NestedInlineObject/properties/middle')).toEqual({
      name: 'NestedInlineObject_middle',
      isGenerated: true,
    });
    expect(nameOf('/components/schemas/NestedInlineObject/properties/middle/properties/inner')).toEqual({
      name: 'NestedInlineObject_middle_inner',
      isGenerated: true,
    });
    expect(
      nameOf('/components/schemas/NestedInlineObject/properties/middle/properties/inner/properties/value'),
    ).toEqual({
      name: 'NestedInlineObject_middle_inner_value',
      isGenerated: true,
    });
  });

  it('returns the provided id if no other name can be determined', () => {
    const schema = {
      $src: {
        file: 'my-api.yml',
        pos: { line: 0, col: 0 },
        path: '/test/schema',
        document: {} as Deref<OpenApiDocument>,
        originalComponent: {},
      },
    };
    expect(determineSchemaName(schema, 'TestId')).toEqual({ name: 'TestId', isGenerated: true });
  });

  it('prints nothing for a schema without $src', () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(' '));
    try {
      // Still throws — the next statement dereferences $src. Only the silence is under test.
      // deno-lint-ignore no-explicit-any
      determineSchemaName({} as any, 'some-id');
    } catch {
      // expected
    } finally {
      console.log = original;
    }
    expect(lines).toEqual([]);
  });
});

describe('determineSchemaAccessibility', () => {
  it('returns "readOnly" if "readOnly" property is true and "writeOnly" property is false or undefined', () => {
    const schema = { readOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('readOnly');
  });

  it('returns "writeOnly" if "writeOnly" property is true and "readOnly" property is false or undefined', () => {
    const schema = { writeOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('writeOnly');
  });

  it('returns "none" if both "readOnly" and "writeOnly" properties are true', () => {
    const schema = { readOnly: true, writeOnly: true };
    expect(determineSchemaAccessibility(schema)).toBe('none');
  });

  it('returns "all" if neither "readOnly" nor "writeOnly" properties are true', () => {
    const schema = {};
    expect(determineSchemaAccessibility(schema)).toBe('all');
  });
});

describe('getCustomFields', () => {
  it('returns an empty object if no custom fields are present', () => {
    const schema = { type: 'string' };
    expect(getCustomFields(schema)).toEqual({});
  });

  it('returns an object containing all custom fields starting with "x-"', () => {
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

  it('returns an object containing only custom fields starting with "x-"', () => {
    const schema = {
      type: 'string',
      'x-custom-field-1': 'value1',
      'not-a-custom-field': 'value2',
    };
    expect(getCustomFields(schema)).toEqual({ 'custom-field-1': 'value1' });
  });

  it('returns an object with the same values as the original custom fields', () => {
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
  it('returns the operationId if it exists', () => {
    const endpointInfo = {
      method: 'get',
      path: '/users',
      operation: { operationId: 'getUserList' },
    };
    expect(determineEndpointName(endpointInfo)).toBe('getUserList');
  });

  it('returns a generated name based on the method and path if operationId is not present', () => {
    const endpointInfo = { method: 'post', path: '/users/{userId}/comments', operation: {} };
    expect(determineEndpointName(endpointInfo)).toBe('post_users_:userId_comments');
  });

  it('replaces path parameters with their names in the generated name', () => {
    const endpointInfo = {
      method: 'get',
      path: '/users/{userId}/comments/{commentId}',
      operation: {},
    };
    expect(determineEndpointName(endpointInfo)).toBe('get_users_:userId_comments_:commentId');
  });

  it('replaces slashes in the path with underscores in the generated name', () => {
    const endpointInfo = { method: 'put', path: '/users/{userId}/profile-picture', operation: {} };
    expect(determineEndpointName(endpointInfo)).toBe('put_users_:userId_profile-picture');
  });
});

describe('transformAdditionalProperties', () => {
  const context = {} as OpenApiTransformerContext;

  it('returns undefined if additionalProperties is undefined or null', () => {
    const schema1 = { additionalProperties: undefined };
    const schema2 = { additionalProperties: null };
    expect(transformAdditionalProperties(context, schema1, () => ({}) as ApiSchema)).toBeUndefined();
    expect(transformAdditionalProperties(context, schema2, () => ({}) as ApiSchema)).toBeUndefined();
  });

  it('returns a boolean value if additionalProperties is a boolean value', () => {
    const schema1 = { additionalProperties: true };
    const schema2 = { additionalProperties: false };
    expect(transformAdditionalProperties(context, schema1, () => ({}) as ApiSchema)).toBe(true);
    expect(transformAdditionalProperties(context, schema2, () => ({}) as ApiSchema)).toBe(false);
  });

  it('calls transformSchema with the additionalProperties schema if it exists', () => {
    const schema = { additionalProperties: { type: 'string' } };
    const transformSchema = fn(() => ({})) as () => ApiSchema;
    transformAdditionalProperties(context, schema, transformSchema);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.additionalProperties);
  });

  it('returns the result of calling transformSchema with the additionalProperties schema if it exists', () => {
    const schema = { additionalProperties: { type: 'string' } };
    const transformedSchema = { type: 'string' } as ApiSchema;
    const transformSchema = fn(() => transformedSchema) as () => ApiSchema;
    expect(transformAdditionalProperties(context, schema, transformSchema)).toBe(transformedSchema);
  });
});

describe('transformSchemaProperties', () => {
  const context = {} as OpenApiTransformerContext;

  it('returns an empty array if properties is undefined', () => {
    const schema = {};
    const transformSchema = fn(() => ({})) as () => ApiSchema;
    expect(transformSchemaProperties(context, schema, transformSchema).size).toEqual(0);
  });

  it('calls transformSchema with each property schema and builds an array of ApiSchemaProperties', () => {
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
    ) as (
      ctx: OpenApiTransformerContext,
      schema: ApiSchema,
    ) => ApiSchema;
    const result = transformSchemaProperties(context, schema, transformSchema);
    expect(Array.from(result.entries())).toEqual([
      ['prop1', { name: 'prop1', schema: transformedSchema1 }],
      ['prop2', { name: 'prop2', schema: transformedSchema2 }],
    ]);
    expect(transformSchema).toHaveBeenCalledTimes(2);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop1);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop2);
  });

  it('ignores properties with the name "$src"', () => {
    const schema = { properties: { prop1: { type: 'string' }, $src: { path: '/test/schema' } } };
    const transformedSchema1 = { type: 'string' } as ApiSchema;
    const transformSchema = fn(() => transformedSchema1) as () => ApiSchema;
    const result = transformSchemaProperties(context, schema, transformSchema);
    expect(Array.from(result.entries())).toEqual([['prop1', { name: 'prop1', schema: transformedSchema1 }]]);
    expect(transformSchema).toHaveBeenCalledTimes(1);
    expect(transformSchema).toHaveBeenCalledWith(context, schema.properties.prop1);
  });
});

describe('IdGenerator', () => {
  it('generates unique ids based on the provided name', () => {
    const idGenerator = new IdGenerator();
    const id1 = idGenerator.generateId('test');
    const id2 = idGenerator.generateId('test');
    expect(id1).not.toBe(id2);
  });

  it('generates ids with the format "{name}-{n}"', () => {
    const idGenerator = new IdGenerator();
    const id1 = idGenerator.generateId('test');
    expect(id1).toMatch(/^test-\d+$/);
  });

  it('increments the id number for each new id generated with the same name', () => {
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
