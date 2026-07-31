import { describe, it } from '@std/testing/bdd';

import {
  compileSnapshotFile,
  type CompileUnit,
  type Diagnostic,
  discoverCompileUnits,
  discoverSpecs,
  verifyCompileDiagnostics,
} from '@goast/test-harness';

import { profiles } from '../output-tests/profiles.ts';
import { compileRootDir } from './paths.ts';
import { runDenoCheck } from './runners/deno-check.ts';
import { runTsc } from './runners/tsc.ts';

/**
 * Tier 3 is opt-in, and this guard is what makes it so.
 *
 * `deno.json` includes all of `test/` in test discovery, so `deno task test` would otherwise find this
 * file and start a container — breaking the rule that tiers 1 and 2 never touch Docker. Registering no
 * tests at all, rather than registering skipped ones, keeps 782 ignored steps out of the everyday run.
 * `deno task test:compile` sets the variable.
 */
const enabled = (Deno.env.get('GOAST_COMPILE') ?? '') !== '';

/** TypeScript profiles that need no npm package, so they are checked on the host. */
const HOST_TS_PROFILES = new Set(['models', 'fetch-clients']);

const specs = enabled ? await discoverSpecs() : [];
const units = enabled ? await discoverCompileUnits(profiles, specs) : [];

const hostTsUnits = units.filter((u) => u.language === 'typescript' && HOST_TS_PROFILES.has(u.profile));

/**
 * Compiles once per group, then asserts once per unit.
 *
 * The compile step is its own `it` so that a build failure is reported as one failure naming the
 * group, rather than as the same error repeated by every unit in it.
 *
 * Guarded by `enabled` too, and not just the empty `hostTsUnits` array: with `enabled` false the
 * `describe` call below would still register one passing "compiles every host TypeScript unit" test
 * (trivially, over zero units), which is exactly the "782 ignored steps" this file exists to avoid —
 * a registered-and-passing test is not the same as no test, so the opt-in guard needs the whole
 * `describe` to not run at all.
 */
if (enabled) {
  describe('typescript/host (deno check)', () => {
    let results: Map<string, Diagnostic[]> | undefined;

    it('compiles every host TypeScript unit', async () => {
      results = await runDenoCheck(hostTsUnits);
    });

    for (const unit of hostTsUnits) {
      it(unit.id, async () => {
        await verifyUnit(unit, results);
      });
    }
  });
}

/** TypeScript profiles that pull in npm packages, so they are checked in the `node` container. */
const CONTAINER_TS_PROFILES = ['angular-services', 'k6-clients', 'easy-network-stub'] as const;

/**
 * Same shape as the host group above, one `describe` per profile so a build failure in one profile
 * doesn't stop the others from running. Guarded by `enabled` for the same reason as the host group: an
 * empty `CONTAINER_TS_PROFILES` filter still leaves `describe` itself registering a trivially-passing
 * "compiles every unit" test when `enabled` is false, which the opt-in guard must prevent outright.
 */
if (enabled) {
  for (const profile of CONTAINER_TS_PROFILES) {
    const profileUnits = units.filter((u) => u.language === 'typescript' && u.profile === profile);

    describe(`typescript/${profile} (tsc)`, () => {
      let results: Map<string, Diagnostic[]> | undefined;

      it('compiles every unit', async () => {
        results = await runTsc(profile, profileUnits);
      });

      for (const unit of profileUnits) {
        it(unit.id, async () => {
          await verifyUnit(unit, results);
        });
      }
    });
  }
}

async function verifyUnit(unit: CompileUnit, results: Map<string, Diagnostic[]> | undefined): Promise<void> {
  if (results === undefined) throw new Error('The compile step did not run; its failure is the real one.');
  const diagnostics = results.get(unit.id);
  if (diagnostics === undefined) {
    throw new Error(`No result for ${unit.id}. The runner must return an entry for every unit it is given.`);
  }
  await verifyCompileDiagnostics(compileSnapshotFile(compileRootDir, unit), diagnostics);
}
