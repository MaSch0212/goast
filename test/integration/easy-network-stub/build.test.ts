import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildCommand, DRIVER_MOUNT, driverTsConfig, OUT_DIR, READINESS_PATH, TREE_MOUNT } from './build.ts';

describe('driverTsConfig', () => {
  it('lays the two mounts out side by side under the out dir', () => {
    const config = JSON.parse(driverTsConfig());

    // Without both rootDirs entries, `tsc` roots the program at the common ancestor and the emitted
    // layout stops being `/out/driver` + `/out/tree`, which is what makes `'../tree/stubs'` resolve at
    // run time.
    expect(config.compilerOptions.rootDirs).toEqual([TREE_MOUNT, DRIVER_MOUNT]);
    expect(config.compilerOptions.outDir).toBe(OUT_DIR);
  });

  it('emits JavaScript rather than type-checking only', () => {
    // The image's own tsconfig.base.json sets noEmit for tier 3. Inheriting that silently would leave
    // /out empty and the server would fail with MODULE_NOT_FOUND, several minutes later.
    expect(JSON.parse(driverTsConfig()).compilerOptions.noEmit).toBe(false);
  });

  it('compiles the driver entry point and the whole generated tree', () => {
    expect(JSON.parse(driverTsConfig()).include).toEqual([`${DRIVER_MOUNT}/server.ts`, `${TREE_MOUNT}/**/*.ts`]);
  });

  it('provides the DOM lib, which the generated stubs need for Blob', () => {
    // `blobs.stubs.ts` types its body as `Blob` and `pets.stubs.ts` as `{ file: Blob; … }`.
    expect(JSON.parse(driverTsConfig()).compilerOptions.lib).toContain('DOM');
  });
});

describe('buildCommand', () => {
  it('starts the server in the foreground as the last thing it does', () => {
    // `exec` and not a background start: the container's main process must BE the server, or the
    // container exits as soon as the shell finishes and `waitForHttpReady` reports a dead container.
    expect(buildCommand().trimEnd().endsWith(`exec node ${OUT_DIR}/driver/server.js`)).toBe(true);
  });

  it('fails the build when a driver file has a type error, and not when the tree does', () => {
    const command = buildCommand();

    // The whole rationale of a handwritten typed driver is that writing the call IS the assertion that
    // the generated signature is usable. A driver that does not type-check but still runs makes the
    // assertion worthless — measured on the Angular leg, where a bogus argument left the leg green.
    expect(command).toContain(`${DRIVER_MOUNT}/`);
    expect(command).toContain('exit 1');
    // Tier 3 owns tree diagnostics and records them as snapshots; a tree that type-checks imperfectly
    // but runs is still informative here, so `tsc`'s own exit code must not stop the run.
    expect(command).toContain('|| true');
  });

  it('rewrites extensionless imports only under the out dir', () => {
    const command = buildCommand();

    // Rewriting under /tree would mean the leg no longer runs byte-identical reviewed output — and /tree
    // is mounted read-only, so it would fail at run time instead of being caught here.
    expect(command).toContain(`find ${OUT_DIR} -name '*.js'`);
    expect(command).not.toContain(`find ${TREE_MOUNT}`);
  });

  it('marks the emitted tree as ESM', () => {
    // Without this Node reads the emitted .js as CommonJS and the first `import` is a syntax error.
    expect(buildCommand()).toContain(`${OUT_DIR}/package.json`);
  });
});

describe('READINESS_PATH', () => {
  it('cannot collide with a generated route', () => {
    // Route regexes are suffix-anchored (`…/?$`, no `^`), so a readiness path that ends in a generated
    // route's shape would be swallowed by that stub instead of answering the readiness probe.
    expect(READINESS_PATH.startsWith('/__')).toBe(true);
  });
});
