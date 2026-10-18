/**
 * The container-side build for tier 4's `go-clients` leg: copies the committed kitchen-sink tree and the
 * handwritten driver into one module, builds it, and runs it against the reference server.
 */
import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/** The tier-4 profile this leg records, under `test/wire/`. The tier-2 profile is `go/clients`. */
export const PROFILE = 'go-clients';

/** Path under the committed `test/output/` tree holding the generated clients, the directory containing `api/` and `client/`. */
export const TREE_PATH = 'go/clients/integration/kitchen-sink';

/** Container path the committed tree is mounted at, read-only. */
export const TREE_MOUNT = '/tree';
/** Container path the handwritten driver is mounted at, read-only. */
export const DRIVER_MOUNT = '/driver';
/** Container path the module is assembled and built in. Writable, and thrown away with the container. */
export const APP_DIR = '/app';

/** The module path the generators use by default, which the driver's imports of `/api` and `/client` rely on. */
export const MODULE_PATH = 'example.com/generated';

/** Host path of the driver sources, mounted at {@link DRIVER_MOUNT}. */
export const DRIVER_DIR: string = join(repoRootDir, 'test', 'integration', PROFILE, 'driver');

/** Host path mounted at {@link TREE_MOUNT}. */
export const TREE_DIR: string = join(repoRootDir, 'test', 'output', ...TREE_PATH.split('/'));

/**
 * The shell command the container runs.
 *
 * The mounts are read-only, so the tree and the driver are copied into {@link APP_DIR}, which gets a `go.mod`
 * for {@link MODULE_PATH}. The driver goes into its own `cmd/driver` package next to the generated `api` and
 * `client` packages. The build needs nothing beyond the standard library, which the `go` image has already
 * compiled, so it runs offline. The last step runs the driver, which reads `GOAST_BASE_URL` and prints one case
 * line per case.
 */
export function buildCommand(): string {
  return [
    'set -e',
    `mkdir -p ${APP_DIR}/cmd/driver`,
    `cp -R ${TREE_MOUNT}/. ${APP_DIR}/`,
    `cp ${DRIVER_MOUNT}/*.go ${APP_DIR}/cmd/driver/`,
    `printf 'module ${MODULE_PATH}\\n\\ngo 1.22\\n' > ${APP_DIR}/go.mod`,
    `cd ${APP_DIR}`,
    `go build -o ${APP_DIR}/driver ./cmd/driver`,
    `exec ${APP_DIR}/driver`,
  ].join('\n');
}
