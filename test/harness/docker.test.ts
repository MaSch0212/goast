import { join } from 'node:path';

import { expect } from '@std/expect';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';

import {
  buildImage,
  dockerRunArgs,
  hashBuildContext,
  imageTag,
  requireDocker,
  runContainer,
  startContainer,
} from './docker.ts';
import { waitForHttpReady } from './integration/health.ts';
import { repoRootDir } from './paths.ts';

/**
 * The container-starting tests at the bottom of this file are opt-in behind `GOAST_COMPILE`, the same
 * guard `test/compile-tests/compile.test.ts` uses and for the same reason.
 *
 * This file is a workspace-member unit test, so it is inside `deno.json`'s default `test.include` and
 * every one of `deno task test`, `test:harness`, `test:check` and `test:all` reaches it. An
 * `it({ ignore: !hasDocker })` flag does not keep tiers 1 and 2 Docker-free — it only keeps them
 * *runnable* without Docker; on a machine that has Docker those tests run, build an image and start
 * containers, which is exactly what the "tiers 1 and 2 must stay Docker-free" rule forbids (measured:
 * the unit suite goes from ~17s to ~60s and leaves a `goast-test-docker-smoke` image behind).
 *
 * Registering nothing rather than registering ignored tests, for the same reason `compile.test.ts`
 * gives: a `describe` that runs is a `describe` whose body executes, and an ignored test is still a
 * line of noise in every everyday run.
 *
 * The coverage is not lost — `deno task test:compile` and `test:compile:check` name this file
 * explicitly alongside `test/compile-tests`, so it runs with the rest of tier 3. Docker is a hard
 * prerequisite there, so these tests assert rather than skip when it is missing.
 */
const enabled = (Deno.env.get('GOAST_COMPILE') ?? '') !== '';

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

  it('overrides the image entrypoint when one is given', () => {
    const args = dockerRunArgs({ image: 'img', entrypoint: 'gradle', args: ['run'] });

    // Before the image name, or Docker reads it as a container argument.
    expect(args.slice(0, 3)).toEqual(['run', '--rm', '--entrypoint']);
    expect(args[3]).toBe('gradle');
    expect(args.slice(-2)).toEqual(['img', 'run']);
  });

  it('omits the flag when no entrypoint is given', () => {
    expect(dockerRunArgs({ image: 'img' })).not.toContain('--entrypoint');
  });

  it('publishes a container port on loopback with a daemon-chosen host port', () => {
    const args = dockerRunArgs({ image: 'img', name: 'c', publish: [{ containerPort: 8080 }] });

    expect(args).toEqual(['run', '--rm', '--name', 'c', '--publish', '127.0.0.1::8080', 'img']);
  });

  it('honours an explicit host ip', () => {
    const args = dockerRunArgs({ image: 'img', name: 'c', publish: [{ containerPort: 8080, hostIp: '0.0.0.0' }] });

    expect(args).toContain('0.0.0.0::8080');
  });

  it('publishes every requested port', () => {
    const args = dockerRunArgs({
      image: 'img',
      name: 'c',
      publish: [{ containerPort: 8080 }, { containerPort: 9090 }],
    });

    expect(args.filter((a) => a.includes('::'))).toEqual(['127.0.0.1::8080', '127.0.0.1::9090']);
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

if (enabled) {
  describe('buildImage and runContainer', () => {
    it('builds a trivial image, runs commands in it, and skips a rebuild of the same context', async () => {
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
    it('kills a timed-out container through the daemon, leaving none behind', async () => {
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

    it('starts a container, reports its published port, and stops it', async () => {
      const image = await buildImage('kotlin', join(repoRootDir, 'test', 'docker', 'kotlin'));
      // `jwebserver` ships with the JDK the `kotlin` image already has, so this needs no new image and no
      // new dependency. It serves a directory over HTTP and stays up, which is exactly the shape
      // `startContainer` exists for.
      const container = await startContainer({
        image,
        entrypoint: 'jwebserver',
        args: ['-b', '0.0.0.0', '-p', '8080', '-d', '/tmp'],
        publish: [{ containerPort: 8080 }],
      });

      try {
        const port = await container.hostPort(8080);
        expect(port).toBeGreaterThan(0);

        await waitForHttpReady(`http://127.0.0.1:${port}/`, {
          timeoutMs: 60_000,
          isAlive: () => container.running(),
          describeDeath: () => container.output(),
        });

        const response = await fetch(`http://127.0.0.1:${port}/`);
        await response.body?.cancel();
        expect(response.status).toBe(200);
      } finally {
        await container.stop();
      }

      expect(container.running()).toBe(false);
    });

    // The failure this pins down is the one that costs the most time to debug when it is not pinned
    // down: a container that starts, fails, and dies, where the only evidence of *why* is on its stdout.
    //
    // Note what this test establishes about the division of labour, which is not what it was originally
    // written to assert. `hostPort` returns a port here rather than throwing, and that is correct: the
    // daemon publishes the mapping when it *creates* the container, so the mapping genuinely exists
    // during the moment before `jwebserver` gives up. Detecting the death is the readiness poll's job,
    // not `hostPort`'s, and the two must not both try to own it.
    it('surfaces what a container printed when it dies during startup', async () => {
      const image = await buildImage('kotlin', join(repoRootDir, 'test', 'docker', 'kotlin'));
      // `-d` names a directory that does not exist in the container, so `jwebserver` prints its own
      // explanation and exits non-zero.
      const container = await startContainer({
        image,
        entrypoint: 'jwebserver',
        args: ['-b', '0.0.0.0', '-p', '8080', '-d', '/no/such/directory'],
        publish: [{ containerPort: 8080 }],
      });

      try {
        const port = await container.hostPort(8080);

        // `Path does not exist`, not a timeout: the poll must notice the container died and report the
        // container's own message rather than waiting out 30 seconds and blaming the clock.
        await expect(
          waitForHttpReady(`http://127.0.0.1:${port}/`, {
            timeoutMs: 30_000,
            isAlive: () => container.running(),
            describeDeath: () => container.output(),
          }),
        ).rejects.toThrow('Path does not exist');
      } finally {
        await container.stop();
      }
    });

    // Both tests below pin hangs that were reproduced against a live daemon, and neither is reachable
    // through the two tests above: those always call `hostPort` first, which by succeeding proves the
    // container already exists and so hides the whole early window.
    //
    // `withWatchdog` rather than relying on the test runner's own timeout: a hang reported as "the suite
    // timed out" names no cause, whereas this names the call that failed to resolve.
    const withWatchdog = async <T>(label: string, ms: number, work: Promise<T>): Promise<T> => {
      // `ReturnType<typeof setTimeout>` rather than `number`: this file's module graph reaches
      // `@types/node`, so `setTimeout` here is Node's overload returning a `Timeout` object, not the
      // web one returning a number. Typing it `number` was a `TS2322` that stood since it was written —
      // Deno's type-check cache kept reporting the suite green until a run that missed the cache.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const watchdog = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} did not resolve within ${ms}ms`)), ms);
      });
      try {
        return await Promise.race([work, watchdog]);
      } finally {
        clearTimeout(timer);
      }
    };

    const containerNames = async (name: string): Promise<string> => {
      const { stdout } = await new Deno.Command('docker', {
        args: ['ps', '--all', '--filter', `name=^${name}$`, '--format', '{{.Names}} {{.State}}'],
        stdout: 'piped',
        stderr: 'null',
      }).output();
      return new TextDecoder().decode(stdout).trim();
    };

    it('stops a container that the daemon had not finished creating yet', async () => {
      const image = await buildImage('kotlin', join(repoRootDir, 'test', 'docker', 'kotlin'));

      // Three cycles, not one. A single cycle passed even while this leaked: the check ran before the
      // daemon had finished creating the container, so it saw nothing and called that clean. Repeating
      // the cycle is what made the leak observable — 15 of 15 rounds left a container behind, every one
      // of them in `Created` state, which `docker kill` refuses to touch.
      for (let round = 0; round < 3; round++) {
        const container = await startContainer({ image, entrypoint: 'sleep', args: ['60'] });

        // No `hostPort`, no readiness poll: `stop()` lands inside the window where `docker kill` no-ops
        // because the container does not exist yet. Without the `process.kill()` fallback this never
        // resolved and left the container running for its full 60 seconds.
        await withWatchdog(`stop() in round ${round}`, 20_000, container.stop());

        expect(await containerNames(container.name), `round ${round} left a container behind`).toBe('');
      }
    });

    it('fails a port lookup within its timeout when no port was published', async () => {
      const image = await buildImage('kotlin', join(repoRootDir, 'test', 'docker', 'kotlin'));
      const container = await startContainer({ image, entrypoint: 'sleep', args: ['60'] });

      try {
        // The container is alive and will stay alive, so `exited` never resolves. An earlier version
        // awaited it while building this error and hung indefinitely despite the 3s timeout.
        await withWatchdog(
          'hostPort()',
          20_000,
          expect(container.hostPort(8080, 3_000)).rejects.toThrow('Could not read the host port'),
        );
      } finally {
        await withWatchdog('stop()', 20_000, container.stop());
      }
    });
  });
}
