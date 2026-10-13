// Test-only: never import from `mod.ts` or another production entry point. `tsconfig.build.json` excludes
// `*.test-utils.ts`, so it stays out of the published package. Colocated here instead of in
// `@goast/test-harness` because it reuses `createDerefProxy`, which core's package exports do not expose.
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
 *
 * **`file` is always `'test.yml'`, so `path` alone has to be unique.** Collection and transformation
 * both key on `${$src.file}#${$src.path}` and dedup on that key, so two fixtures built at the same
 * `path` — even when they stand for objects in two different documents — silently collapse into one.
 * There is no error; the second one is simply dropped. Give every fixture in a multi-document scenario
 * its own `path`.
 */
export function derefAt<T extends object>(path: string, value: Partial<T>, ref?: Deref<T>): Deref<T> {
  return createDerefProxy(
    value as any,
    {
      file: 'test.yml',
      pos: { line: 0, col: 0 },
      path,
      document: {} as Deref<OpenApiDocument>,
      originalComponent: value as any,
    },
    ref as any,
  ) as Deref<T>;
}

/**
 * Like {@link derefAt}, but recurses into nested schema keys first so that a nested schema is itself a
 * proxy at its own sub-path — the shape the parser produces, and the shape `$src.path`-keyed dedup in
 * the transformer and collector needs in order to behave as it does in production.
 */
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
      mutableSchema[key] =
        key === 'properties'
          ? Object.fromEntries(
              Object.entries(value as Record<string, Record<string, unknown>>).map(([k, v]) => [
                k,
                derefSchemaAt(`${path}/${key}/${k}`, v),
              ]),
            )
          : derefSchemaAt(`${path}/${key}`, value);
    }
  }

  return derefAt(path, schema, ref);
}
