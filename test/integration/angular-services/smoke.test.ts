import { join } from 'node:path';

import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildImage, repoRootDir, requireDocker, runContainer, startRefServer } from '@goast/test-harness';

import { casesFor } from '../../cases/cases.ts';
import {
  buildCommand,
  DRIVER_DIR,
  DRIVER_MOUNT,
  driverTsConfig,
  OUT_DIR,
  PROFILE,
  TREE_DIR,
  TREE_MOUNT,
} from './build.ts';

/** Same gate as tier 4's other Docker legs: `deno task test` must never start a container on its own. */
const enabled = (Deno.env.get('GOAST_INTEGRATION') ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'node');

if (enabled) await requireDocker();

if (enabled) {
  describe(`integration/${PROFILE} smoke`, () => {
    it('compiles the generated tree and makes one real call through it', async () => {
      // Only `getPet/ok` is *queued*, deliberately, even though the driver now issues all 19 calls: this is
      // the infrastructure gate, and its job is to prove the compile-DI-network-decode chain works at all.
      // The other 18 calls land in the reference server's surplus bucket and are ignored here, which is fine
      // because nothing in this test reads `surplus` — `integration.test.ts` is what accounts for every case.
      // Keeping the queue at one case is also what lets the payload assertion below stay exact.
      const cases = casesFor(PROFILE, 'client').filter((c) => c.id === 'getPet/ok');
      expect(cases, 'getPet/ok is missing from the case table').toHaveLength(1);

      // `0.0.0.0`: the driver runs in a container and reaches the host through `host.docker.internal`, which
      // only routes to an interface the host actually bound.
      const server = await startRefServer(cases, { hostname: '0.0.0.0' });

      try {
        const image = await buildImage('node', CONTEXT_DIR);
        const result = await runContainer({
          image,
          // The image's ENTRYPOINT is tier 3's `check.mjs` type-checker; this leg needs a shell pipeline.
          entrypoint: 'sh',
          args: [
            '-c',
            `mkdir -p ${OUT_DIR} && printf '%s' '${
              driverTsConfig().replaceAll("'", "'\\''")
            }' > ${OUT_DIR}/tsconfig.json && ` +
            `${buildCommand()} && node ${OUT_DIR}/driver/driver.js http://host.docker.internal:${server.port}`,
          ],
          mounts: [
            { source: TREE_DIR, target: TREE_MOUNT, readOnly: true },
            { source: DRIVER_DIR, target: DRIVER_MOUNT, readOnly: true },
          ],
          hostGateway: true,
        });

        expect(result.timedOut, `the container timed out\n${result.stdout}${result.stderr}`).toBe(false);
        expect(result.code, `container exited ${result.code}\n${result.stdout}\n${result.stderr}`).toBe(0);
        expect(result.stdout, 'no case line was printed').toContain('##GOAST-CASE##');
        // The payload proves the whole chain: DI built the service, the service reached the host, and the
        // response was decoded. A weaker assertion here would let a driver that printed a line without
        // making a request pass.
        expect(result.stdout).toContain('"result":{"id":"abc","name":"Rex"}');

        expect([...server.recorded.keys()], 'the server never saw the request').toEqual(['getPet/ok']);
      } finally {
        await server.close();
      }
    });
  });
}
