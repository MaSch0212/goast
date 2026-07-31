import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import { buildImage, dockerRunArgs, hashBuildContext, imageTag, requireDocker, runContainer } from './docker.ts';

// Probed once, so the smoke test below gives real coverage on a machine with Docker and is a
// silent skip on one without — keeping tiers 1 and 2 (and this file, on a Docker-less machine)
// Docker-free.
const hasDocker = await requireDocker().then(() => true).catch(() => false);

/**
 * Builds (or, after the first call, reuses via the inspect-skip path) the trivial image shared by
 * the `buildImage`/`runContainer` tests below. The build context is a temp dir that's removed once
 * the image exists; only the resulting tag is needed afterward.
 */
async function buildSmokeImage(): Promise<string> {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM alpine:3.20\n');
    return await buildImage('docker-smoke', dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** `docker ps -a --filter name=<name>` reports nothing once the daemon has removed the container. */
async function containerExists(name: string): Promise<boolean> {
  const { stdout } = await new Deno.Command('docker', {
    args: ['ps', '-a', '--filter', `name=${name}`, '--format', '{{.Names}}'],
    stdout: 'piped',
    stderr: 'null',
  }).output();
  return new TextDecoder().decode(stdout).trim() !== '';
}

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
      name: 'goast-test-abc123',
      volumes: [{ name: 'goast-gradle', target: '/home/gradle/.gradle' }],
      env: { GRADLE_OPTS: '-Xmx2g' },
      workdir: '/work',
      hostGateway: true,
    })).toEqual([
      'run',
      '--rm',
      '--name',
      'goast-test-abc123',
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

  it('rejects a mount whose source contains a comma, since it would corrupt the --mount spec', () => {
    expect(() => dockerRunArgs({ image: 'img', mounts: [{ source: '/a,b', target: '/t' }] }))
      .toThrow('must not contain a comma');
  });

  it('rejects a mount whose target contains a comma, since it would corrupt the --mount spec', () => {
    expect(() => dockerRunArgs({ image: 'img', mounts: [{ source: '/a', target: '/t,b' }] }))
      .toThrow('must not contain a comma');
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

describe('buildImage and runContainer', () => {
  // Real coverage when Docker is present, silent skip otherwise — the shape that keeps tiers 1
  // and 2 (and a Docker-less run of this file) Docker-free.
  it('builds a trivial image, runs commands in it, and skips a rebuild of the same context', {
    ignore: !hasDocker,
  }, async () => {
    const dir = await Deno.makeTempDir();
    try {
      await Deno.writeTextFile(join(dir, 'Dockerfile'), 'FROM alpine:3.20\n');

      const tag = await buildImage('docker-smoke', dir);
      expect(tag).toBe(imageTag('docker-smoke', await hashBuildContext(dir)));

      const ok = await runContainer({ image: tag, args: ['echo', 'hello-from-container'] });
      expect(ok.code).toBe(0);
      expect(ok.stdout).toContain('hello-from-container');
      expect(ok.timedOut).toBe(false);

      const failing = await runContainer({ image: tag, args: ['sh', '-c', 'exit 7'] });
      expect(failing.code).toBe(7);
      expect(failing.timedOut).toBe(false);

      // Building the same context again must take the inspect-skip path, not rebuild: same tag,
      // and the image the first build produced must still be the one on disk.
      const tagAgain = await buildImage('docker-smoke', dir);
      expect(tagAgain).toBe(tag);
      const inspectAgain = await new Deno.Command('docker', {
        args: ['image', 'inspect', tagAgain],
        stdout: 'null',
        stderr: 'null',
      }).output();
      expect(inspectAgain.code).toBe(0);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  });

  // A container running well past its timeout must be killed through the daemon, not just have its
  // local CLI client disconnected — that's the whole point of naming it. 3000ms is comfortably above
  // container start latency (well under a second for a cached alpine image) but far below the 60s
  // sleep, so the run can only complete this quickly by having been killed.
  it('kills a timed-out container through the daemon, leaving none behind', {
    ignore: !hasDocker,
  }, async () => {
    const tag = await buildSmokeImage();
    const name = `goast-test-timeout-${crypto.randomUUID().slice(0, 8)}`;

    const started = performance.now();
    const result = await runContainer({
      image: tag,
      args: ['sh', '-c', 'sleep 60'],
      name,
      timeoutMs: 3000,
    });
    const elapsedMs = performance.now() - started;

    // The run must return at all (pre-fix, killing only the client could leave `process.output()`
    // unresolved) and it must return quickly — nowhere near the 60s sleep.
    expect(elapsedMs).toBeLessThan(30_000);
    expect(result.timedOut).toBe(true);

    // The actual point: the container must be gone, not merely disconnected-from. `AutoRemove` fires
    // once the daemon has stopped the container, which is normally immediate; poll briefly instead of
    // sleeping a fixed amount in case it needs a moment.
    const deadline = Date.now() + 5000;
    let gone = !(await containerExists(name));
    while (!gone && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      gone = !(await containerExists(name));
    }
    expect(gone).toBe(true);
  });

  // A normal (non-timeout) non-zero exit reporting `timedOut === false` is already covered by the
  // `failing` case in the test above; not duplicated here.
});
