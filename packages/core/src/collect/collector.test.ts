import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from '../parse/deref.test-utils.ts';
import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { collectOpenApi } from './collector.ts';

/** Wraps a plain document literal as the parser would, at the document root. */
// deno-lint-ignore no-explicit-any
function doc(value: Record<string, any>): Deref<OpenApiDocument> {
  return derefAt('', value) as unknown as Deref<OpenApiDocument>;
}

describe('collectOpenApi', () => {
  it('returns an empty result for no documents', () => {
    const data = collectOpenApi([]);
    expect(data.documents).toEqual([]);
    expect(data.schemas.size).toBe(0);
    expect(data.endpoints.size).toBe(0);
  });

  it('collects each document it is given', () => {
    const data = collectOpenApi([doc({ paths: {} }), doc({ paths: {} })]);
    expect(data.documents).toHaveLength(2);
  });

  describe('schema locations (OpenAPI 3 vs Swagger 2)', () => {
    it('collects schemas from components.schemas (OpenAPI 3)', () => {
      const data = collectOpenApi([
        doc({ components: { schemas: { Foo: derefSchemaAt('/components/schemas/Foo', { type: 'object' }) } } }),
      ]);
      expect([...data.schemas.keys()]).toEqual(['test.yml#/components/schemas/Foo']);
    });

    it('collects schemas from definitions (Swagger 2)', () => {
      const data = collectOpenApi([
        doc({ definitions: { Foo: derefSchemaAt('/definitions/Foo', { type: 'object' }) } }),
      ]);
      expect([...data.schemas.keys()]).toEqual(['test.yml#/definitions/Foo']);
    });

    it('collects both locations from one document without preferring either', () => {
      const data = collectOpenApi([
        doc({
          components: { schemas: { A: derefSchemaAt('/components/schemas/A', { type: 'object' }) } },
          definitions: { B: derefSchemaAt('/definitions/B', { type: 'object' }) },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual(['test.yml#/components/schemas/A', 'test.yml#/definitions/B']);
    });

    it('collects component-level parameters (OpenAPI 3) and top-level parameters (Swagger 2), both keyed as a map not an array', () => {
      const data = collectOpenApi([
        doc({
          components: {
            parameters: {
              A: derefAt('/components/parameters/A', {
                schema: derefSchemaAt('/components/parameters/A/schema', { type: 'string' }),
              }),
            },
          },
          parameters: {
            B: derefAt('/parameters/B', {
              schema: derefSchemaAt('/parameters/B/schema', { type: 'string' }),
            }),
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/parameters/A/schema',
        'test.yml#/parameters/B/schema',
      ]);
    });

    it('collects schemas reachable through component request bodies (OpenAPI 3 only shape)', () => {
      const data = collectOpenApi([
        doc({
          components: {
            requestBodies: {
              Body: derefAt('/components/requestBodies/Body', {
                content: {
                  'application/json': derefAt('/components/requestBodies/Body/content/application~1json', {
                    schema: derefSchemaAt(
                      '/components/requestBodies/Body/content/application~1json/schema',
                      { type: 'object' },
                    ),
                  }),
                },
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()]).toEqual([
        'test.yml#/components/requestBodies/Body/content/application~1json/schema',
      ]);
    });

    it('collects schemas from component responses (OpenAPI 3) and top-level responses (Swagger 2)', () => {
      const data = collectOpenApi([
        doc({
          components: {
            responses: {
              A: derefAt('/components/responses/A', {
                content: {
                  'application/json': derefAt('/components/responses/A/content/application~1json', {
                    schema: derefSchemaAt('/components/responses/A/content/application~1json/schema', {
                      type: 'string',
                    }),
                  }),
                },
              }),
            },
          },
          responses: {
            B: derefAt('/responses/B', {
              content: {
                'application/json': derefAt('/responses/B/content/application~1json', {
                  schema: derefSchemaAt('/responses/B/content/application~1json/schema', { type: 'string' }),
                }),
              },
            }),
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/responses/A/content/application~1json/schema',
        'test.yml#/responses/B/content/application~1json/schema',
      ]);
    });

    it('collects schemas from component headers', () => {
      const data = collectOpenApi([
        doc({
          components: {
            headers: {
              A: derefAt('/components/headers/A', {
                schema: derefSchemaAt('/components/headers/A/schema', { type: 'string' }),
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()]).toEqual(['test.yml#/components/headers/A/schema']);
    });
  });

  describe('schema recursion', () => {
    it('recurses into nested schemas via properties', () => {
      const data = collectOpenApi([
        doc({
          components: {
            schemas: {
              Foo: derefSchemaAt('/components/schemas/Foo', {
                type: 'object',
                properties: { bar: { type: 'string' } },
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/schemas/Foo',
        'test.yml#/components/schemas/Foo/properties/bar',
      ]);
    });

    it('recurses into allOf, anyOf, oneOf, items and not', () => {
      const data = collectOpenApi([
        doc({
          components: {
            schemas: {
              Foo: derefSchemaAt('/components/schemas/Foo', {
                allOf: [{ type: 'string' }],
                anyOf: [{ type: 'number' }],
                oneOf: [{ type: 'boolean' }],
                items: { type: 'object' },
                not: { type: 'null' },
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/schemas/Foo',
        'test.yml#/components/schemas/Foo/allOf/0',
        'test.yml#/components/schemas/Foo/anyOf/0',
        'test.yml#/components/schemas/Foo/items',
        'test.yml#/components/schemas/Foo/not',
        'test.yml#/components/schemas/Foo/oneOf/0',
      ]);
    });

    it('recurses into patternProperties, dependencies and a schema-level definitions map', () => {
      const data = collectOpenApi([
        doc({
          components: {
            schemas: {
              Foo: derefSchemaAt('/components/schemas/Foo', {
                patternProperties: {
                  '^x-': derefSchemaAt('/components/schemas/Foo/patternProperties/^x-', { type: 'string' }),
                },
                dependencies: {
                  bar: derefSchemaAt('/components/schemas/Foo/dependencies/bar', { type: 'string' }),
                },
                definitions: {
                  Nested: derefSchemaAt('/components/schemas/Foo/definitions/Nested', { type: 'string' }),
                },
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/schemas/Foo',
        'test.yml#/components/schemas/Foo/definitions/Nested',
        'test.yml#/components/schemas/Foo/dependencies/bar',
        'test.yml#/components/schemas/Foo/patternProperties/^x-',
      ]);
    });

    it('recurses into an object-valued additionalProperties/additionalItems but not a boolean value', () => {
      const data = collectOpenApi([
        doc({
          components: {
            schemas: {
              Foo: derefSchemaAt('/components/schemas/Foo', {
                additionalProperties: derefSchemaAt('/components/schemas/Foo/additionalProperties', {
                  type: 'string',
                }),
              }),
              Bar: derefSchemaAt('/components/schemas/Bar', { additionalProperties: false }),
              Baz: derefSchemaAt('/components/schemas/Baz', {
                additionalItems: derefSchemaAt('/components/schemas/Baz/additionalItems', { type: 'string' }),
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/schemas/Bar',
        'test.yml#/components/schemas/Baz',
        'test.yml#/components/schemas/Baz/additionalItems',
        'test.yml#/components/schemas/Foo',
        'test.yml#/components/schemas/Foo/additionalProperties',
      ]);
    });

    it('recurses into discriminator.mapping when discriminator is an object, not when it is a plain string', () => {
      const data = collectOpenApi([
        doc({
          components: {
            schemas: {
              WithMapping: derefSchemaAt('/components/schemas/WithMapping', {
                discriminator: {
                  propertyName: 'type',
                  mapping: {
                    dog: derefSchemaAt('/components/schemas/WithMapping/discriminator/mapping/dog', {
                      type: 'object',
                    }),
                  },
                },
              }),
              WithStringDiscriminator: derefSchemaAt('/components/schemas/WithStringDiscriminator', {
                discriminator: 'type',
              }),
            },
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/components/schemas/WithMapping',
        'test.yml#/components/schemas/WithMapping/discriminator/mapping/dog',
        'test.yml#/components/schemas/WithStringDiscriminator',
      ]);
    });

    it('keeps the first schema seen at a given key and does not overwrite it with a later one', () => {
      // Two distinct schema objects that happen to share a $src.path, the way a $ref target and one of
      // its dereferenced copies would. Whichever is handed to collectSchema first should win; the guard
      // is `if (data.schemas.has(key)) return`, so the second must never replace the first.
      const first = derefSchemaAt('/components/schemas/Foo', { type: 'string' });
      const second = derefSchemaAt('/components/schemas/Foo', { type: 'number' });
      const a = derefSchemaAt('/components/schemas/A', { type: 'object', properties: {} });
      (a.properties as Record<string, unknown>).bar = second;

      const data = collectOpenApi([
        doc({ components: { schemas: { Foo: first, A: a } } }),
      ]);

      expect(data.schemas.size).toBe(2);
      expect(data.schemas.get('test.yml#/components/schemas/Foo')).toBe(first);
      expect(data.schemas.get('test.yml#/components/schemas/Foo')).not.toBe(second);
    });

    it('terminates on a self-referential schema', () => {
      // deno-lint-ignore no-explicit-any
      const node: any = { type: 'object', properties: {} };
      const proxied = derefSchemaAt('/components/schemas/Node', node);
      // Point the schema at itself after proxying, which is the shape a $ref cycle produces.
      (proxied.properties as Record<string, unknown>).self = proxied;

      const data = collectOpenApi([doc({ components: { schemas: { Node: proxied } } })]);
      expect(data.schemas.size).toBe(1);
    });
  });

  describe('endpoint collection', () => {
    it('collects one endpoint per HTTP method present on a path item', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a': derefAt('/paths/~1a', {
              get: derefAt('/paths/~1a/get', { responses: {} }),
              put: derefAt('/paths/~1a/put', { responses: {} }),
              post: derefAt('/paths/~1a/post', { responses: {} }),
              delete: derefAt('/paths/~1a/delete', { responses: {} }),
              options: derefAt('/paths/~1a/options', { responses: {} }),
              head: derefAt('/paths/~1a/head', { responses: {} }),
              patch: derefAt('/paths/~1a/patch', { responses: {} }),
              trace: derefAt('/paths/~1a/trace', { responses: {} }),
            }),
          },
        }),
      ]);
      expect([...data.endpoints.values()].map((e) => e.method).sort()).toEqual([
        'delete',
        'get',
        'head',
        'options',
        'patch',
        'post',
        'put',
        'trace',
      ]);
    });

    it('records the path and method it found an operation under', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a/{id}': derefAt('/paths/~1a~1{id}', { get: derefAt('/paths/~1a~1{id}/get', { responses: {} }) }),
          },
        }),
      ]);
      const endpoint = [...data.endpoints.values()][0];
      expect(endpoint.path).toBe('/a/{id}');
      expect(endpoint.method).toBe('get');
    });

    it('ignores a method key that is not set', () => {
      const data = collectOpenApi([
        doc({ paths: { '/a': derefAt('/paths/~1a', { get: undefined, summary: 'nothing here' }) } }),
      ]);
      expect(data.endpoints.size).toBe(0);
    });

    it('skips an operation whose key has already been collected, keeping the first path it was found under', () => {
      // The same operation object (so the same $src.file/$src.path, hence the same key) reachable from
      // two different paths across two documents. Only the first sighting should be recorded.
      const op = derefAt('/paths/~1a/get', { responses: {} });
      const data = collectOpenApi([
        doc({ paths: { '/a': derefAt('/paths/~1a', { get: op }) } }),
        doc({ paths: { '/b': derefAt('/paths/~1b', { get: op }) } }),
      ]);
      expect(data.endpoints.size).toBe(1);
      expect([...data.endpoints.values()][0].path).toBe('/a');
    });

    it('does not skip an operation carrying x-ignore: the per-method loop reads pathItem[method] directly, bypassing the collect()/collectRecord() ignore check', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a': derefAt('/paths/~1a', {
              get: derefAt('/paths/~1a/get', { responses: {}, 'x-ignore': true }),
            }),
          },
        }),
      ]);
      expect(data.endpoints.size).toBe(1);
    });

    it('collects schemas reachable from a path-item-level parameter and an operation-level parameter, request body and response', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a': derefAt('/paths/~1a', {
              parameters: [
                derefAt('/paths/~1a/parameters/0', {
                  schema: derefSchemaAt('/paths/~1a/parameters/0/schema', { type: 'string' }),
                }),
              ],
              get: derefAt('/paths/~1a/get', {
                parameters: [
                  derefAt('/paths/~1a/get/parameters/0', {
                    schema: derefSchemaAt('/paths/~1a/get/parameters/0/schema', { type: 'string' }),
                  }),
                ],
                requestBody: derefAt('/paths/~1a/get/requestBody', {
                  content: {
                    'application/json': derefAt('/paths/~1a/get/requestBody/content/application~1json', {
                      schema: derefSchemaAt(
                        '/paths/~1a/get/requestBody/content/application~1json/schema',
                        { type: 'object' },
                      ),
                    }),
                  },
                }),
                responses: {
                  '200': derefAt('/paths/~1a/get/responses/200', {
                    content: {
                      'application/json': derefAt('/paths/~1a/get/responses/200/content/application~1json', {
                        schema: derefSchemaAt(
                          '/paths/~1a/get/responses/200/content/application~1json/schema',
                          { type: 'object' },
                        ),
                      }),
                    },
                  }),
                },
              }),
            }),
          },
        }),
      ]);
      expect([...data.schemas.keys()].sort()).toEqual([
        'test.yml#/paths/~1a/get/parameters/0/schema',
        'test.yml#/paths/~1a/get/requestBody/content/application~1json/schema',
        'test.yml#/paths/~1a/get/responses/200/content/application~1json/schema',
        'test.yml#/paths/~1a/parameters/0/schema',
      ]);
    });
  });

  describe('bare JSON Schema documents', () => {
    it('collects the document itself as a schema when it looks like a bare JSON Schema', () => {
      const data = collectOpenApi([doc({ type: 'object', properties: {} })]);
      expect([...data.schemas.keys()]).toEqual(['test.yml#']);
    });

    it('does not collect an ordinary OpenAPI document as a schema', () => {
      const data = collectOpenApi([doc({ openapi: '3.0.0', paths: {} })]);
      expect(data.schemas.size).toBe(0);
    });

    it('treats title alone as enough to make a document a schema', () => {
      const data = collectOpenApi([doc({ title: 'Just a title' })]);
      expect(data.schemas.size).toBe(1);
    });
  });

  describe('response header schema-or-header discrimination', () => {
    // The brief describes this branch as "a header with a `type` is read as a schema, an OpenAPI 3
    // header is read as a header" — implying `collectResponse` inspects each *named* header. It does
    // not: `collect(data, responses.headers, ...)` (collector.ts line ~128) hands the whole `headers`
    // record to `collect()`, which treats any non-array, non-nullish value as a single item and calls
    // the callback with it directly. `collectRecord()` — the helper that actually iterates a
    // `Record<string, T>` by key — is never used here. So `isSchema`/`collectHeader` run once, against
    // the headers *map itself*, never against an individual named header. See Task 12.

    it('does not collect an ordinarily-named response header at all: the headers record is examined as a whole, not per name', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a': derefAt('/paths/~1a', {
              get: derefAt('/paths/~1a/get', {
                responses: {
                  '200': derefAt('/paths/~1a/get/responses/200', {
                    headers: {
                      'X-Rate': derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate', { type: 'integer' }),
                    },
                  }),
                },
              }),
            }),
          },
        }),
      ]);
      // A literal reading of the brief would expect this key to be present; it is not, because the
      // header named "X-Rate" is never individually inspected.
      expect(data.schemas.size).toBe(0);
    });

    it('does not collect an OpenAPI 3 style header schema either, for the same reason', () => {
      const data = collectOpenApi([
        doc({
          paths: {
            '/a': derefAt('/paths/~1a', {
              get: derefAt('/paths/~1a/get', {
                responses: {
                  '200': derefAt('/paths/~1a/get/responses/200', {
                    headers: {
                      'X-Rate': derefAt('/paths/~1a/get/responses/200/headers/X-Rate', {
                        schema: derefSchemaAt(
                          '/paths/~1a/get/responses/200/headers/X-Rate/schema',
                          { type: 'integer' },
                        ),
                      }),
                    },
                  }),
                },
              }),
            }),
          },
        }),
      ]);
      expect(data.schemas.size).toBe(0);
    });

    it('crashes when a header happens to be named "type": the whole headers record is then misread as a schema and collectSchema dereferences its missing $src', () => {
      // This is the pathological flip side of the same defect: `isSchema` runs against the headers
      // record, not a header. If the record's *own* keys happen to include "type" (i.e. a header is
      // literally named "type"), `isSchema` returns true for the record itself, and `collectSchema` is
      // called with the plain headers object, which has no `$src` — collector.ts:79 then throws.
      expect(() =>
        collectOpenApi([
          doc({
            paths: {
              '/a': derefAt('/paths/~1a', {
                get: derefAt('/paths/~1a/get', {
                  responses: {
                    '200': derefAt('/paths/~1a/get/responses/200', {
                      headers: {
                        type: derefSchemaAt('/paths/~1a/get/responses/200/headers/type', { type: 'integer' }),
                      },
                    }),
                  },
                }),
              }),
            },
          }),
        ])
      ).toThrow(TypeError);
    });
  });
});
