import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { ensureDir } from '@std/fs/ensure-dir';

import type { DiscoveredSpec } from '../specs.ts';
import { discoverCompileUnits } from './units.ts';

const spec = (versionDir: 'v2' | 'v3' | 'v3.1', name: string): DiscoveredSpec => ({
  versionDir,
  version: versionDir === 'v2' ? '2.0' : versionDir === 'v3' ? '3.0' : '3.1',
  name,
  files: [],
});

describe('discoverCompileUnits', () => {
  let root: string;

  beforeEach(async () => {
    root = await Deno.makeTempDir();
  });
  afterEach(async () => {
    await Deno.remove(root, { recursive: true });
  });

  it('yields one unit per existing tree directory', async () => {
    const treeDir = join(root, 'kotlin', 'models@sb3', 'v3', 'simple');
    await ensureDir(treeDir);
    await Deno.writeTextFile(join(treeDir, 'placeholder.txt'), '');

    const units = await discoverCompileUnits(
      [{ name: 'models@sb3', language: 'kotlin', versions: 'all' }],
      [spec('v3', 'simple')],
      root,
    );

    expect(units).toEqual([{
      language: 'kotlin',
      profile: 'models@sb3',
      versionDir: 'v3',
      spec: 'simple',
      treeDir: join(root, 'kotlin', 'models@sb3', 'v3', 'simple'),
      id: 'kotlin/models@sb3/v3/simple',
    }]);
  });

  it('skips a spec whose tree does not exist, so an errored generation is not a phantom unit', async () => {
    const keptDir = join(root, 'kotlin', 'models@sb3', 'v3', 'kept');
    await ensureDir(keptDir);
    await Deno.writeTextFile(join(keptDir, 'placeholder.txt'), '');
    await Deno.writeTextFile(join(root, 'kotlin', 'models@sb3', 'v3', 'crashed.error.txt'), 'boom\n');

    const units = await discoverCompileUnits(
      [{ name: 'models@sb3', language: 'kotlin', versions: 'all' }],
      [spec('v3', 'kept'), spec('v3', 'crashed')],
      root,
    );

    expect(units.map((u) => u.spec)).toEqual(['kept']);
  });

  it('honours a profile restricted to some version directories', async () => {
    const aDir = join(root, 'typescript', 'models', 'v3', 'a');
    await ensureDir(aDir);
    await Deno.writeTextFile(join(aDir, 'placeholder.txt'), '');
    await ensureDir(join(root, 'typescript', 'models', 'v2', 'b'));

    const units = await discoverCompileUnits(
      [{ name: 'models', language: 'typescript', versions: ['v3'] }],
      [spec('v3', 'a'), spec('v2', 'b')],
      root,
    );

    expect(units.map((u) => u.id)).toEqual(['typescript/models/v3/a']);
  });

  it('sorts by id so a run order never depends on directory iteration order', async () => {
    for (const p of ['b-profile', 'a-profile']) {
      for (const s of ['z', 'a']) {
        const dir = join(root, 'typescript', p, 'v3', s);
        await ensureDir(dir);
        await Deno.writeTextFile(join(dir, 'placeholder.txt'), '');
      }
    }

    const units = await discoverCompileUnits(
      [
        { name: 'b-profile', language: 'typescript', versions: 'all' },
        { name: 'a-profile', language: 'typescript', versions: 'all' },
      ],
      [spec('v3', 'z'), spec('v3', 'a')],
      root,
    );

    expect(units.map((u) => u.id)).toEqual([
      'typescript/a-profile/v3/a',
      'typescript/a-profile/v3/z',
      'typescript/b-profile/v3/a',
      'typescript/b-profile/v3/z',
    ]);
  });

  it('ignores an empty tree directory, which has nothing to compile', async () => {
    await ensureDir(join(root, 'typescript', 'models', 'v3', 'empty'));

    const units = await discoverCompileUnits(
      [{ name: 'models', language: 'typescript', versions: 'all' }],
      [spec('v3', 'empty')],
      root,
    );

    expect(units).toEqual([]);
  });
});
