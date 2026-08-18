import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import type { ApiData } from '../transform/api-types.ts';
import { OpenApiGenerator } from './generator.ts';
import type { AnyConfig, OpenApiGenerationProvider, OpenApiGeneratorContext } from './types.ts';

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

  it('ignores a provider that returns nothing, leaving earlier providers intact', async () => {
    // The `if (result)` guard is defensive, not load-bearing: `for (const key in undefined)` is a
    // no-op, so `mergeDeep(input, undefined)` would return `input` unchanged anyway. Removing the
    // guard does not change this test's outcome — see the `if (result)` bullet under "Also
    // registered, not scheduled" in docs/superpowers/plans/2026-07-25-generator-bug-fixes.md.
    // What this pins is the observable contract: a falsy provider result cannot corrupt the
    // accumulated output.
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => undefined)
      .useFn(() => ({ a: 1 }));

    await expect(generator.generate(emptyData())).resolves.toEqual({ a: 1 });
  });

  it("clears a provider's own outputDir (from its config) when the generator's clearOutputDir is true", async () => {
    const providerOut = join(dir, 'provider-out');
    await Deno.mkdir(providerOut);
    await Deno.writeTextFile(join(providerOut, 'stale.txt'), 'old');

    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out'), clearOutputDir: true })
      .useFn(() => ({}), { outputDir: providerOut } as never);

    await generator.generate(emptyData());

    await expect(Deno.stat(join(providerOut, 'stale.txt'))).rejects.toThrow();
  });

  it("ensures (without clearing) a provider's own outputDir when the generator's clearOutputDir is false", async () => {
    const providerOut = join(dir, 'provider-out');
    await Deno.mkdir(providerOut);
    await Deno.writeTextFile(join(providerOut, 'stale.txt'), 'old');

    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out'), clearOutputDir: false })
      .useFn(() => ({}), { outputDir: providerOut } as never);

    await generator.generate(emptyData());

    expect(await Deno.readTextFile(join(providerOut, 'stale.txt'))).toBe('old');
  });

  it("creates a provider's own outputDir when it does not exist yet, regardless of clearOutputDir", async () => {
    const providerOut = join(dir, 'provider-out', 'nested');

    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out'), clearOutputDir: false })
      .useFn(() => ({}), { outputDir: providerOut } as never);

    await generator.generate(emptyData());

    expect((await Deno.stat(providerOut)).isDirectory).toBe(true);
  });

  it('ignores a provider config outputDir that is not a non-empty string', async () => {
    // Exercises the rest of the `'outputDir' in config && config.outputDir && typeof ... === 'string'`
    // guard: an empty string is falsy, so it is skipped like an absent outputDir would be.
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn(() => ({}), { outputDir: '' } as never);

    await expect(generator.generate(emptyData())).resolves.toEqual({});
  });

  it('registers a provider via useValue and runs its generate method', async () => {
    const provider: OpenApiGenerationProvider<Record<string, unknown>, { a: number }, AnyConfig> = {
      generate(_context: OpenApiGeneratorContext<Record<string, unknown>>) {
        return { a: 1 };
      },
    };
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') }).useValue(provider);

    expect(await generator.generate(emptyData())).toEqual({ a: 1 });
  });

  it('registers a provider via useType and runs its generate method', async () => {
    class ValueProvider implements OpenApiGenerationProvider<Record<string, unknown>, { a: number }, AnyConfig> {
      generate(_context: OpenApiGeneratorContext<Record<string, unknown>>) {
        return { a: 1 };
      }
    }
    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') }).useType(ValueProvider);

    expect(await generator.generate(emptyData())).toEqual({ a: 1 });
  });

  it('parseAndGenerate parses real spec files and feeds the resulting data to the providers', async () => {
    const file = join(dir, 'api.yml');
    await Deno.writeTextFile(
      file,
      `openapi: 3.0.0\ninfo:\n  title: Test\n  version: '1.0'\npaths: {}\n`,
    );

    const generator = new OpenApiGenerator({ outputDir: join(dir, 'out') })
      .useFn((context) => ({ docCount: context.data.documents.length }));

    expect(await generator.parseAndGenerate(file)).toEqual({ docCount: 1 });
  });

  it('parseAndGenerateFromDir only picks up .yml/.yaml/.json files, further narrowed by an optional filter', async () => {
    const specDir = join(dir, 'specs');
    await Deno.mkdir(specDir);
    const minimalYaml = `openapi: 3.0.0\ninfo:\n  title: Test\n  version: '1.0'\npaths: {}\n`;
    const minimalJson = JSON.stringify({ openapi: '3.0.0', info: { title: 'Test', version: '1.0' }, paths: {} });

    await Deno.writeTextFile(join(specDir, 'a.yml'), minimalYaml);
    await Deno.writeTextFile(join(specDir, 'b.yaml'), minimalYaml);
    await Deno.writeTextFile(join(specDir, 'c.json'), minimalJson);
    await Deno.writeTextFile(join(specDir, 'notes.txt'), 'not a spec');

    const withDocCount = (context: OpenApiGeneratorContext<Record<string, unknown>>) => ({
      docCount: context.data.documents.length,
    });

    const allGenerator = new OpenApiGenerator({ outputDir: join(dir, 'out') }).useFn(withDocCount);
    expect(await allGenerator.parseAndGenerateFromDir(specDir)).toEqual({ docCount: 3 });

    const filteredGenerator = new OpenApiGenerator({ outputDir: join(dir, 'out2') }).useFn(withDocCount);
    expect(
      await filteredGenerator.parseAndGenerateFromDir(specDir, { filter: (file) => file.endsWith('a.yml') }),
    ).toEqual({ docCount: 1 });
  });
});
