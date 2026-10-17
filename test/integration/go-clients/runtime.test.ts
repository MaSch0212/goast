/**
 * Compiles and tests the client runtime asset on its own: `gofmt`, `go vet` and `go test` over
 * `client_runtime.go` and its handwritten test, in the `go` container.
 */
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildImage, repoRootDir, requireDocker, runContainer } from '@goast/test-harness';

/** Same gate as tier 4's other Docker legs. `pnpm test:integration:go-clients` sets this. */
const enabled = (process.env.GOAST_INTEGRATION ?? '') !== '';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'go');
const ASSET_DIR = join(repoRootDir, 'packages', 'go', 'assets', 'clients');
const TEST_DIR = join(repoRootDir, 'test', 'integration', 'go-clients', 'runtime');

/** Container path the package is assembled and tested in. Writable, and thrown away with the container. */
const WORK_DIR = '/work/client';

// Checked once, before the first container: a missing daemon should fail immediately.
if (enabled) await requireDocker();

describe.skipIf(!enabled)('integration/go-clients runtime', () => {
  it('is gofmt-clean, passes go vet and its Go tests', async () => {
    const image = await buildImage('go', CONTEXT_DIR);
    const script = [
      'set -e',
      `mkdir -p ${WORK_DIR}`,
      `cp /asset/client_runtime.go /test/client_runtime_test.go ${WORK_DIR}/`,
      `printf 'module example.com/generated\\n\\ngo 1.22\\n' > ${WORK_DIR}/go.mod`,
      `cd ${WORK_DIR}`,
      'unformatted=$(gofmt -l .)',
      'if [ -n "$unformatted" ]; then echo "not gofmt-formatted: $unformatted"; exit 1; fi',
      'go vet .',
      'go test .',
    ].join('\n');

    const { code, stdout, stderr, timedOut } = await runContainer({
      image,
      entrypoint: 'sh',
      args: ['-c', script],
      mounts: [
        { source: ASSET_DIR, target: '/asset', readOnly: true },
        { source: TEST_DIR, target: '/test', readOnly: true },
      ],
    });

    expect(timedOut, `the Go checks timed out.\n\n${stdout}${stderr}`).toBe(false);
    expect(code, `the Go checks failed.\n\n${stdout}${stderr}`).toBe(0);
  });
});
