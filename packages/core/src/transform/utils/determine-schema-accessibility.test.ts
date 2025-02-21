import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import { determineSchemaAccessibility } from './determine-schema-accessibility.ts';

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
