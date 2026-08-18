import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt } from './deref.test-utils.ts';
import { createDerefProxy } from './deref-proxy.ts';
import type { OpenApiDocument, OpenApiSchema } from './openapi-types.ts';
import type { Deref } from './types.ts';

const src = (path: string) => ({
  file: 'test.yml',
  pos: { line: 0, col: 0 },
  path,
  document: {} as Deref<OpenApiDocument>,
  originalComponent: {} as OpenApiSchema,
});

describe('createDerefProxy', () => {
  it('exposes $src', () => {
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'));
    expect(proxy.$src.path).toBe('/a');
  });

  it('returns undefined for $ref when there is no ref', () => {
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'));
    expect(proxy.$ref).toBeUndefined();
  });

  it('prefers the target own property over the ref', () => {
    const ref = derefAt('/b', { type: 'string' as const });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.type).toBe('object');
  });

  it('falls through to the ref for a property the target lacks', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.description).toBe('from ref');
  });

  it('never inherits title from the ref, even though it inherits everything else', () => {
    const ref = derefAt('/b', { title: 'from ref', description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    expect(proxy.title).toBeUndefined();
    expect(proxy.description).toBe('from ref');
  });

  it('lets a write shadow the target own property without mutating the target', () => {
    const target = { type: 'object' } as OpenApiSchema;
    const proxy = createDerefProxy(target, src('/a'));
    (proxy as { type?: string }).type = 'string';
    expect(proxy.type).toBe('string');
    expect(target.type).toBe('object');
  });

  it('accepts a write to $ref and reflects it in later reads', () => {
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'));
    const ref = derefAt('/b', { description: 'later' });
    (proxy as { $ref?: unknown }).$ref = ref;
    expect(proxy.description).toBe('later');
  });

  it('clears the ref when $ref is set to undefined', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    (proxy as { $ref?: unknown }).$ref = undefined;
    expect(proxy.description).toBeUndefined();
  });

  it('refuses a write to $src', () => {
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'));
    expect(() => {
      'use strict';
      (proxy as { $src?: unknown }).$src = null;
    }).toThrow();
  });

  it('reports a ref-only property as present via in', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    expect('description' in proxy).toBe(true);
  });

  it('reports a target-owned property as present via in', () => {
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'));
    expect('type' in proxy).toBe(true);
  });

  it('reports a property on neither target nor ref as absent via in', () => {
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect('zzzNotPresent' in proxy).toBe(false);
  });

  it('silently no-ops when $ref is set to a non-object, non-undefined value', () => {
    // `set`'s first branch only handles `typeof value === 'object' || typeof value === 'undefined'`; a
    // string falls past it into the generic `_overwrittenValues[prop] = value` path and the trap still
    // returns `true`. But `get` intercepts `prop === '$ref'` before ever consulting `_overwrittenValues`,
    // so the write is permanently invisible: the original ref is neither replaced nor cleared. Pinning
    // this actual (almost certainly unintended) behaviour, not endorsing it.
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    const result = Reflect.set(proxy, '$ref', 'not-an-object');
    expect(result).toBe(true);
    expect(proxy.$ref).toBe(ref);
    expect(proxy.description).toBe('from ref');
  });

  it('lists target keys, ref keys, $ref and $src from ownKeys, but not from Object.keys', () => {
    // The handler implements `ownKeys` but not `getOwnPropertyDescriptor`. `Object.getOwnPropertyNames`
    // (and `Reflect.ownKeys`) go straight through `ownKeys` and report the full virtual key set. But
    // `Object.keys` additionally calls `getOwnPropertyDescriptor` per key to decide what is enumerable;
    // since that trap isn't implemented, it falls back to querying the real, unproxied target, and a
    // ref-only or $ref/$src key has no descriptor there. So `Object.keys` silently drops them and only
    // reports keys that are real own properties of the target. Verified empirically: property access
    // (`proxy.description`) still falls through to the ref correctly — only enumeration is affected.
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({ type: 'object' } as OpenApiSchema, src('/a'), ref as never);
    expect(Object.getOwnPropertyNames(proxy).sort()).toEqual(['$ref', '$src', 'description', 'type']);
    expect(Object.keys(proxy)).toEqual(['type']);
  });

  it('does not let writing undefined shadow the ref value (a likely oversight, flagged for Task 12)', () => {
    // `get` only treats an overwritten value as shadowing when it is `!== undefined`, so writing
    // `undefined` through the proxy does not shadow the ref at all: the read falls straight through.
    const ref = derefAt('/b', { description: 'from ref' });
    const proxy = createDerefProxy({} as OpenApiSchema, src('/a'), ref as never);
    (proxy as { description?: string }).description = undefined;
    expect(proxy.description).toBe('from ref');
  });

  it('falls through to the ref even when the target has an explicit own `undefined` value (flagged for Task 12)', () => {
    // Same root cause as above: `get` also treats a target property as absent whenever its value is
    // `!== undefined` fails, i.e. whenever the value IS `undefined` — even if the key is a real, present
    // own property on the target rather than simply missing.
    const ref = derefAt('/b', { description: 'from ref' });
    const target = { description: undefined } as unknown as OpenApiSchema;
    const proxy = createDerefProxy(target, src('/a'), ref as never);
    expect(proxy.description).toBe('from ref');
  });
});
