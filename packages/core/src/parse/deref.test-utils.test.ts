import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from './deref.test-utils.ts';

describe('derefAt', () => {
  it('records the path it was given in $src', () => {
    const value = derefAt('/components/schemas/Foo', { type: 'object' });
    expect(value.$src.path).toBe('/components/schemas/Foo');
    expect(value.$src.file).toBe('test.yml');
  });

  it('falls through to the $ref target for properties the value does not have', () => {
    const target = derefAt('/components/schemas/Target', { type: 'string', description: 'from target' });
    const value = derefAt('/components/schemas/Foo', { type: 'object' }, target);
    expect(value.description).toBe('from target');
    expect(value.type).toBe('object');
  });

  it('exposes the $ref target as $ref', () => {
    const target = derefAt('/components/schemas/Target', { type: 'string' });
    const value = derefAt('/components/schemas/Foo', {}, target);
    expect(value.$ref).toBe(target);
  });
});

describe('derefSchemaAt', () => {
  it('proxies nested schemas at their own sub-paths', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', {
      type: 'object',
      properties: { a: { type: 'string' } },
    });
    expect(schema.properties!.a.$src.path).toBe('/components/schemas/Foo/properties/a');
  });

  it('proxies each element of a nested schema array by index', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', {
      allOf: [{ type: 'string' }, { type: 'number' }],
    });
    expect(schema.allOf![1].$src.path).toBe('/components/schemas/Foo/allOf/1');
  });

  it('leaves a non-object nested value alone', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', { type: 'object', properties: undefined });
    expect(schema.properties).toBeUndefined();
  });

  it('proxies a doubly-nested schema (properties inside an allOf entry) at its full sub-path', () => {
    const schema = derefSchemaAt('/components/schemas/Foo', {
      allOf: [{ type: 'object', properties: { a: { type: 'string' } } }],
    });
    expect(schema.allOf![0].properties!.a.$src.path).toBe('/components/schemas/Foo/allOf/0/properties/a');
  });
});
