import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildImage, repoRootDir, type RunningContainer, startContainer, waitForHttpReady } from '@goast/test-harness';

import {
  CONTEXT_DIR,
  IMPLEMENTATION_MOUNT,
  IMPLEMENTATIONS_DIR,
  RUN_COMMAND,
  SEED_MOUNT,
  SERVER_PORT,
  SERVER_PROJECT,
  type ServerUnit,
  synthesizeServerBuild,
  TREE_MOUNT,
} from './build.ts';

/**
 * Builds and starts one unit's server in a container, waits until it answers the readiness probe, runs `body` with
 * its base URL and stops it again.
 *
 * `dotnet run` compiles the generated tree and the implementations before the app starts, so the first request cannot
 * be sent for a while on a cold run; readiness is what separates "still compiling" from "dead".
 */
export async function withServer<T>(
  unit: ServerUnit,
  body: (baseUrl: string, container: RunningContainer) => Promise<T>,
): Promise<T> {
  const image = await buildImage('csharp', CONTEXT_DIR);
  const { project, nugetConfig } = synthesizeServerBuild(unit, TREE_MOUNT, IMPLEMENTATION_MOUNT);
  const seedDir = await mkdtemp(join(tmpdir(), 'goast-csharp-server-'));

  try {
    await writeFile(join(seedDir, `${SERVER_PROJECT}.csproj`), project);
    await writeFile(join(seedDir, 'nuget.config'), nugetConfig);

    const container = await startContainer({
      image,
      // The image ENTRYPOINT builds tier 3's solution; this copies the seed the same way and then *runs* the project.
      entrypoint: 'sh',
      args: ['-c', RUN_COMMAND],
      mounts: [
        { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
        { source: IMPLEMENTATIONS_DIR, target: IMPLEMENTATION_MOUNT, readOnly: true },
        { source: seedDir, target: SEED_MOUNT, readOnly: true },
      ],
      workdir: '/work',
      publish: [{ containerPort: SERVER_PORT }],
    });

    try {
      const port = await container.hostPort(SERVER_PORT);
      await waitForHttpReady(`http://127.0.0.1:${port}/__goast-readiness`, {
        timeoutMs: 8 * 60 * 1000,
        isAlive: () => container.running(),
        describeDeath: () => container.output(),
      });
      return await body(`http://127.0.0.1:${port}`, container);
    } finally {
      await container.stop();
    }
  } finally {
    // Best effort, never allowed to throw: a throw from here would replace whatever the run determined.
    await rm(seedDir, { recursive: true, force: true }).catch((error: unknown) => {
      console.warn(`could not remove ${seedDir}: ${error instanceof Error ? error.message : error}`);
    });
  }
}
