import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { profileSnapshotPaths, verifyProfile } from './verify-profile.ts';

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'goast-profile-' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

describe('profileSnapshotPaths', () => {
  it('puts state and error files beside the tree, not inside it', () => {
    const paths = profileSnapshotPaths(join('base', 'v3'), 'simple-schemas');

    expect(paths.treeDir).toBe(join('base', 'v3', 'simple-schemas'));
    expect(paths.stateFile).toBe(join('base', 'v3', 'simple-schemas.state.txt'));
    expect(paths.errorFile).toBe(join('base', 'v3', 'simple-schemas.error.txt'));
  });
});

describe('verifyProfile write mode', () => {
  it('writes the tree and the state snapshot', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      }, { mode: 'write' });

      expect(await Deno.readTextFile(join(paths.treeDir, 'Model.kt'))).toBe('class Model\n');
      expect(await Deno.readTextFile(paths.stateFile)).toContain('generated: 1');
      expect(await exists(paths.errorFile)).toBe(false);
    });
  });

  it('records a thrown generation as an error snapshot', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, () => {
        throw new Error('File already exists: Model.kt');
      }, { mode: 'write' });

      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: File already exists: Model.kt\n');
      expect(await exists(paths.treeDir)).toBe(false);
      expect(await exists(paths.stateFile)).toBe(false);
    });
  });

  it('normalizes the generation directory out of the error message', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, (outputDir) => {
        throw new Error(`File already exists: ${join(outputDir, 'a', 'Model.kt')}`);
      }, { mode: 'write' });

      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: File already exists: <output>/a/Model.kt\n');
    });
  });

  it('replaces an error snapshot with a tree once generation succeeds', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.writeTextFile(paths.errorFile, 'Error: old failure\n');

      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return {};
      }, { mode: 'write' });

      expect(await exists(paths.errorFile)).toBe(false);
      expect(await exists(join(paths.treeDir, 'Model.kt'))).toBe(true);
    });
  });

  it('replaces a tree with an error snapshot once generation starts failing', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.mkdir(paths.treeDir, { recursive: true });
      await Deno.writeTextFile(join(paths.treeDir, 'Model.kt'), 'class Model\n');
      await Deno.writeTextFile(paths.stateFile, '{}\n');

      await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'write' });

      expect(await exists(paths.treeDir)).toBe(false);
      expect(await exists(paths.stateFile)).toBe(false);
      expect(await Deno.readTextFile(paths.errorFile)).toBe('Error: boom\n');
    });
  });

  it('accepts a generator that legitimately emits no files', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      await verifyProfile(paths, () => ({ schemas: {} }), { mode: 'write' });

      expect(await Deno.readTextFile(paths.stateFile)).toContain('schemas');
      expect(await exists(paths.errorFile)).toBe(false);
    });
  });
});

describe('verifyProfile check mode', () => {
  it('passes when tree and state both match', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      const generate = async (outputDir: string) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      };

      await verifyProfile(paths, generate, { mode: 'write' });
      await verifyProfile(paths, generate, { mode: 'check' });
    });
  });

  it('reports the tree mismatch and the state mismatch together', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return { generated: 1 };
      }, { mode: 'write' });

      const error = (await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Renamed\n');
        return { generated: 2 };
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('Model.kt');
      expect(error.message).toContain('.state.txt');
    });
  });

  it('passes when generation throws exactly the failure that is committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      const generate = () => {
        throw new Error('boom');
      };

      await verifyProfile(paths, generate, { mode: 'write' });
      await verifyProfile(paths, generate, { mode: 'check' });
    });
  });

  it('fails when the committed failure differs from the current one', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'write' });

      const error = (await verifyProfile(paths, () => {
        throw new Error('a different boom');
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('a different boom');
    });
  });

  it('fails when generation throws but a tree is still committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.mkdir(paths.treeDir, { recursive: true });
      await Deno.writeTextFile(join(paths.treeDir, 'Model.kt'), 'class Model\n');
      await Deno.writeTextFile(paths.errorFile, 'Error: boom\n');

      const error = (await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('still committed');
    });
  });

  it('fails when generation throws but no error snapshot is committed', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      const error = (await verifyProfile(paths, () => {
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('boom');
    });
  });

  it('fails when a committed error snapshot is stale because generation now succeeds', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');
      await Deno.writeTextFile(paths.errorFile, 'Error: old failure\n');

      const error = (await verifyProfile(paths, async (outputDir) => {
        await Deno.writeTextFile(join(outputDir, 'Model.kt'), 'class Model\n');
        return {};
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('no longer fails');
    });
  });

  it('surfaces captured generator output when generation throws', async () => {
    await withTempDir(async (base) => {
      const paths = profileSnapshotPaths(base, 'spec');

      const error = (await verifyProfile(paths, () => {
        console.log('Generating Model to somewhere');
        throw new Error('boom');
      }, { mode: 'check' }).catch((e) => e as Error)) as Error;

      expect(error.message).toContain('Generating Model to somewhere');
    });
  });
});
