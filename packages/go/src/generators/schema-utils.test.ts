import { describe, expect, it } from 'vitest';

import type { ApiSchema } from '@goast/core';

import { getGoBodyKind, getGoObjectSchema, isGoFileSchema, resolveGoSchema } from './schema-utils.ts';

/** Casts a plain object to a schema, which the helpers only read by its `kind` and keywords. */
function schema(value: Record<string, unknown>): ApiSchema {
  return value as unknown as ApiSchema;
}

describe('getGoBodyKind', () => {
  it.each([
    ['application/json', 'json'],
    ['application/problem+json', 'json'],
    ['application/x-www-form-urlencoded', 'form'],
    ['multipart/form-data', 'multipart'],
    ['text/plain', 'text'],
    ['application/octet-stream', 'raw'],
  ])('classifies %s as %s', (mediaType, kind) => {
    expect(getGoBodyKind(mediaType)).toBe(kind);
  });

  it('ignores the case of the media type', () => {
    expect(getGoBodyKind('Application/JSON')).toBe('json');
  });
});

describe('isGoFileSchema', () => {
  it('is true for a string in the binary format', () => {
    expect(isGoFileSchema(schema({ kind: 'string', format: 'binary' }))).toBe(true);
  });

  it('is false for a plain string', () => {
    expect(isGoFileSchema(schema({ kind: 'string' }))).toBe(false);
  });

  it('is false for a binary format on a non-string schema', () => {
    expect(isGoFileSchema(schema({ kind: 'integer', format: 'binary' }))).toBe(false);
  });

  it('is false when no schema is given', () => {
    expect(isGoFileSchema(undefined)).toBe(false);
    expect(isGoFileSchema(null)).toBe(false);
  });

  it('looks through a nullable file', () => {
    const file = schema({ kind: 'string', format: 'binary' });
    expect(isGoFileSchema(schema({ kind: 'oneOf', oneOf: [file, schema({ kind: 'null' })] }))).toBe(true);
  });
});

describe('resolveGoSchema', () => {
  it('returns undefined when no schema is given', () => {
    expect(resolveGoSchema(undefined)).toBeUndefined();
    expect(resolveGoSchema(null)).toBeUndefined();
  });

  it('returns a schema that is not a nullable union as is', () => {
    const string = schema({ kind: 'string' });
    expect(resolveGoSchema(string)).toBe(string);
  });

  it('unwraps a oneOf of a schema and null to the schema', () => {
    const string = schema({ kind: 'string' });
    const nullable = schema({ kind: 'oneOf', oneOf: [schema({ kind: 'null' }), string] });
    expect(resolveGoSchema(nullable)).toBe(string);
  });

  it('keeps a oneOf of two schemas that are not nullable', () => {
    const union = schema({ kind: 'oneOf', oneOf: [schema({ kind: 'string' }), schema({ kind: 'integer' })] });
    expect(resolveGoSchema(union)).toBe(union);
  });
});

describe('getGoObjectSchema', () => {
  it('returns an object schema as is', () => {
    const object = schema({ kind: 'object', properties: [], required: [], allOf: [], anyOf: [] });
    expect(getGoObjectSchema(object)).toBe(object);
  });

  it('returns the object of a nullable object', () => {
    const object = schema({ kind: 'object', properties: [], required: [], allOf: [], anyOf: [] });
    expect(getGoObjectSchema(schema({ kind: 'oneOf', oneOf: [object, schema({ kind: 'null' })] }))).toBe(object);
  });

  it('returns null for a schema that is not an object', () => {
    expect(getGoObjectSchema(schema({ kind: 'string' }))).toBeNull();
    expect(getGoObjectSchema(undefined)).toBeNull();
  });
});
