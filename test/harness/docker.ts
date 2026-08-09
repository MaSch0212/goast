import { join, relative } from 'node:path';

import { walk } from '@std/fs/walk';

export type DockerMount = { source: string; target: string; readOnly?: boolean };

/**
 * One published container port.
 *
 * No `hostPort`: the daemon picks a free one and {@link RunningContainer.hostPort} reads it back. Letting
 * the caller choose would mean finding a free port on the host first, and the only way to do that is to
 * bind one and release it — after which nothing stops another process from taking it before the daemon
 * binds.
 */
export type PublishedPort = { containerPort: number; hostIp?: string };

export type RunContainerOptions = {
  image: string;
  /** The command and its arguments, replacing the image's default. */
  args?: string[];
  mounts?: DockerMount[];
  env?: Record<string, string>;
  /** Named volumes, used to persist a dependency cache between runs. */
  volumes?: { name: string; target: string }[];
  /** Adds `host.docker.internal`, so a containerized process can reach a server on the host. */
  hostGateway?: boolean;
  workdir?: string;
  /** Defaults to 15 minutes. The container is killed when it expires. */
  timeoutMs?: number;
  /**
   * Explicit container name, so a timed-out run can be found and killed through the daemon rather
   * than only through its (unresponsive) `docker` CLI client. `runContainer` generates one when
   * omitted.
   */
  name?: string;
  /**
   * Replaces the image's `ENTRYPOINT`.
   *
   * The `kotlin` image pins `gradle … compileKotlin` for tier 3, so tier 4 — which needs a different
   * task and none of `--continue`/`--parallel` — has to replace it rather than append to it.
   */
  entrypoint?: string;
  /** Ports to publish to the host. See {@link PublishedPort}. */
  publish?: PublishedPort[];
};

export type ContainerResult = { code: number; stdout: string; stderr: string; timedOut: boolean };

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Fails with one plain sentence when Docker is unusable.
 *
 * Tiers 3 and 4 need it; tiers 1 and 2 never touch it. Without this check the first symptom is a
 * `NotFound` from `Deno.Command`, which reads like a bug in the harness rather than a missing
 * prerequisite.
 */
export async function requireDocker(): Promise<void> {
  let code: number;
  try {
    ({ code } = await new Deno.Command('docker', {
      args: ['version', '--format', '{{.Server.Version}}'],
      stdout: 'null',
      stderr: 'null',
    }).output());
  } catch {
    throw new Error('Docker is required for this tier, and the `docker` command was not found.');
  }
  if (code !== 0) {
    throw new Error('Docker is required for this tier, and the daemon did not respond.');
  }
}

/** Forward slashes: the daemon rejects a Windows-style bind source. */
function normalizeMountPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * `--mount` is a comma-delimited spec, so a comma in a path would silently split into extra fields
 * instead of failing loudly.
 */
function assertNoComma(value: string, description: string): void {
  if (value.includes(',')) {
    throw new Error(`Docker mount ${description} must not contain a comma: ${value}`);
  }
}

/** The `docker run` argv, split out from {@link runContainer} so it can be asserted directly. */
export function dockerRunArgs(options: RunContainerOptions): string[] {
  const args = ['run', '--rm'];

  if (options.name !== undefined) args.push('--name', options.name);
  if (options.entrypoint !== undefined) args.push('--entrypoint', options.entrypoint);

  for (const mount of options.mounts ?? []) {
    assertNoComma(mount.source, 'source');
    assertNoComma(mount.target, 'target');
    const spec = `type=bind,source=${normalizeMountPath(mount.source)},target=${mount.target}` +
      (mount.readOnly === true ? ',readonly' : '');
    args.push('--mount', spec);
  }
  for (const volume of options.volumes ?? []) {
    args.push('--mount', `type=volume,source=${volume.name},target=${volume.target}`);
  }
  for (const [key, value] of Object.entries(options.env ?? {})) {
    args.push('--env', `${key}=${value}`);
  }
  for (const port of options.publish ?? []) {
    // `<ip>::<containerPort>` — the empty middle field is what asks the daemon for an ephemeral host
    // port. Loopback by default: the container is the server in the tier-4 server direction, so nothing
    // needs to be reachable from off the host.
    args.push('--publish', `${port.hostIp ?? '127.0.0.1'}::${port.containerPort}`);
  }
  if (options.workdir !== undefined) args.push('--workdir', options.workdir);
  if (options.hostGateway === true) args.push('--add-host', 'host.docker.internal:host-gateway');

  args.push(options.image, ...(options.args ?? []));
  return args;
}

/** `goast-test-<name>:<contextHash>`. */
export function imageTag(name: string, contextHash: string): string {
  return `goast-test-${name}:${contextHash}`;
}

/**
 * A short digest of every file in the build context.
 *
 * The tag derives from this, so editing a Dockerfile or any file it copies produces a different tag
 * and the stale image cannot be silently reused. Paths are included alongside contents so that
 * renaming a file changes the hash too.
 */
export async function hashBuildContext(contextDir: string): Promise<string> {
  const parts: string[] = [];
  const paths: string[] = [];
  for await (const entry of walk(contextDir, { includeDirs: false, includeSymlinks: false })) {
    paths.push(entry.path);
  }
  paths.sort();
  for (const path of paths) {
    parts.push(relative(contextDir, path).replace(/\\/g, '/'));
    parts.push(await Deno.readTextFile(path));
  }

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(parts.join(String.fromCharCode(0))),
  );
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds the image for `contextDir` and returns its tag.
 *
 * `type=gha` cache in CI and a local cache directory otherwise, so a warm run reuses layers. The
 * build is skipped when an image with the derived tag already exists locally.
 */
export async function buildImage(name: string, contextDir: string): Promise<string> {
  await requireDocker();
  const tag = imageTag(name, await hashBuildContext(contextDir));

  const inspect = await new Deno.Command('docker', {
    args: ['image', 'inspect', tag],
    stdout: 'null',
    stderr: 'null',
  }).output();
  if (inspect.code === 0) return tag;

  const cacheArgs = Deno.env.get('CI') !== undefined && Deno.env.get('CI') !== ''
    ? ['--cache-from', 'type=gha', '--cache-to', 'type=gha,mode=max']
    : ['--cache-from', `type=local,src=${join(Deno.env.get('TMPDIR') ?? '/tmp', 'goast-docker-cache')}`];

  const { code, stderr } = await new Deno.Command('docker', {
    args: ['buildx', 'build', '--load', '--tag', tag, ...cacheArgs, contextDir],
    stdout: 'inherit',
    stderr: 'piped',
  }).output();
  const errorText = new TextDecoder().decode(stderr);
  if (code !== 0) throw new Error(`Failed to build image ${tag}:\n${errorText}`);
  return tag;
}

/**
 * Runs a container to completion, killing it if `timeoutMs` expires.
 *
 * The container is always named, either explicitly or with a generated name, and the timeout path
 * kills it through the daemon (`docker kill <name>`) rather than only the local `docker` CLI client.
 * `--rm` only triggers the daemon's auto-remove once the container actually stops; killing just the
 * client (which is not `docker run`'s signal-proxying target) leaves the container running and
 * unremoved on the host.
 */
export async function runContainer(options: RunContainerOptions): Promise<ContainerResult> {
  await requireDocker();

  const name = options.name ?? `goast-test-${crypto.randomUUID()}`;
  const process = new Deno.Command('docker', {
    args: dockerRunArgs({ ...options, name }),
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    (async () => {
      try {
        await new Deno.Command('docker', {
          args: ['kill', name],
          stdout: 'null',
          stderr: 'null',
        }).output();
      } catch {
        // Best effort; killing the client below still unblocks `process.output()`.
      }
      try {
        process.kill('SIGKILL');
      } catch {
        // Already exited; nothing to kill.
      }
    })();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const { code, stdout, stderr } = await process.output();
    return {
      code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      timedOut,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** A container that keeps running while the test drives it. See {@link startContainer}. */
export type RunningContainer = {
  name: string;
  /** Host port the daemon mapped `containerPort` to, on 127.0.0.1. Polls up to `timeoutMs` (default 30s). */
  hostPort(containerPort: number, timeoutMs?: number): Promise<number>;
  /** Everything the container has written so far, stdout and stderr interleaved. */
  output(): string;
  /** Resolves when the container process exits on its own. Never rejects. */
  exited: Promise<number>;
  /** True until `exited` resolves. */
  running(): boolean;
  /** Kills and reaps the container. Safe to call twice. */
  stop(): Promise<void>;
};

/**
 * Starts a container and returns while it is still running.
 *
 * The counterpart to {@link runContainer}, which waits for the container to finish and is therefore
 * useless for a server: tier 4's server direction has to reach the container *while* it runs. Kept as a
 * separate entry point rather than a flag on `runContainer`, because tier 3 and the client direction
 * depend on that function's exact behaviour.
 *
 * Output is drained continuously into a buffer rather than left in the pipe. A Spring Boot startup log
 * is large enough to fill the OS pipe buffer, and a container blocked writing to a full pipe stops
 * making progress — it would never become ready, and the log explaining why would be the thing that was
 * stuck.
 */
export async function startContainer(options: RunContainerOptions): Promise<RunningContainer> {
  await requireDocker();

  const name = options.name ?? `goast-test-${crypto.randomUUID()}`;
  const process = new Deno.Command('docker', {
    args: dockerRunArgs({ ...options, name }),
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  let buffer = '';
  const decoder = new TextDecoder();
  const drain = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
    for await (const chunk of stream) buffer += decoder.decode(chunk, { stream: true });
  };
  const drained = Promise.all([drain(process.stdout), drain(process.stderr)]);

  let alive = true;
  const exited = process.status.then(async ({ code }) => {
    // `alive` flips only once the output streams have closed, not the instant the process exits, so that
    // `output()` is complete for anyone who reacts to death by *reporting* it — `waitForHttpReady` calls
    // `describeDeath()` to build its error, and a container's explanation of why it died is the last
    // thing it writes.
    //
    // Stated honestly: the window this closes is real but small, and the gated
    // `dies during startup` test passes with or without this `await` (measured, three runs each). The
    // 250ms readiness-poll interval is wide enough to let the drain catch up on a container whose whole
    // output is two lines. It is kept because the window scales with output volume and the callers that
    // matter most are the ones with the most to say — a Gradle build reporting a compile failure emits
    // kilobytes, and truncating *that* report is the difference between a diagnosable failure and a
    // shrug. Do not treat the passing test as evidence this line is unnecessary.
    await drained.catch(() => {});
    alive = false;
    return code;
  });

  return {
    name,
    output: () => buffer,
    exited,
    running: () => alive,
    /**
     * Reads the host port the daemon mapped `containerPort` to, waiting for the container to exist.
     *
     * Polls rather than asking once: `spawn()` returns as soon as the `docker` *client* starts, which is
     * before the daemon has created the container, so an immediate `docker port` reliably answers
     * `No such container` for a container that is about to start perfectly well. Measured, not
     * theorised — against an identical container the same call fails at t=0 and succeeds at t=3s.
     *
     * The loop gives up early once the run has exited, because then no container is ever going to appear
     * and waiting out the timeout would only delay the real error. That error is built after awaiting the
     * process *and* its output streams, so it carries what the container actually printed
     * (`Error: server config failed: ...`) rather than the empty buffer an immediate throw would show —
     * which is precisely the difference between a diagnosable failure and the daemon's bare
     * `No such container`.
     */
    async hostPort(containerPort: number, timeoutMs: number = 30_000): Promise<number> {
      const deadline = Date.now() + timeoutMs;
      let detail = '`docker port` was never able to answer';

      while (Date.now() < deadline) {
        const { code, stdout, stderr } = await new Deno.Command('docker', {
          args: ['port', name, `${containerPort}/tcp`],
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        const text = new TextDecoder().decode(stdout).trim();

        if (code === 0 && text !== '') {
          // `docker port` prints one `<ip>:<port>` line per mapping; a container published on both IPv4
          // and IPv6 prints two. The first is enough — they are the same container port.
          const match = /:(\d+)\s*$/.exec(text.split('\n')[0]);
          if (match === null) throw new Error(`Could not parse a host port out of \`docker port\` output: ${text}`);
          return Number(match[1]);
        }

        detail = new TextDecoder().decode(stderr).trim() || `\`docker port\` exited ${code} with no output`;
        if (!alive) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await exited.catch(() => {});
      await drained.catch(() => {});
      throw new Error(
        `Could not read the host port ${name} mapped ${containerPort}/tcp to.\n${detail}\n\n` +
          `Container output:\n${buffer}`,
      );
    },
    async stop(): Promise<void> {
      if (alive) {
        // `kill`, not `stop`: `stop` spends a 10-second SIGTERM grace period per container waiting for a
        // shutdown nothing here observes. Errors are swallowed because the container may have exited
        // between `alive` and this call.
        await new Deno.Command('docker', { args: ['kill', name], stdout: 'null', stderr: 'null' })
          .output().catch(() => {});
      }
      await exited;
      await drained;
    },
  };
}
