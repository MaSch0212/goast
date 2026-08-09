/**
 * The container-side build for tier 4's `easy-network-stub` leg: the tsconfig that compiles the committed
 * tree together with the handwritten driver, and the shell pipeline that makes the emitted JS runnable — and,
 * unlike `angular-services`, keeps running as the thing the host drives with HTTP requests.
 *
 * This is a **server**-direction leg: the generated stubs register routes and answer them, so the container's
 * job is not "compile and exit" but "compile and then be a server". `buildCommand()` reflects that: it ends by
 * `exec`ing the server instead of finishing after the compile step.
 */
import { join } from 'node:path';

import { repoRootDir } from '@goast/test-harness';

/** The generator profile this leg drives. */
export const PROFILE = 'easy-network-stub';

/** Path under the committed `test/output/` tree holding the generated stubs. */
export const TREE_PATH = `typescript/${PROFILE}/integration/kitchen-sink`;

/** Container path the committed tree is mounted at, read-only. */
export const TREE_MOUNT = '/tree';
/** Container path the handwritten driver is mounted at, read-only. */
export const DRIVER_MOUNT = '/driver';
/** Container path the compiled JS is emitted to. Writable, and thrown away with the container. */
export const OUT_DIR = '/out';

/** Port the driver's `node:http` server listens on inside the container. */
export const SERVER_PORT = 8080;

/**
 * Path the driver answers unconditionally, before consulting the generated stub.
 *
 * Route regexes the generated stubs register are suffix-anchored only (`…/?$`, no `^`), so a readiness path
 * that merely avoided colliding with a *literal* generated route would still risk being swallowed by one
 * whose pattern happens to match its suffix. The `__` prefix keeps it out of the `/api/...`-shaped space the
 * generated routes live in entirely, rather than relying on no case ever choosing this exact path.
 */
export const READINESS_PATH = '/__goast-readiness';

/** Host path of the driver sources, mounted at {@link DRIVER_MOUNT}. */
export const DRIVER_DIR: string = join(repoRootDir, 'test', 'integration', PROFILE, 'driver');

/**
 * Host path mounted at {@link TREE_MOUNT} — the *profile's kitchen-sink directory*, not `test/output/` as a
 * whole.
 *
 * That distinction is load-bearing. The driver imports `'../tree/stubs'`, so `/tree` has to be the directory
 * that directly contains `stubs.ts`. Mounting `test/output/` instead would put the tree at
 * `/tree/typescript/easy-network-stub/integration/kitchen-sink/stubs.ts` and every driver import would fail
 * to resolve — and it would also drag the whole corpus into the `tsc` program via `include: ['/tree/**\/*.ts']`,
 * which is both slow and wrong.
 */
export const TREE_DIR: string = join(repoRootDir, 'test', 'output', ...TREE_PATH.split('/'));

/**
 * The tsconfig the container compiles with.
 *
 * Deliberately not the image's `tsconfig.base.json`: that one sets `noEmit` for tier 3's type-check-only
 * gate, and this leg has to produce runnable JavaScript that the container then executes. `rootDirs` is what
 * makes `tsc` lay the two mounts out side by side under `outDir`, so a driver importing `../tree/...` resolves
 * at compile time against `/tree` and at run time against `/out/tree` — see the plan's spike notes for why an
 * absolute `/tree/...` import compiles and then fails at run time.
 *
 * No `experimentalDecorators`/`emitDecoratorMetadata`, unlike the Angular leg's tsconfig: nothing in this
 * profile is decorated — `EasyNetworkStubBase` subclasses register routes through plain method calls.
 *
 * `include` names `server.ts` rather than every driver file: it is the entry point, and `tsc` pulls
 * `adapter.ts`, `expectations.ts`, and `stubs.ts` in on its own through the import graph, the same way a
 * `node:http` `import` chain would at run time.
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
        outDir: OUT_DIR,
        rootDirs: [TREE_MOUNT, DRIVER_MOUNT],
        typeRoots: ['/opt/goast/node_modules/@types'],
        types: ['node'],
      },
      include: [`${DRIVER_MOUNT}/server.ts`, `${TREE_MOUNT}/**/*.ts`],
    },
    null,
    2,
  );
}

/**
 * The shell pipeline that writes the tsconfig, compiles, makes the emitted tree loadable by Node, and then
 * hands off to the server it just compiled.
 *
 * **The tsconfig is written by the command itself**, via a heredoc whose terminator is quoted
 * (`<<'GOAST_TSCONFIG'`), so the shell performs no expansion — `$`, backticks, and quotes inside the JSON pass
 * through untouched. The Angular leg wrote its tsconfig from the host into a writable bind mount; this leg has
 * no writable host mount at all, both mounts here are read-only, so the tsconfig has to be produced inside the
 * container instead.
 *
 * **The join right after the heredoc cannot be `&&`.** `sh`'s heredoc grammar recognizes a terminator only
 * when an entire line is nothing but the delimiter, so a naive `.join(' && ')` across every step — which is
 * what a first draft of this function did, copying the Angular leg's uniform join — appends `&& next-command`
 * onto the *same line* as `GOAST_TSCONFIG`. That line is then no longer just the delimiter, so it is never
 * recognized as the terminator at all: `sh` keeps reading, folding the rest of the pipeline into the heredoc's
 * body instead of executing it. Measured against this image's `ash` (alpine's `/bin/sh`) with the draft
 * command: the container exited `0` with **zero output**, including no `##LISTENING##`, no `tsc.log`, nothing
 * — because everything from the `tsc` invocation onward had silently become text piped into `cat`, and no
 * command after the heredoc ever ran. This is exactly the failure mode the plan warned "reading the command
 * cannot catch." The fix is a plain newline in that one spot instead: the terminator line stays pure, and the
 * `tsc` invocation starts as a fresh statement rather than a continuation of one, which is valid `sh` without
 * an `&&`/`||` prefix. The cost is that a failure to write the tsconfig itself does not short-circuit `tsc`
 * the way every other step short-circuits its neighbor — moot in practice, since the only way `cat` fails to
 * write into `/out` is `mkdir -p ${OUT_DIR}` (the step immediately before it, and still `&&`-gated) failing
 * first, and a missing tsconfig then simply gives `tsc` its own diagnostic, still absorbed by the `|| true`
 * below and still caught downstream by `exec node .../server.js` failing loudly with `MODULE_NOT_FOUND`.
 *
 * Three things Node's ESM loader needs that `tsc` does not provide, exactly as in the Angular leg:
 *
 *   * **Extensions.** `tsc` copies a relative specifier through verbatim, so `'../tree/stubs'` survives into
 *     the emitted JS and Node refuses to resolve it. The `sed` adds `.js`, then collapses any `.js.js` so the
 *     pass is idempotent. Applied to `OUT_DIR` **only** — the committed tree is mounted read-only, and
 *     rewriting it would mean the leg no longer runs byte-identical reviewed output.
 *   * **A module type.** Without `{"type":"module"}` Node reads the emitted `.js` as CommonJS and the first
 *     `import` is a syntax error.
 *   * **A reachable `node_modules`.** The image's Dockerfile already symlinks `/node_modules` at the
 *     filesystem root, which a file under `/out` reaches by walking up, so this symlink is belt-and-braces
 *     rather than load-bearing — kept so the out-dir is self-contained rather than depending on a root-level
 *     symlink two files away.
 *
 * **`tsc`'s exit code is ignored, but a driver diagnostic is not** — the same distinction the Angular leg's
 * guard draws, for the same reason: a diagnostic in the generated **tree** must not stop the run (tier 3 owns
 * those as committed snapshots, and a tree that type-checks imperfectly but runs is still informative here),
 * while a diagnostic in the handwritten **driver** must, because the driver is in no Deno module graph and a
 * driver call that does not type-check but still runs makes the whole leg's premise worthless. The guard
 * differs from the Angular leg's only in what it greps for: the driver there is a single `driver.ts`, so
 * `driver\.ts(` pins the diagnostic to that file. Here the driver is four files (`adapter.ts`, `server.ts`,
 * `expectations.ts`, `stubs.ts`), so the guard greps for the mount path instead. Measured (not, as first
 * assumed, because `tsc` prints absolute paths for files outside the `-p` project's root): this image's `tsc`
 * actually prints driver diagnostics **relative to the container's `cwd`**, `/opt/goast` — e.g.
 * `../../driver/server.ts(4,7): error TS2322: ...` — which still contains the literal substring `/driver/`
 * because `/driver` sits two levels up from `/opt/goast`. A tree diagnostic's relative path would equally
 * contain `/tree/`, never `/driver/`, so the grep is just as unambiguous either way; the reasoning only needed
 * correcting, not the guard itself.
 *
 * **Ends by starting the server in the foreground**, unlike the Angular leg, which ends after compiling. This
 * leg's container *is* the thing under test — the host drives it with real HTTP requests — so the compiled
 * server has to become the container's main process (`exec`, not a backgrounded start) or the container exits
 * the moment the shell finishes and the host's readiness probe finds a dead container instead of a live one.
 */
export function buildCommand(): string {
  // Everything up to and including the heredoc that writes the tsconfig. `&&`-joined like every other
  // boundary: if `mkdir` fails, the write is skipped and the heredoc's own body is still consumed as inert
  // text by the parser (heredoc content is lexical, not conditional on the command actually running).
  const setup = [
    `mkdir -p ${OUT_DIR}`,
    `cat > ${OUT_DIR}/tsconfig.json <<'GOAST_TSCONFIG'\n${driverTsConfig()}\nGOAST_TSCONFIG`,
  ].join(' && ');

  // Compile, gate on driver diagnostics, make the output loadable, and become the server. `&&`-joined among
  // themselves — this half has no heredoc, so the uniform join is safe here.
  const compileAndServe = [
    `/opt/goast/node_modules/.bin/tsc -p ${OUT_DIR}/tsconfig.json > ${OUT_DIR}/tsc.log 2>&1 || true`,
    `cat ${OUT_DIR}/tsc.log`,
    `if grep -q '${DRIVER_MOUNT}/' ${OUT_DIR}/tsc.log; then echo 'DRIVER TYPE ERRORS — see the tsc output above'; exit 1; fi`,
    `find ${OUT_DIR} -name '*.js' -exec sed -i -E "s#(from '[./][^']*)(')#\\1.js\\2#g; s#\\.js\\.js'#.js'#g" {} +`,
    `printf '{"type":"module"}' > ${OUT_DIR}/package.json`,
    `ln -sfn /opt/goast/node_modules ${OUT_DIR}/node_modules`,
    `exec node ${OUT_DIR}/driver/server.js`,
  ].join(' && ');

  // The join between the two halves is a bare newline, not `&&` — see the doc comment above for why an
  // `&&` here specifically is silently swallowed into the heredoc instead of chaining to `tsc`.
  return `${setup}\n${compileAndServe}`;
}
