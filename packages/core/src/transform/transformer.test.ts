import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from '../parse/deref.test-utils.ts';
import type { OpenApiCollectorData } from '../collect/types.ts';
import type { ApiSchema } from './api-types.ts';
import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { transformOpenApi } from './transformer.ts';

// deno-lint-ignore no-explicit-any
const doc = (value: Record<string, any>) => derefAt('', value) as unknown as Deref<OpenApiDocument>;

const empty = (): OpenApiCollectorData => ({ documents: [], schemas: new Map(), endpoints: new Map() });

describe('transformOpenApi', () => {
  it('returns empty collections for empty input', () => {
    const data = transformOpenApi(empty());
    expect(data.documents).toEqual([]);
    expect(data.services).toEqual([]);
    expect(data.endpoints).toEqual([]);
    expect(data.schemas).toEqual([]);
  });

  it('passes the documents through unchanged', () => {
    const input = empty();
    const d = doc({ paths: {} });
    input.documents.push(d);

    expect(transformOpenApi(input).documents).toEqual([d]);
  });

  it('transforms every collected document into services, flattened into ApiData', () => {
    // Two documents, each with its own tag: the tags must use distinct `$src.path`s (as they would if
    // parsed from two real documents), or the dedup keyed on `getOpenApiObjectIdentifier` — file + path —
    // would collide the two proxies and defeat the point of using two separate documents.
    const input = empty();
    input.documents.push(doc({ tags: [derefAt('/documents/0/tags/0', { name: 'pets' })] }));
    input.documents.push(doc({ tags: [derefAt('/documents/1/tags/0', { name: 'store' })] }));

    expect(transformOpenApi(input).services.map((s) => s.name).sort()).toEqual(['pets', 'store']);
  });

  it('transforms every collected schema, flattened into ApiData', () => {
    const input = empty();
    input.schemas.set(
      'test.yml#/components/schemas/Foo',
      derefSchemaAt('/components/schemas/Foo', { type: 'object' }),
    );
    input.schemas.set(
      'test.yml#/components/schemas/Bar',
      derefSchemaAt('/components/schemas/Bar', { type: 'string' }),
    );

    const schemas = transformOpenApi(input).schemas;
    expect(schemas).toHaveLength(2);
    expect(schemas.map((s) => s.kind).sort()).toEqual(['object', 'string']);
  });

  it('transforms every collected endpoint, flattened into ApiData', () => {
    const input = empty();
    input.endpoints.set('test.yml#/paths/~1foo/get', {
      path: '/foo',
      method: 'get',
      pathItem: derefAt('/paths/~1foo', {}),
      operation: derefAt('/paths/~1foo/get', {}),
    });

    const data = transformOpenApi(input);
    expect(data.endpoints).toHaveLength(1);
    expect(data.endpoints[0].path).toBe('/foo');
    expect(data.endpoints[0].method).toBe('get');
  });

  it('merges the given options over the defaults, observably changing how a typeless schema is transformed', () => {
    // `defaultOpenApiTransformerOptions.unknownTypeBehavior` is `'object-if-properties'`, so a schema with
    // neither a `type` nor `properties` transforms to kind `'unknown'`. Overriding it to `'always-object'`
    // must flip that same schema to kind `'object'` — an effect observable in the returned `ApiData`,
    // not just on the (private) context `transformOpenApi` builds internally.
    const schemaAt = () => {
      const input = empty();
      input.schemas.set('test.yml#/components/schemas/Foo', derefSchemaAt('/components/schemas/Foo', {}));
      return input;
    };

    const withDefaults = transformOpenApi(schemaAt()).schemas[0];
    const withOverride = transformOpenApi(schemaAt(), { unknownTypeBehavior: 'always-object' }).schemas[0];

    expect(withDefaults.kind).toBe('unknown');
    expect(withOverride.kind).toBe('object');
    expect((withOverride as ApiSchema<'object'>).properties).toBeDefined();
  });
});
