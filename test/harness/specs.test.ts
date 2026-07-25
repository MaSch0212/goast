import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { specsDir } from './paths.ts';
import { discoverSpecs } from './specs.ts';

describe('discoverSpecs', () => {
  it('finds single-file specs with their version', async () => {
    const specs = await discoverSpecs();
    const simple = specs.find((s) => s.versionDir === 'v3' && s.name === 'simple-schemas');

    expect(simple).toBeDefined();
    expect(simple!.version).toBe('3.0');
    expect(simple!.files).toEqual([join(specsDir, 'v3', 'simple-schemas.yml')]);
  });

  it('covers every version directory', async () => {
    const specs = await discoverSpecs();
    expect(new Set(specs.map((s) => s.versionDir))).toEqual(new Set(['v2', 'v3', 'v3.1']));
    expect(new Set(specs.map((s) => s.version))).toEqual(new Set(['2.0', '3.0', '3.1']));
  });

  it('returns entries in a deterministic order', async () => {
    const first = await discoverSpecs();
    const second = await discoverSpecs();
    const key = (s: { versionDir: string; name: string }) => `${s.versionDir}/${s.name}`;

    expect(first.map(key)).toEqual(second.map(key));
    expect(first.map(key)).toEqual([...first.map(key)].sort());
  });

  it('treats a directory as one spec whose files parse together', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v3', 'split-spec'), { recursive: true });
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'b.yml'), 'openapi: 3.0.0\n');
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'a.yml'), 'openapi: 3.0.0\n');
      await Deno.writeTextFile(join(root, 'v3', 'split-spec', 'notes.md'), 'ignored\n');

      const specs = await discoverSpecs(root);

      expect(specs).toHaveLength(1);
      expect(specs[0].name).toBe('split-spec');
      expect(specs[0].files).toEqual([
        join(root, 'v3', 'split-spec', 'a.yml'),
        join(root, 'v3', 'split-spec', 'b.yml'),
      ]);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('throws when two specs would share one snapshot base', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v3'), { recursive: true });
      await Deno.writeTextFile(join(root, 'v3', 'pets.yml'), 'openapi: 3.0.0\n');
      await Deno.writeTextFile(join(root, 'v3', 'pets.json'), '{}');

      const error = await discoverSpecs(root).then(() => undefined, (e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toContain('v3/pets');
      expect(error!.message).toContain(join(root, 'v3', 'pets.json'));
      expect(error!.message).toContain(join(root, 'v3', 'pets.yml'));
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('allows the same spec name in different version directories', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v2'), { recursive: true });
      await Deno.mkdir(join(root, 'v3'), { recursive: true });
      await Deno.writeTextFile(join(root, 'v2', 'pets.yml'), 'swagger: "2.0"\n');
      await Deno.writeTextFile(join(root, 'v3', 'pets.yml'), 'openapi: 3.0.0\n');

      expect((await discoverSpecs(root)).map((s) => `${s.versionDir}/${s.name}`)).toEqual(['v2/pets', 'v3/pets']);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('ignores an absent version directory', async () => {
    const root = await Deno.makeTempDir({ prefix: 'goast-specs-' });
    try {
      await Deno.mkdir(join(root, 'v3'));
      await Deno.writeTextFile(join(root, 'v3', 'only.json'), '{}');
      expect((await discoverSpecs(root)).map((s) => s.name)).toEqual(['only']);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
