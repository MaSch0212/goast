/**
 * The container-side build for tier 4's `angular-services` leg: the tsconfig that compiles the committed
 * tree together with the handwritten driver, and the shell pipeline that makes the emitted JS runnable by
 * Node.
 *
 * Unlike the Kotlin legs' build modules (`test/integration/kotlin-clients/build.ts`) there is no dependency
 * declaration here at all: the `node` image installs every package at image-build time, so this module's
 * whole job is compilation and module-resolution plumbing.
 */
import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/** The generator profile this leg drives. */
export const PROFILE = 'angular-services';

/** Path under the committed `test/output/` tree holding the generated client. */
export const TREE_PATH = `typescript/${PROFILE}/integration/kitchen-sink`;

/** Container path the committed tree is mounted at, read-only. */
export const TREE_MOUNT = '/tree';
/** Container path the handwritten driver is mounted at, read-only. */
export const DRIVER_MOUNT = '/driver';
/** Container path the compiled JS is emitted to. Writable, and thrown away with the container. */
export const OUT_DIR = '/out';

/** Host path of the driver sources, mounted at {@link DRIVER_MOUNT}. */
export const DRIVER_DIR: string = join(repoRootDir, 'test', 'integration', 'angular-services', 'driver');

/**
 * Host path mounted at {@link TREE_MOUNT} — the *profile's kitchen-sink directory*, not `test/output/` as a
 * whole.
 *
 * That distinction is load-bearing. The driver imports `'../tree/services/pets.service'`, so `/tree` has to be
 * the directory that directly contains `services/`. Mounting `test/output/` instead would put the tree at
 * `/tree/typescript/angular-services/integration/kitchen-sink/services/…` and every driver import would fail
 * to resolve — and it would also drag the whole 8,000-file corpus into the `tsc` program via
 * `include: ['/tree/**\/*.ts']`, which is both slow and wrong.
 */
export const TREE_DIR: string = join(repoRootDir, 'test', 'output', ...TREE_PATH.split('/'));

/**
 * The tsconfig the container compiles with.
 *
 * Deliberately not the image's `tsconfig.base.json`: that one sets `noEmit` for tier 3's type-check-only
 * gate, and this leg has to produce runnable JavaScript. `rootDirs` is what makes `tsc` lay the two mounts
 * out side by side under `outDir`, so a driver importing `../tree/...` resolves at compile time against
 * `/tree` and at run time against `/out/tree` — see the plan's spike notes for why an absolute `/tree/...`
 * import compiles and then fails at run time.
 *
 * `experimentalDecorators` matters because the generated services carry `@Injectable()`. `emitDecoratorMetadata`
 * is not needed — the generated code injects through `inject()` calls rather than constructor parameters — but
 * it is harmless and matches the image's own base config, so it stays for consistency rather than being a
 * second thing to explain.
 */
export function driverTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ES2022', 'DOM'],
        strict: true,
        skipLibCheck: true,
        allowJs: true,
        noEmit: false,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        outDir: OUT_DIR,
        rootDirs: [TREE_MOUNT, DRIVER_MOUNT],
        typeRoots: ['/opt/goast/node_modules/@types'],
        types: ['node'],
      },
      include: [`${DRIVER_MOUNT}/driver.ts`, `${TREE_MOUNT}/**/*.ts`],
    },
    null,
    2,
  );
}

/**
 * The shell pipeline that compiles and then makes the emitted tree loadable by Node.
 *
 * Three things Node's ESM loader needs that `tsc` does not provide:
 *
 *   * **Extensions.** `tsc` copies a relative specifier through verbatim, so `'../utils/api-base-service'`
 *     survives into the emitted JS and Node refuses to resolve it. The `sed` adds `.js`, then collapses any
 *     `.js.js` so the pass is idempotent. Applied to `OUT_DIR` **only** — the committed tree is mounted
 *     read-only, and rewriting it would mean the leg no longer runs byte-identical reviewed output.
 *   * **A module type.** Without `{"type":"module"}` Node reads the emitted `.js` as CommonJS and the first
 *     `import` is a syntax error.
 *   * **A reachable `node_modules`.** `/out` shares no ancestor with `/opt/goast`, and Node's resolver walks
 *     upward from the importing file, so the symlink is what makes `@angular/core` resolvable from `/out`.
 *     Same mechanism the image's Dockerfile already documents for `/tree`.
 *
 * `tsc`'s exit code is deliberately ignored (`|| true`): the corpus is expected to type-check clean, but a
 * *type* error must not stop the run, because what this leg measures is runtime behaviour and a driver that
 * runs is more informative than a build that refused to. A real compile failure surfaces as a missing emitted
 * file and then as a Node module-not-found, with `tsc`'s own output already in the captured log.
 */
export function buildCommand(): string {
  return [
    `/opt/goast/node_modules/.bin/tsc -p ${OUT_DIR}/tsconfig.json || true`,
    `find ${OUT_DIR} -name '*.js' -exec sed -i -E "s#(from '[./][^']*)(')#\\1.js\\2#g; s#\\.js\\.js'#.js'#g" {} +`,
    `printf '{"type":"module"}' > ${OUT_DIR}/package.json`,
    `ln -sfn /opt/goast/node_modules ${OUT_DIR}/node_modules`,
  ].join(' && ');
}
