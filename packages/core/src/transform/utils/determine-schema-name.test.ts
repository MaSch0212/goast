import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import type { OpenApiDocument } from '../../parse/openapi-types.ts';
import type { Deref } from '../../parse/types.ts';
import { determineSchemaName } from './determine-schema-name.ts';

test('returns the schema title if it exists', () => {
  const schema = {
    title: 'TestSchema',
    $src: { file: 'my-api.yml', path: '/test/schema', document: {} as Deref<OpenApiDocument>, originalComponent: {} },
  };
  expect(determineSchemaName(schema, 'TestId')).toEqual({
    name: 'TestSchema',
    isGenerated: false,
  });
});

test("returns the json schema file name if the schema title doesn't exist", () => {
  const schema = {
    $src: { path: '/', file: 'test.json', document: {} as Deref<OpenApiDocument>, originalComponent: {} },
  };
  expect(determineSchemaName(schema, 'TestId')).toEqual({
    name: 'test',
    isGenerated: true,
  });
});

test('returns the schema name extracted from $src.path if it starts with "/components/schemas/"', () => {
  const schema = {
    $src: {
      file: 'my-api.yml',
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

test('returns the schema name extracted from $src.path if it starts with "/definitions/"', () => {
  const schema = {
    $src: {
      file: 'my-api.yml',
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

test('returns a generated name based on the $src.path for response schemas', () => {
  const schema = {
    $src: {
      file: 'my-api.yml',
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

test('returns the provided id if no other name can be determined', () => {
  const schema = {
    $src: { file: 'my-api.yml', path: '/test/schema', document: {} as Deref<OpenApiDocument>, originalComponent: {} },
  };
  expect(determineSchemaName(schema, 'TestId')).toEqual({ name: 'TestId', isGenerated: true });
});
