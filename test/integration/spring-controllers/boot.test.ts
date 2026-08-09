import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, startContainer, waitForHttpReady } from '@goast/test-harness';

import {
  DELEGATE_MOUNT,
  DELEGATES_DIR,
  SERVER_PORT,
  SERVER_UNITS,
  synthesizeServerBuild,
  TREE_MOUNT,
  WORK_MOUNT,
} from './build.ts';

/** Same gate as the rest of tier 4's Docker legs: `deno task test` must never start a container. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');

if (enabled) await requireDocker();

if (enabled) {
  describe('integration/spring-controllers boot', () => {
    // One unit, not all four: this asserts the *infrastructure* — offline resolution, the `run` task, the
    // published port, readiness polling, and that the generated controllers are component-scanned and
    // mapped. Nothing here is profile-specific, and `integration.test.ts` covers all four anyway.
    const unit = SERVER_UNITS[0];

    it('boots the generated server and routes a request to it', async () => {
      const image = await buildImage('kotlin', CONTEXT_DIR);
      const { settings, build } = synthesizeServerBuild(unit, TREE_MOUNT, DELEGATE_MOUNT);
      const workDir = await Deno.makeTempDir({ prefix: 'goast-server-' });

      try {
        await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
        await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

        const container = await startContainer({
          image,
          // The image's ENTRYPOINT pins tier 3's `compileKotlin`; this needs `run`.
          entrypoint: 'gradle',
          args: ['--no-daemon', '--offline', 'run', '--quiet'],
          mounts: [
            { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
            { source: DELEGATES_DIR, target: DELEGATE_MOUNT, readOnly: true },
            { source: workDir, target: WORK_MOUNT },
          ],
          workdir: WORK_MOUNT,
          publish: [{ containerPort: SERVER_PORT }],
        });

        try {
          const port = await container.hostPort(SERVER_PORT);
          await waitForHttpReady(`http://127.0.0.1:${port}/__goast-readiness`, {
            timeoutMs: 8 * 60 * 1000,
            isAlive: () => container.running(),
            describeDeath: () => container.output(),
          });

          const response = await fetch(`http://127.0.0.1:${port}/pets/abc`);
          await response.body?.cancel();

          // Not a specific status: this file has to keep passing once Task 5 replaces the generated
          // `501` defaults with real delegates that answer `200`. `404` is the failure that matters —
          // it means the generated controllers were never mapped, which is the one thing about this
          // wiring that could silently be wrong while the app still starts.
          expect(response.status, `GET /pets/abc\n${container.output()}`).not.toBe(404);
        } finally {
          await container.stop();
        }
      } finally {
        // Best effort, never allowed to throw: the container writes root-owned `build/` and `.gradle/`
        // trees into this bind mount on Linux, and a throw from here would replace whatever the run
        // actually determined — including a legitimate pass — with an unrelated `PermissionDenied`.
        await Deno.remove(workDir, { recursive: true }).catch((error: unknown) => {
          console.warn(`could not remove ${workDir}: ${error instanceof Error ? error.message : error}`);
        });
      }
    });
  });
}
