// This file is test-only. It must not be imported from `mod.ts` (or any other production entry point):
// doing so would pull it into `deno task npm:core`'s build graph and ship it in the published package.
//
// It was originally meant to live in `@goast/test-harness` (see `test/harness/deref.ts` in an earlier
// revision of this branch), reusing the real `createDerefProxy` so consuming tests get faithful `$ref`
// fallthrough instead of a hand-rolled stand-in. That would have required the harness to import from
// `packages/core`, and `createDerefProxy` is intentionally not part of core's public API (see
// `packages/core/mod.ts`), so it would have had to be a relative import reaching out of the harness's
// own directory. `deno task npm:test-harness` was run to check this empirically: dnt aborted with
// `Error stripping prefix of .../packages/core/src/parse/deref-proxy.ts with base .../test/harness`,
// because dnt refuses to bundle a file outside the project root it was invoked with. So the fixture is
// colocated here instead, and every consumer imports it by relative path.
import { createDerefProxy } from './deref-proxy.ts';
import type { OpenApiDocument } from './openapi-types.ts';
import type { Deref } from './types.ts';

const NESTED_SCHEMA_KEYS = ['allOf', 'anyOf', 'oneOf', 'not', 'items', 'prefixItems', 'properties'];

/**
 * Wraps `value` in a real deref proxy at `path`.
 *
 * Uses `createDerefProxy` rather than a hand-rolled object on purpose: the proxy's `get` handler falls
 * through to the `$ref` target for any property the value itself lacks, and that fallthrough is the
 * behaviour most transform code depends on. A plain object with a `$src` field would pass the shape
 * check and silently skip it.
 */
export function derefAt<T extends object>(path: string, value: Partial<T>, ref?: Deref<T>): Deref<T> {
  return createDerefProxy(
    // deno-lint-ignore no-explicit-any
    value as any,
    {
      file: 'test.yml',
      pos: { line: 0, col: 0 },
      path,
      document: {} as Deref<OpenApiDocument>,
      // deno-lint-ignore no-explicit-any
      originalComponent: value as any,
    },
    // deno-lint-ignore no-explicit-any
    ref as any,
  ) as Deref<T>;
}

/**
 * Like {@link derefAt}, but recurses into nested schema keys first so that a nested schema is itself a
 * proxy at its own sub-path — the shape the parser produces, and the shape `$src.path`-keyed dedup in
 * the transformer and collector needs in order to behave as it does in production.
 */
// deno-lint-ignore no-explicit-any
export function derefSchemaAt<T extends Record<string, any>>(
  path: string,
  schema: Partial<T>,
  ref?: Deref<T>,
): Deref<T> {
  const mutableSchema = schema as Record<string, unknown>;
  for (const key of NESTED_SCHEMA_KEYS) {
    const value = mutableSchema[key];
    if (Array.isArray(value)) {
      mutableSchema[key] = value.map((x, i) => derefSchemaAt(`${path}/${key}/${i}`, x));
    } else if (value && typeof value === 'object') {
      mutableSchema[key] = key === 'properties'
        ? Object.fromEntries(
          Object.entries(value as Record<string, Record<string, unknown>>).map((
            [k, v],
          ) => [k, derefSchemaAt(`${path}/${key}/${k}`, v)]),
        )
        : derefSchemaAt(`${path}/${key}`, value);
    }
  }

  return derefAt(path, schema, ref);
}
