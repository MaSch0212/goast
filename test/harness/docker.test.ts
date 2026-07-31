import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { dockerRunArgs, hashBuildContext, imageTag, requireDocker } from './docker.ts';

describe('dockerRunArgs', () => {
  it('always removes the container, so a failed run leaves nothing behind', () => {
    expect(dockerRunArgs({ image: 'img' })).toEqual(['run', '--rm', 'img']);
  });

  it('renders a read-only mount with the readonly flag', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: '/a', target: '/b', readOnly: true }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=/a,target=/b,readonly', 'img']);
  });

  it('renders a writable mount without it', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: '/a', target: '/b' }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=/a,target=/b', 'img']);
  });

  it('renders a named volume, env, workdir, host gateway, and trailing command args in a stable order', () => {
    expect(dockerRunArgs({
      image: 'img',
      args: ['gradle', 'compileKotlin'],
      volumes: [{ name: 'goast-gradle', target: '/home/gradle/.gradle' }],
      env: { GRADLE_OPTS: '-Xmx2g' },
      workdir: '/work',
      hostGateway: true,
    })).toEqual([
      'run',
      '--rm',
      '--mount',
      'type=volume,source=goast-gradle,target=/home/gradle/.gradle',
      '--env',
      'GRADLE_OPTS=-Xmx2g',
      '--workdir',
      '/work',
      '--add-host',
      'host.docker.internal:host-gateway',
      'img',
      'gradle',
      'compileKotlin',
    ]);
  });

  it('converts a Windows path to a form the daemon accepts', () => {
    expect(dockerRunArgs({ image: 'img', mounts: [{ source: 'E:\\repo\\test', target: '/t' }] }))
      .toEqual(['run', '--rm', '--mount', 'type=bind,source=E:/repo/test,target=/t', 'img']);
  });
});

describe('imageTag', () => {
  it('embeds the context hash so a stale image cannot be silently reused', () => {
    expect(imageTag('kotlin', 'abcdef1234')).toBe('goast-test-kotlin:abcdef1234');
  });
});

describe('hashBuildContext', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await Deno.makeTempDir();
    await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM scratch\n');
  });
  afterEach(async () => {
    await Deno.remove(dir, { recursive: true });
  });

  it('is stable across calls', async () => {
    expect(await hashBuildContext(dir)).toBe(await hashBuildContext(dir));
  });

  it('changes when any file in the context changes', async () => {
    const before = await hashBuildContext(dir);
    await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM scratch\nRUN true\n');
    expect(await hashBuildContext(dir)).not.toBe(before);
  });

  it('changes when a file is added, not only when one is edited', async () => {
    const before = await hashBuildContext(dir);
    await Deno.writeTextFile(join(dir, 'extra.txt'), 'x\n');
    expect(await hashBuildContext(dir)).not.toBe(before);
  });
});

describe('requireDocker', () => {
  it('either resolves or explains that Docker is required, never a spawn error', async () => {
    try {
      await requireDocker();
    } catch (error) {
      expect(String(error)).toContain('Docker is required for this tier');
    }
  });
});
