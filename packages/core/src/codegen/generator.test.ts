import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import type { ApiData } from '../transform/api-types.ts';
import { OpenApiGenerator } from './generator.ts';

const emptyData = (): ApiData => ({ documents: [], services: [], endpoints: [], schemas: [] });

describe('OpenApiGenerator', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir({ prefix: 'goast-generator-' });
  });

  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('runs a registered function provider and returns its output', async () => {
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({ a: 1 }));

    expect(await generator.generate(emptyData())).toEqual({ a: 1 });
  });

  it('runs providers in registration order and merges their outputs', async () => {
    const order: string[] = [];
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => {
        order.push('first');
        return { a: 1 };
      })
      .useFn(() => {
        order.push('second');
        return { b: 2 };
      });

    expect(await generator.generate(emptyData())).toEqual({ a: 1, b: 2 });
    expect(order).toEqual(['first', 'second']);
  });

  it('passes each provider the accumulated output of the previous ones', async () => {
    let seen: unknown;
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({ a: 1 }))
      .useFn((context) => {
        seen = context.input;
        return {};
      });

    await generator.generate(emptyData());
    expect(seen).toEqual({ a: 1 });
  });

  it('passes the provider config through', async () => {
    let seen: unknown;
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn((_context, config) => {
        seen = config;
        return {};
      }, { custom: 'value' } as never);

    await generator.generate(emptyData());
    expect(seen).toEqual({ custom: 'value' });
  });

  it('creates the output directory', async () => {
    const out = join(dir, 'out');
    await new OpenApiGenerator({ outputDir: out }).useFn(() => ({})).generate(emptyData());
    expect((await Deno.stat(out)).isDirectory).toBe(true);
  });

  it('empties an existing output directory when clearOutputDir is true', async () => {
    const out = join(dir, 'out');
    await Deno.mkdir(out);
    await Deno.writeTextFile(join(out, 'stale.txt'), 'old');

    await new OpenApiGenerator({ outputDir: out, clearOutputDir: true }).useFn(() => ({})).generate(emptyData());

    await expect(Deno.stat(join(out, 'stale.txt'))).rejects.toThrow();
  });

  it('keeps existing files when clearOutputDir is false', async () => {
    const out = join(dir, 'out');
    await Deno.mkdir(out);
    await Deno.writeTextFile(join(out, 'stale.txt'), 'old');

    await new OpenApiGenerator({ outputDir: out, clearOutputDir: false }).useFn(() => ({})).generate(emptyData());

    expect(await Deno.readTextFile(join(out, 'stale.txt'))).toBe('old');
  });

  it('accumulates providers on the receiver as well as the returned generator', async () => {
    const base = new OpenApiGenerator({ outputDir: join(dir, 'out') });
    base.useFn(() => ({ a: 1 }));
    const second = base.useFn(() => ({ b: 2 }));

    // `use` pushes onto the receiver's own array before copying it, so `base` is not an independent
    // starting point: branching twice off one generator gives the second branch the first branch's
    // providers too.
    expect(await second.generate(emptyData())).toEqual({ a: 1, b: 2 });
  });

  it('merges arrays from two providers element-wise rather than concatenating them', async () => {
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({ items: ['a', 'b'] }))
      .useFn(() => ({ items: ['c'] }));

    const result = await generator.generate(emptyData()) as { items: string[] };

    // mergeDeep tests `typeof value === 'object'` before `Array.isArray`, and an array satisfies the
    // first, so the concatenating branch below it is dead code. Two providers contributing to the same
    // array key overwrite by index instead of appending.
    expect(result.items).toEqual(['c', 'b']);
  });
});
