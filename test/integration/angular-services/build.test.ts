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

  // The leg's whole rationale is that a typed call *is* the assertion the generated signature is usable, and
  // the driver is in no Deno module graph, so this grep is the only thing enforcing it. Measured before the
  // guard existed: a `TS2353` in a driver call left the entire leg green.
  it('fails the build on a diagnostic in the driver while tolerating one in the generated tree', () => {
    const command = buildCommand();

    // Tolerated: `tsc`'s own exit code cannot fail the build, because tier 3 owns tree diagnostics.
    expect(command).toContain('|| true');
    // Enforced: a diagnostic naming the driver's file exits non-zero.
    expect(command).toContain(String.raw`grep -q 'driver\.ts('`);
    expect(command).toContain('exit 1');
    // And the output has to reach the caller, or the failure is undiagnosable.
    expect(command).toContain(`cat ${OUT_DIR}/tsc.log`);
  });

  // The committed tree is mounted read-only, and the leg's whole claim is that it runs byte-identical
  // reviewed output — so the build must not so much as name it. An earlier revision of this test looked for
  // `'/tree -name'` and `sed…/tree`, both of which passed vacuously: `/tree` appears nowhere in the command,
  // so those assertions would have held against an empty `buildCommand()` too.
  it('never references the mounted tree, and every mutation targets the out dir', () => {
    const command = buildCommand();

    expect(command, 'the build command must not touch the read-only tree').not.toContain(TREE_MOUNT);

    // Each of the three mutating steps, checked individually rather than trusting one grep of the whole
    // string: a `sed -i` or a redirect that lost its `OUT_DIR` prefix is exactly the regression this guards.
    for (const mutation of [/find (\S+) -name/, /printf [^>]*> ?(\S+)/, /ln -sfn \S+ (\S+)/]) {
      const match = mutation.exec(command);
      expect(match, `no step matched ${mutation}`).not.toBeNull();
      expect(match?.[1], `${mutation} writes outside ${OUT_DIR}`).toContain(OUT_DIR);
    }
  });
});
