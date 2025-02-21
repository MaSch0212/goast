import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import { getCustomFields } from './get-custom-fields.ts';

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
