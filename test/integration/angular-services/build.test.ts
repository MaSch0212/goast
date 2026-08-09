import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { buildCommand, DRIVER_MOUNT, driverTsConfig, OUT_DIR, PROFILE, TREE_MOUNT, TREE_PATH } from './build.ts';

describe('angular-services build module', () => {
  it('names the profile and its committed tree path consistently', () => {
    expect(PROFILE).toBe('angular-services');
    expect(TREE_PATH).toBe(`typescript/${PROFILE}/integration/kitchen-sink`);
  });

  it('compiles the tree and the driver into one program rooted at both mounts', () => {
    const config = JSON.parse(driverTsConfig()) as {
      compilerOptions: Record<string, unknown>;
      include: string[];
    };

    expect(config.compilerOptions.outDir).toBe(OUT_DIR);
    expect(config.compilerOptions.rootDirs).toEqual([TREE_MOUNT, DRIVER_MOUNT]);
    expect(config.include).toEqual([`${DRIVER_MOUNT}/driver.ts`, `${TREE_MOUNT}/**/*.ts`]);
  });

  // Emitting is the whole point: tier 3 type-checks with `noEmit`, this has to produce runnable JS.
  it('emits rather than only type-checking, and keeps decorators working', () => {
    const { compilerOptions } = JSON.parse(driverTsConfig()) as { compilerOptions: Record<string, unknown> };

    expect(compilerOptions.noEmit).toBe(false);
    expect(compilerOptions.experimentalDecorators).toBe(true);
    expect(compilerOptions.module).toBe('ESNext');
  });

  it('marks the out dir as an ES module and links the image node_modules into it', () => {
    const command = buildCommand();

    expect(command).toContain(`"type":"module"`);
    expect(command).toContain(`${OUT_DIR}/node_modules`);
  });

  // Node's ESM loader will not resolve an extensionless relative specifier. The rewrite is applied to the
  // *emitted* JS only; the committed tree is mounted read-only and must never be touched.
  it('adds .js extensions to emitted relative imports, idempotently', () => {
    const command = buildCommand();

    expect(command).toContain(OUT_DIR);
    // Both substitutions asserted as the literal `sed` script text they actually are. Written with
    // `String.raw` because the dots are regex-escaped in the emitted shell — an earlier revision of this
    // test looked for the unescaped `.js.js` and failed against a correct implementation.
    expect(command).toContain(String.raw`s#(from '[./][^']*)(')#\1.js\2#g`);
    // The second substitution is what makes a re-run safe rather than producing `.js.js`.
    expect(command).toContain(String.raw`s#\.js\.js'#.js'#g`);
  });

  it('does not write anything into the mounted tree', () => {
    expect(buildCommand()).not.toContain(`${TREE_MOUNT} -name`);
    expect(buildCommand()).not.toMatch(new RegExp(`sed[^|;]*${TREE_MOUNT}`));
  });
});
