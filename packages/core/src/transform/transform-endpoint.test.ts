import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt, derefSchemaAt } from '../parse/deref.test-utils.ts';
import { createTransformerContext } from './transform.test-utils.ts';

import type { OpenApiCollectorEndpointInfo } from '../collect/types.ts';
import { transformEndpoint } from './transform-endpoint.ts';

/** Builds the collector's endpoint info for one operation on one path. */
function endpointInfo(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete',
  // deno-lint-ignore no-explicit-any
  operation: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  pathItem: Record<string, any> = {},
): OpenApiCollectorEndpointInfo {
  const escaped = path.replace(/\//g, '~1');
  return {
    path,
    method,
    pathItem: derefAt(`/paths/${escaped}`, pathItem),
    operation: derefAt(`/paths/${escaped}/${method}`, operation),
    // deno-lint-ignore no-explicit-any
  } as any;
}

/**
 * Like {@link endpointInfo}, but takes an already-built `pathItem` proxy instead of wrapping a fresh
 * literal at a path derived from `path`. Needed whenever a test has to share one literal `pathItem`
 * object (or point two different `pathItem`s at the same `$ref` target) across two different top-level
 * paths — something `endpointInfo`'s signature cannot express, since it always builds a brand new proxy
 * keyed by the `path` argument itself.
 */
function rawEndpointInfo(
  path: string,
  method: 'get' | 'post' | 'put' | 'delete',
  // deno-lint-ignore no-explicit-any
  pathItem: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  operation: Record<string, any>,
): OpenApiCollectorEndpointInfo {
  const escaped = path.replace(/\//g, '~1');
  return {
    path,
    method,
    pathItem,
    operation: derefAt(`/paths/${escaped}/${method}`, operation),
    // deno-lint-ignore no-explicit-any
  } as any;
}

describe('transformEndpoint', () => {
  it('transforms a minimal operation', () => {
    const context = createTransformerContext();
    const endpoint = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'listPets' }));

    expect(endpoint.name).toBe('listPets');
    expect(endpoint.path).toBe('/pets');
    expect(endpoint.method).toBe('get');
    expect(endpoint.deprecated).toBe(false);
    expect(endpoint.tags).toEqual([]);
    expect(endpoint.parameters).toEqual([]);
    expect(endpoint.requestBody).toBeUndefined();
    expect(endpoint.responses).toEqual([]);
  });

  describe('service attachment', () => {
    it('attaches the endpoint to one service per tag', () => {
      const context = createTransformerContext();
      transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a', tags: ['pets', 'store'] }));

      expect([...context.services.keys()].sort()).toEqual(['pets', 'store']);
      expect(context.services.get('pets')!.endpoints).toHaveLength(1);
      expect(context.services.get('store')!.endpoints).toHaveLength(1);
    });

    it('creates a service under the empty tag for an untagged operation, named after its id', () => {
      const context = createTransformerContext();
      transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));

      expect([...context.services.keys()]).toEqual(['']);
      const service = context.services.get('')!;
      expect(service.name).toBe(service.id);
    });

    it('reuses a service created by an earlier endpoint', () => {
      const context = createTransformerContext();
      transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', tags: ['pets'] }));
      transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', tags: ['pets'] }));

      expect(context.services.size).toBe(1);
      expect(context.services.get('pets')!.endpoints).toHaveLength(2);
    });

    // The object literal at transform-endpoint.ts:60 (the implicit, tag-less service) omits `$src` entirely,
    // while `transformTag` in transform-document.ts sets it. This is a real inconsistency: a consumer that
    // reads `service.$src.file` unconditionally crashes for a service that was never backed by a tag object.
    // Recorded for Task 12.
    it('creates the implicit service without a $src, unlike a tag-derived service', () => {
      const context = createTransformerContext();
      transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
      expect(context.services.get('')!.$src).toBeUndefined();
    });
  });

  describe('path transformation', () => {
    it('records the endpoint on its path under the method key', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));

      expect(context.paths.get('/pets')!.get).toBe(endpoint);
      expect(endpoint.pathInfo.path).toBe('/pets');
    });

    it('reuses one ApiPath for two methods on the same path', () => {
      const context = createTransformerContext();
      const get = transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
      const post = transformEndpoint(context, endpointInfo('/pets', 'post', { operationId: 'b' }));

      expect(post.pathInfo).toBe(get.pathInfo);
      expect(context.paths.size).toBe(1);
      expect(context.paths.get('/pets')!.get).toBe(get);
      expect(context.paths.get('/pets')!.post).toBe(post);
    });

    it('keys endpoints by method and path', () => {
      const context = createTransformerContext();
      transformEndpoint(context, endpointInfo('/pets', 'get', { operationId: 'a' }));
      transformEndpoint(context, endpointInfo('/pets', 'post', { operationId: 'b' }));

      expect([...context.endpoints.keys()].sort()).toEqual(['get:/pets', 'post:/pets']);
    });

    // `transformApiPath` has two caches: `context.paths`, keyed by the path *string*, and
    // `context.transformed.paths`, keyed by the pathItem's own `$src` identifier. "Reuses one ApiPath
    // for two methods on the same path" above cannot separate them, because both `get` and `post` on
    // `/pets` share one real `pathItem` object built at the same `derefAt` path — exactly like a real
    // OpenAPI document, where one path item carries every HTTP method. To actually tell the two caches
    // apart, share one `pathItem` object across two *different* top-level path strings, which requires
    // bypassing `endpointInfo()`'s own per-call `derefAt` wrapping (see `rawEndpointInfo`).
    it('separates the two path caches: one pathItem object reused under two different path strings', () => {
      const context = createTransformerContext();
      const pathItem = derefAt('/paths/~1pets', {});

      const a = transformEndpoint(context, rawEndpointInfo('/pets', 'get', pathItem, { operationId: 'a' }));
      const b = transformEndpoint(context, rawEndpointInfo('/pets-alias', 'get', pathItem, { operationId: 'b' }));

      // `transformApiPath` only writes to `context.paths` on a genuine miss in *both* caches (see the
      // `if (!isReference) context.paths.set(path, apiPath)` line, reached only after falling through
      // both `if (existingPath) return` and `if (existing) return`). Endpoint `a` is a full miss and
      // registers '/pets'. Endpoint `b` misses `context.paths` (different string) but HITS
      // `context.transformed.paths` on the pathItem's shared identifier, and that early return happens
      // *before* the line that would have registered '/pets-alias'. So `context.paths` ends up with
      // exactly the one entry `a` made — '/pets-alias' is never recorded there at all.
      expect(context.paths.size).toBe(1);
      expect(context.paths.has('/pets-alias')).toBe(false);
      // `context.transformed.paths`, keyed by the pathItem's own identifier, built exactly one ApiPath,
      // and that's the object both endpoints share — this is the cache that actually did the work here.
      expect(context.transformed.paths.size).toBe(1);
      expect(a.pathInfo).toBe(b.pathInfo);

      // Pinned, not fixed: `apiPath.path` is set once, from whichever path string got there first, and
      // is never revisited on a `transformed.paths` cache hit. So `b.pathInfo.path` reads '/pets', not
      // '/pets-alias' — the endpoint's own real path. This is a plausible latent bug for OpenAPI 3.1's
      // Referenced Path Item Object feature: a document with
      // `paths: { '/pets': {...}, '/pets-alias': { $ref: '#/paths/~1pets' } }` would produce an ApiPath
      // for '/pets-alias' whose `.path` field says '/pets'. Recorded for Task 12; not fixed here, since
      // fixing it would change generated output.
      expect(b.pathInfo.path).toBe('/pets');
    });
  });

  describe('parameter combination', () => {
    it('inherits path-level parameters', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/pets/{id}', 'get', { operationId: 'a' }, {
          parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path', required: true })],
        }),
      );

      expect(endpoint.parameters.map((p) => p.name)).toEqual(['id']);
      expect(endpoint.parameters[0].target).toBe('path');
      expect(endpoint.parameters[0].required).toBe(true);
    });

    it('appends an operation parameter that does not shadow a path parameter', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/pets/{id}', 'get', {
          operationId: 'a',
          parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'limit', in: 'query' })],
        }, {
          parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path' })],
        }),
      );

      expect(endpoint.parameters.map((p) => p.name)).toEqual(['id', 'limit']);
    });

    it('lets an operation parameter replace a path parameter with the same name in the same position', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/pets/{id}', 'get', {
          operationId: 'a',
          parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'id', in: 'path', description: 'op' })],
        }, {
          parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path', description: 'path' })],
        }),
      );

      expect(endpoint.parameters).toHaveLength(1);
      expect(endpoint.parameters[0].description).toBe('op');
    });

    it('replaces a path parameter with a same-named operation parameter in a DIFFERENT position', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/pets/{id}', 'get', {
          operationId: 'a',
          parameters: [derefAt('/paths/~1pets~1{id}/get/parameters/0', { name: 'id', in: 'query' })],
        }, {
          parameters: [derefAt('/paths/~1pets~1{id}/parameters/0', { name: 'id', in: 'path' })],
        }),
      );

      // combineParameters matches on `name` alone, so the query parameter displaces the path parameter and
      // the path parameter is lost — for `/pets/{id}` that means the generated signature has no `id` path
      // argument at all. OpenAPI identifies a parameter by (name, in), not by name.
      expect(endpoint.parameters).toHaveLength(1);
      expect(endpoint.parameters[0].target).toBe('query');
    });
  });

  describe('responses', () => {
    it('parses a numeric status code', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: { '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok' }) },
        }),
      );

      expect(endpoint.responses).toHaveLength(1);
      expect(endpoint.responses[0].statusCode).toBe(200);
      expect(endpoint.responses[0].description).toBe('ok');
    });

    it('leaves statusCode undefined for the default response', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: { default: derefAt('/paths/~1a/get/responses/default', { description: 'fallback' }) },
        }),
      );

      expect(endpoint.responses[0].statusCode).toBeUndefined();
    });

    it('leaves statusCode undefined for a range code such as 2XX', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: { '2XX': derefAt('/paths/~1a/get/responses/2XX', { description: 'any success' }) },
        }),
      );

      expect(endpoint.responses[0].statusCode).toBeUndefined();
    });

    // `Number('0') || undefined` is also `undefined` (`0` is falsy) — a genuine status code that
    // coerces to the same "no status code" bucket as `default` and a wildcard range.
    it('also leaves statusCode undefined for the numeric string "0"', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: { '0': derefAt('/paths/~1a/get/responses/0', { description: 'weird' }) },
        }),
      );

      expect(endpoint.responses[0].statusCode).toBeUndefined();
    });

    // This pins the brief's literal scenario: wrapping the whole `responses` record in a deref proxy
    // and asserting that `$src`/`$ref` are not read back as status codes. It passes — but not for the
    // reason the brief states. `Object.keys()` on a proxy only reports a key when the proxy's
    // `getOwnPropertyDescriptor` (falling back to the target here, since deref-proxy.ts defines no such
    // trap) returns a descriptor for it. `$src`/`$ref` are synthesized only by the `get` trap and the
    // `ownKeys` trap; the target object never actually owns them, so `Object.keys()` never yields them
    // regardless of `isOpenApiObjectProperty`. Confirmed empirically (see task-10-report.md) and by
    // mutation-testing `transformResponses`: removing the `isOpenApiObjectProperty(status)` guard does
    // not make this test fail. The genuine, guard-dependent test is the one below it, which uses a
    // real `x-` vendor extension key that *is* a real own property of the underlying plain object.
    it('does not treat the proxy $src and $ref keys as status codes', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: derefAt('/paths/~1a/get/responses', {
            '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok' }),
          }),
        }),
      );

      expect(endpoint.responses).toHaveLength(1);
    });

    // Unlike the `$src`/`$ref` case above, `x-count` here is a real, enumerable, own property of the
    // plain `responses` object literal — exactly what `isOpenApiObjectProperty` is there to filter.
    // Mutation-tested: removing the guard turns this into a 2-response result.
    it('does not treat an x- vendor extension key on the responses object as a status code', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok' }),
            'x-count': 1,
          },
        }),
      );

      expect(endpoint.responses).toHaveLength(1);
    });
  });

  describe('content, request bodies and headers', () => {
    it('transforms request body content by media type', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', {
            required: true,
            content: {
              'application/json': derefAt('/paths/~1a/post/requestBody/content/application~1json', {
                schema: derefSchemaAt('/paths/~1a/post/requestBody/content/application~1json/schema', {
                  type: 'object',
                }),
              }),
            },
          }),
        }),
      );

      expect(endpoint.requestBody!.required).toBe(true);
      expect(endpoint.requestBody!.content).toHaveLength(1);
      expect(endpoint.requestBody!.content[0].type).toBe('application/json');
      expect(endpoint.requestBody!.content[0].schema).toBeDefined();
    });

    // Every response fixture elsewhere in this file only sets `description`/`headers` — the response's
    // own `content` field (transformResponse's `contentOptions: transformContent(context, response.content)`
    // line) was otherwise only ever exercised indirectly, through the request-body call site.
    it('transforms response content by media type', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', {
              description: 'ok',
              content: {
                'application/json': derefAt('/paths/~1a/get/responses/200/content/application~1json', {
                  schema: derefSchemaAt('/paths/~1a/get/responses/200/content/application~1json/schema', {
                    type: 'object',
                  }),
                }),
              },
            }),
          },
        }),
      );

      expect(endpoint.responses[0].contentOptions).toHaveLength(1);
      expect(endpoint.responses[0].contentOptions[0].type).toBe('application/json');
      expect(endpoint.responses[0].contentOptions[0].schema).toBeDefined();
    });

    // transformParameter's `schema ? transformSchema(...) : undefined` truthy branch — every parameter
    // fixture elsewhere in this file omits `schema` entirely.
    it('transforms a parameter schema when present', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          parameters: [
            derefAt('/paths/~1a/get/parameters/0', {
              name: 'limit',
              in: 'query',
              schema: derefSchemaAt('/paths/~1a/get/parameters/0/schema', { type: 'integer' }),
            }),
          ],
        }),
      );

      expect(endpoint.parameters[0].schema).toBeDefined();
    });

    // transformMediaType's falsy branch — every media-type fixture elsewhere in this file has a schema.
    it('leaves ApiContent.schema undefined when the media type has no schema', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', {
            content: {
              'application/json': derefAt('/paths/~1a/post/requestBody/content/application~1json', {}),
            },
          }),
        }),
      );

      expect(endpoint.requestBody!.content[0].schema).toBeUndefined();
    });

    it('defaults requestBody.required to false', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', { content: {} }),
        }),
      );

      expect(endpoint.requestBody!.required).toBe(false);
    });

    it('transforms an OpenAPI 3 response header', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', {
              description: 'ok',
              headers: {
                'X-Rate': derefAt('/paths/~1a/get/responses/200/headers/X-Rate', {
                  required: true,
                  schema: derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate/schema', { type: 'integer' }),
                }),
              },
            }),
          },
        }),
      );

      const header = endpoint.responses[0].headers[0];
      expect(header.name).toBe('X-Rate');
      expect(header.required).toBe(true);
      expect(header.schema).toBeDefined();
    });

    it('transforms a Swagger 2 response header, which is a bare schema, as not required', () => {
      const context = createTransformerContext();
      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', {
              description: 'ok',
              headers: {
                'X-Rate': derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate', { type: 'integer' }),
              },
            }),
          },
        }),
      );

      const header = endpoint.responses[0].headers[0];
      expect(header.name).toBe('X-Rate');
      expect(header.required).toBe(false);
      expect(header.schema).toBeDefined();
    });
  });

  describe('$ref recursion', () => {
    // Each of the six nested transforms carries an `X.$ref ? transformX(...) : undefined` branch. No
    // fixture anywhere else in this file ever passes a `ref` argument to `derefAt`/`derefSchemaAt`, so
    // that branch was previously untested for all six — even though `$ref`-based reuse is the primary
    // real-world reason objects get deduped by identity, which is what this whole file is about. Every
    // fixture below gets its own `$src.path`, and the ref target gets a path distinct from the object
    // that points at it, per the derefAt path-collision hazard.

    it('recurses into a $ref path item, populating pathInfo.$ref', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/pathItems/Shared', {});
      const pathItem = derefAt('/paths/~1a', {}, target);

      const endpoint = transformEndpoint(context, rawEndpointInfo('/a', 'get', pathItem, { operationId: 'a' }));

      expect(endpoint.pathInfo.$ref).toBeDefined();
      expect(endpoint.pathInfo.$ref!.$src.path).toBe('/components/pathItems/Shared');
    });

    it('dedups the $ref target of a path item shared by two different paths', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/pathItems/Shared', {});
      const pathItemA = derefAt('/paths/~1a', {}, target);
      const pathItemB = derefAt('/paths/~1b', {}, target);

      const a = transformEndpoint(context, rawEndpointInfo('/a', 'get', pathItemA, { operationId: 'a' }));
      const b = transformEndpoint(context, rawEndpointInfo('/b', 'get', pathItemB, { operationId: 'b' }));

      expect(a.pathInfo.$ref).toBeDefined();
      expect(a.pathInfo.$ref).toBe(b.pathInfo.$ref);
    });

    it('does not dedup two different $ref path item targets', () => {
      const context = createTransformerContext();
      const targetA = derefAt('/components/pathItems/A', {});
      const targetB = derefAt('/components/pathItems/B', {});
      const pathItemA = derefAt('/paths/~1a', {}, targetA);
      const pathItemB = derefAt('/paths/~1b', {}, targetB);

      const a = transformEndpoint(context, rawEndpointInfo('/a', 'get', pathItemA, { operationId: 'a' }));
      const b = transformEndpoint(context, rawEndpointInfo('/b', 'get', pathItemB, { operationId: 'b' }));

      expect(a.pathInfo.$ref).not.toBe(b.pathInfo.$ref);
    });

    it('recurses into a $ref parameter, populating $ref on the result', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/parameters/Shared', { name: 'limit', in: 'query' });
      const param = derefAt('/paths/~1a/get/parameters/0', { name: 'limit', in: 'query' }, target);

      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', { operationId: 'a', parameters: [param] }),
      );

      expect(endpoint.parameters[0].$ref).toBeDefined();
      expect(endpoint.parameters[0].$ref!.$src.path).toBe('/components/parameters/Shared');
    });

    it('dedups the $ref target of a parameter shared by two different parameters', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/parameters/Shared', { name: 'limit', in: 'query' });
      const paramA = derefAt('/paths/~1a/get/parameters/0', { name: 'limit', in: 'query' }, target);
      const paramB = derefAt('/paths/~1b/get/parameters/0', { name: 'limit', in: 'query' }, target);

      const a = transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', parameters: [paramA] }));
      const b = transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', parameters: [paramB] }));

      expect(a.parameters[0].$ref).toBeDefined();
      expect(a.parameters[0].$ref).toBe(b.parameters[0].$ref);
    });

    it('does not dedup two different $ref parameter targets', () => {
      const context = createTransformerContext();
      const targetA = derefAt('/components/parameters/A', { name: 'limit', in: 'query' });
      const targetB = derefAt('/components/parameters/B', { name: 'limit', in: 'query' });
      const paramA = derefAt('/paths/~1a/get/parameters/0', { name: 'limit', in: 'query' }, targetA);
      const paramB = derefAt('/paths/~1b/get/parameters/0', { name: 'limit', in: 'query' }, targetB);

      const a = transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', parameters: [paramA] }));
      const b = transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', parameters: [paramB] }));

      expect(a.parameters[0].$ref).not.toBe(b.parameters[0].$ref);
    });

    it('recurses into a $ref request body, populating $ref on the result', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/requestBodies/Shared', { required: true, content: {} });
      const requestBody = derefAt('/paths/~1a/post/requestBody', {}, target);

      const endpoint = transformEndpoint(context, endpointInfo('/a', 'post', { operationId: 'a', requestBody }));

      expect(endpoint.requestBody!.$ref).toBeDefined();
      expect(endpoint.requestBody!.$ref!.$src.path).toBe('/components/requestBodies/Shared');
    });

    it('recurses into a $ref response, populating $ref on the result', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/responses/Shared', { description: 'shared' });
      const response = derefAt('/paths/~1a/get/responses/200', {}, target);

      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', { operationId: 'a', responses: { '200': response } }),
      );

      expect(endpoint.responses[0].$ref).toBeDefined();
      expect(endpoint.responses[0].$ref!.$src.path).toBe('/components/responses/Shared');
    });

    it('recurses into a $ref media type, populating $ref on the result', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/mediaTypes/Shared', {
        schema: derefSchemaAt('/components/mediaTypes/Shared/schema', { type: 'object' }),
      });
      const mediaType = derefAt('/paths/~1a/post/requestBody/content/application~1json', {}, target);

      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', { content: { 'application/json': mediaType } }),
        }),
      );

      expect(endpoint.requestBody!.content[0].$ref).toBeDefined();
      expect(endpoint.requestBody!.content[0].$ref!.$src.path).toBe('/components/mediaTypes/Shared');
    });

    it('recurses into a $ref header, populating $ref on the result', () => {
      const context = createTransformerContext();
      const target = derefAt('/components/headers/Shared', {
        required: true,
        schema: derefSchemaAt('/components/headers/Shared/schema', { type: 'integer' }),
      });
      const header = derefAt('/paths/~1a/get/responses/200/headers/X-Rate', {}, target);

      const endpoint = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok', headers: { 'X-Rate': header } }),
          },
        }),
      );

      const h = endpoint.responses[0].headers[0];
      expect(h.$ref).toBeDefined();
      expect(h.$ref!.$src.path).toBe('/components/headers/Shared');
    });
  });

  describe('dedup maps', () => {
    // Each pair below proves both directions per fixture: the same source object collapses to one
    // transformed instance (the production dedup), and two structurally-similar-but-distinct source
    // objects (different `$src.path`, since `derefAt` fixes `file` to `'test.yml'`) do NOT collapse.
    // Without the second half, a passing "same identifier collapses" test cannot distinguish real
    // `transformed.*` dedup from two fixtures accidentally colliding on path.

    it('returns the same ApiParameter for one source parameter used by two operations', () => {
      const context = createTransformerContext();
      const shared = derefAt('/components/parameters/Limit', { name: 'limit', in: 'query' });

      const a = transformEndpoint(context, endpointInfo('/a', 'get', { operationId: 'a', parameters: [shared] }));
      const b = transformEndpoint(context, endpointInfo('/b', 'get', { operationId: 'b', parameters: [shared] }));

      expect(b.parameters[0]).toBe(a.parameters[0]);
      expect(context.transformed.parameters.size).toBe(1);
    });

    it('does not dedup two different parameters, even with the same name and target', () => {
      const context = createTransformerContext();
      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          parameters: [derefAt('/paths/~1a/get/parameters/0', { name: 'limit', in: 'query' })],
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'get', {
          operationId: 'b',
          parameters: [derefAt('/paths/~1b/get/parameters/0', { name: 'limit', in: 'query' })],
        }),
      );

      expect(b.parameters[0]).not.toBe(a.parameters[0]);
      expect(context.transformed.parameters.size).toBe(2);
    });

    it('returns the same ApiContent for one shared media type used by two operations', () => {
      const context = createTransformerContext();
      const shared = derefAt('/components/requestBodies/Shared/content/application~1json', {
        schema: derefSchemaAt('/components/requestBodies/Shared/content/application~1json/schema', {
          type: 'object',
        }),
      });

      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', { content: { 'application/json': shared } }),
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'post', {
          operationId: 'b',
          requestBody: derefAt('/paths/~1b/post/requestBody', { content: { 'application/json': shared } }),
        }),
      );

      expect(b.requestBody!.content[0]).toBe(a.requestBody!.content[0]);
      expect(context.transformed.content.size).toBe(1);
    });

    it('does not dedup two different media types, even with the same type string', () => {
      const context = createTransformerContext();
      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', {
            content: {
              'application/json': derefAt('/paths/~1a/post/requestBody/content/application~1json', {
                schema: derefSchemaAt('/paths/~1a/post/requestBody/content/application~1json/schema', {
                  type: 'object',
                }),
              }),
            },
          }),
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'post', {
          operationId: 'b',
          requestBody: derefAt('/paths/~1b/post/requestBody', {
            content: {
              'application/json': derefAt('/paths/~1b/post/requestBody/content/application~1json', {
                schema: derefSchemaAt('/paths/~1b/post/requestBody/content/application~1json/schema', {
                  type: 'object',
                }),
              }),
            },
          }),
        }),
      );

      expect(b.requestBody!.content[0]).not.toBe(a.requestBody!.content[0]);
      expect(context.transformed.content.size).toBe(2);
    });

    it('returns the same ApiRequestBody for one shared request body used by two operations', () => {
      const context = createTransformerContext();
      const shared = derefAt('/components/requestBodies/Shared', { required: true, content: {} });

      const a = transformEndpoint(context, endpointInfo('/a', 'post', { operationId: 'a', requestBody: shared }));
      const b = transformEndpoint(context, endpointInfo('/b', 'post', { operationId: 'b', requestBody: shared }));

      expect(b.requestBody).toBe(a.requestBody);
      expect(context.transformed.requestBodies.size).toBe(1);
    });

    it('does not dedup two different request bodies', () => {
      const context = createTransformerContext();
      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'post', {
          operationId: 'a',
          requestBody: derefAt('/paths/~1a/post/requestBody', { required: true, content: {} }),
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'post', {
          operationId: 'b',
          requestBody: derefAt('/paths/~1b/post/requestBody', { required: true, content: {} }),
        }),
      );

      expect(b.requestBody).not.toBe(a.requestBody);
      expect(context.transformed.requestBodies.size).toBe(2);
    });

    it('returns the same ApiResponse for one shared response used by two operations', () => {
      const context = createTransformerContext();
      const shared = derefAt('/components/responses/NotFound', { description: 'missing' });

      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'get', { operationId: 'a', responses: { '404': shared } }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'get', { operationId: 'b', responses: { '404': shared } }),
      );

      expect(b.responses[0]).toBe(a.responses[0]);
      expect(context.transformed.responses.size).toBe(1);
    });

    it('does not dedup two different responses, even with the same status code', () => {
      const context = createTransformerContext();
      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: { '404': derefAt('/paths/~1a/get/responses/404', { description: 'missing' }) },
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'get', {
          operationId: 'b',
          responses: { '404': derefAt('/paths/~1b/get/responses/404', { description: 'missing' }) },
        }),
      );

      expect(b.responses[0]).not.toBe(a.responses[0]);
      expect(context.transformed.responses.size).toBe(2);
    });

    it('returns the same ApiHeader for one shared header used by two operations', () => {
      const context = createTransformerContext();
      const shared = derefAt('/components/headers/RateLimit', {
        required: true,
        schema: derefSchemaAt('/components/headers/RateLimit/schema', { type: 'integer' }),
      });

      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', { description: 'ok', headers: { 'X-Rate': shared } }),
          },
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'get', {
          operationId: 'b',
          responses: {
            '200': derefAt('/paths/~1b/get/responses/200', { description: 'ok', headers: { 'X-Rate': shared } }),
          },
        }),
      );

      expect(b.responses[0].headers[0]).toBe(a.responses[0].headers[0]);
      expect(context.transformed.headers.size).toBe(1);
    });

    it('does not dedup two different headers, even with the same name', () => {
      const context = createTransformerContext();
      const a = transformEndpoint(
        context,
        endpointInfo('/a', 'get', {
          operationId: 'a',
          responses: {
            '200': derefAt('/paths/~1a/get/responses/200', {
              description: 'ok',
              headers: {
                'X-Rate': derefAt('/paths/~1a/get/responses/200/headers/X-Rate', {
                  required: true,
                  schema: derefSchemaAt('/paths/~1a/get/responses/200/headers/X-Rate/schema', { type: 'integer' }),
                }),
              },
            }),
          },
        }),
      );
      const b = transformEndpoint(
        context,
        endpointInfo('/b', 'get', {
          operationId: 'b',
          responses: {
            '200': derefAt('/paths/~1b/get/responses/200', {
              description: 'ok',
              headers: {
                'X-Rate': derefAt('/paths/~1b/get/responses/200/headers/X-Rate', {
                  required: true,
                  schema: derefSchemaAt('/paths/~1b/get/responses/200/headers/X-Rate/schema', { type: 'integer' }),
                }),
              },
            }),
          },
        }),
      );

      expect(b.responses[0].headers[0]).not.toBe(a.responses[0].headers[0]);
      expect(context.transformed.headers.size).toBe(2);
    });
  });
});
