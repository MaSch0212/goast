import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { derefAt } from '../parse/deref.test-utils.ts';
import { createTransformerContext } from './transform.test-utils.ts';

import type { OpenApiDocument } from '../parse/openapi-types.ts';
import type { Deref } from '../parse/types.ts';
import { transformDocument } from './transform-document.ts';

// deno-lint-ignore no-explicit-any
const doc = (value: Record<string, any>) => derefAt('', value) as unknown as Deref<OpenApiDocument>;

describe('transformDocument', () => {
  it('does nothing for a document with no tags', () => {
    const context = createTransformerContext();
    transformDocument(context, doc({}));
    expect(context.services.size).toBe(0);
  });

  it('creates one service per tag, keyed by name', () => {
    const context = createTransformerContext();
    transformDocument(
      context,
      doc({
        tags: [
          derefAt('/tags/0', { name: 'pets', description: 'Pet things' }),
          derefAt('/tags/1', { name: 'store' }),
        ],
      }),
    );

    expect([...context.services.keys()].sort()).toEqual(['pets', 'store']);
    expect(context.services.get('pets')!.description).toBe('Pet things');
  });

  it('falls back to the generated id when a tag has no name', () => {
    const context = createTransformerContext();
    transformDocument(context, doc({ tags: [derefAt('/tags/0', {})] }));

    const service = [...context.services.values()][0];
    expect(service.name).toBe(service.id);
  });

  it('returns the existing service for a tag it has already transformed', () => {
    // Asserting only `size === 1` here would pass even without dedup: `Map#set` on the same key
    // (the tag's `$src.path`, and separately its `name`) overwrites in place either way, so the
    // size never grows regardless of whether the second pass actually short-circuited. Asserting
    // object identity is what actually distinguishes "reused the first service" from "quietly
    // rebuilt a second one and overwrote the first".
    const context = createTransformerContext();
    const tag = derefAt('/tags/0', { name: 'pets' });

    transformDocument(context, doc({ tags: [tag] }));
    const service = context.services.get('pets');

    transformDocument(context, doc({ tags: [tag] }));

    expect(context.services.size).toBe(1);
    expect(context.transformed.services.size).toBe(1);
    expect(context.services.get('pets')).toBe(service);
  });

  it('records a $ref-reached tag as transformed without registering it as a service', () => {
    const context = createTransformerContext();
    const target = derefAt('/components/tags/0', { name: 'target' });
    transformDocument(context, doc({ tags: [derefAt('/tags/0', { name: 'source' }, target)] }));

    expect([...context.services.keys()]).toEqual(['source']);
    expect(context.transformed.services.size).toBe(2);
    expect(context.services.get('source')!.$ref!.name).toBe('target');
  });
});
