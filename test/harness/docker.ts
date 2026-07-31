import { join, relative } from 'node:path';

import { walk } from '@std/fs/walk';

export type DockerMount = { source: string; target: string; readOnly?: boolean };

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
};

export type ContainerResult = { code: number; stdout: string; stderr: string };

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

/** The `docker run` argv, split out from {@link runContainer} so it can be asserted directly. */
export function dockerRunArgs(options: RunContainerOptions): string[] {
  const args = ['run', '--rm'];

  for (const mount of options.mounts ?? []) {
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

/** Runs a container to completion, killing it if `timeoutMs` expires. */
export async function runContainer(options: RunContainerOptions): Promise<ContainerResult> {
  await requireDocker();

  const process = new Deno.Command('docker', {
    args: dockerRunArgs(options),
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const timeout = setTimeout(() => {
    try {
      process.kill('SIGKILL');
    } catch {
      // Already exited; nothing to kill.
    }
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const { code, stdout, stderr } = await process.output();
    return {
      code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } finally {
    clearTimeout(timeout);
  }
}
