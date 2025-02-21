import { expect } from '@std/expect/expect';
import { test } from '@std/testing/bdd';
import { IdGenerator } from './id-generator.ts';

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
