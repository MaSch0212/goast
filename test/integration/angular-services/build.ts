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
 *   * **A reachable `node_modules`.** Node's resolver walks upward from the importing file through every
 *     `node_modules` it finds. Stated honestly, this symlink is belt-and-braces rather than load-bearing:
 *     the image's Dockerfile already symlinks `/node_modules` at the filesystem root, which a file under
 *     `/out` reaches by walking up, so `@angular/core` would resolve without this line. It is kept because
 *     it makes the out-dir self-contained instead of depending on a root-level symlink two files away, and
 *     `-sfn` makes it idempotent. Do not cite it as the reason resolution works.
 *
 * **`tsc`'s exit code is ignored, but a driver diagnostic is not.** The two are different failures and were
 * conflated by an earlier revision of this function, which ended the compile with a bare `|| true`:
 *
 *   * A diagnostic in the **generated tree** must not stop the run. Tier 3 owns those — it records them as
 *     committed snapshots per profile — and what this leg measures is runtime behaviour, so a tree that
 *     type-checks imperfectly but runs is still informative.
 *   * A diagnostic in the **handwritten driver** must stop the run, because this whole target's rationale is
 *     that writing the call in typed TypeScript *is* the assertion that the generated signature is usable.
 *     That assertion is worth nothing if a driver which does not type-check still runs, and the driver is in
 *     no Deno module graph, so nothing else checks it. Measured before this guard existed: injecting
 *     `pets.getPet({ id: 'abc', bogusNotAParam: 1 })` — a `TS2353` — left the entire leg green with the
 *     artifacts unchanged.
 *
 * So `tsc`'s output is captured, echoed for the caller, and then grepped for the driver's own file. The grep
 * matches `driver.ts(`, which catches the diagnostic whether `tsc` prints the path absolute or relative to its
 * project directory; no file in the generated tree is named `driver.ts`.
 */
export function buildCommand(): string {
  return [
    // Captured rather than streamed, so the guard below can read it; `cat` puts it back in the container's
    // output either way, so a failure is diagnosable from the test's own error message.
    `/opt/goast/node_modules/.bin/tsc -p ${OUT_DIR}/tsconfig.json > ${OUT_DIR}/tsc.log 2>&1 || true`,
    `cat ${OUT_DIR}/tsc.log`,
    `if grep -q 'driver\\.ts(' ${OUT_DIR}/tsc.log; then echo 'DRIVER TYPE ERRORS — see the tsc output above'; exit 1; fi`,
    `find ${OUT_DIR} -name '*.js' -exec sed -i -E "s#(from '[./][^']*)(')#\\1.js\\2#g; s#\\.js\\.js'#.js'#g" {} +`,
    `printf '{"type":"module"}' > ${OUT_DIR}/package.json`,
    `ln -sfn /opt/goast/node_modules ${OUT_DIR}/node_modules`,
  ].join(' && ');
}
