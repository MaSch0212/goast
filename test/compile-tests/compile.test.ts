import { expect } from '@std/expect';
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
import { runKotlin } from './runners/kotlin.ts';
import { runTsc } from './runners/tsc.ts';

/**
 * Tier 3 is opt-in, and this guard is what makes it so.
 *
 * `deno.json` includes all of `test/` in test discovery, so `deno task test` would otherwise find this
 * file and start a container — breaking the rule that tiers 1 and 2 never touch Docker. Registering no
 * tests at all, rather than registering skipped ones, keeps 797 ignored steps out of the everyday run.
 * `deno task test:compile` sets the variable.
 */
const enabled = (Deno.env.get('GOAST_COMPILE') ?? '') !== '';

/** TypeScript profiles that need no npm package, so they are checked on the host. */
const HOST_TS_PROFILES = ['models', 'fetch-clients'] as const;

/** TypeScript profiles that pull in npm packages, so they are checked in the `node` container. */
const CONTAINER_TS_PROFILES = ['angular-services', 'k6-clients', 'easy-network-stub'] as const;

/**
 * Every Kotlin profile in the corpus, all compiled in one Gradle build.
 *
 * Listed explicitly rather than derived from `profiles.ts` so that adding a generator profile is a
 * deliberate act here: a new profile needs a `DEPENDENCIES` entry and matching warmup coordinates in
 * `runners/kotlin.ts` before it can compile at all, and silently picking it up would surface that as
 * a wall of unresolved-reference diagnostics attributed to the generator.
 *
 * "Deliberate act" only works if forgetting it is *loud*, which is what the reconciliation test below
 * is for — a profile in `profiles.ts` and in none of these three lists is discovered, never compiled,
 * and registers no test at all.
 */
const KOTLIN_PROFILES = [
  'models@sb3',
  'models@sb4',
  'okhttp3-clients@sb3',
  'okhttp3-clients@sb4',
  'spring-controllers@sb3',
  'spring-controllers@sb3-strict',
  'spring-controllers@sb4',
  'spring-controllers@sb4-strict',
  'spring-reactive-web-clients@sb3',
  'spring-reactive-web-clients@sb4',
] as const;

/**
 * The fewest units a healthy corpus can produce, below which the run is a harness failure.
 *
 * 797 units exist today (110 + 165 + 522). A floor tracking that number exactly would fail on every
 * corpus addition, and a floor of 1 would defend nothing — the shape being defended against is a
 * corpus that has *collapsed*: a renamed `test/output` subtree, a `profiles.ts` that throws before it
 * registers anything, a discovery walk that silently matches no directory. With `units` empty every
 * `describe` below still registers a passing "compiles every … unit" test over zero units, so the gate
 * reports green having compiled nothing.
 *
 * 700 is chosen as the largest round number below `797 - 110`: losing even the *smallest* of the three
 * execution groups outright leaves 687 and trips it, while ~80 units of slack absorbs the ordinary
 * removal of a spec or two (a spec is worth roughly 15 units across the profiles that generate it)
 * without a test edit. Per-group and per-profile emptiness is checked separately below, which is the
 * finer-grained guard; this is the blunt backstop for a shrink neither of those sees.
 */
const MINIMUM_UNITS = 700;

const specs = enabled ? await discoverSpecs() : [];
const units = enabled ? await discoverCompileUnits(profiles, specs) : [];

const hostTsUnits = units.filter((u) =>
  u.language === 'typescript' && (HOST_TS_PROFILES as readonly string[]).includes(u.profile)
);
const containerTsUnitsByProfile = new Map(
  CONTAINER_TS_PROFILES.map((profile) => [
    profile,
    units.filter((u) => u.language === 'typescript' && u.profile === profile),
  ]),
);
const kotlinUnits = units.filter((u) =>
  u.language === 'kotlin' && (KOTLIN_PROFILES as readonly string[]).includes(u.profile)
);

/**
 * Compiles once per group, then asserts once per unit.
 *
 * The compile step is its own `it` so that a build failure is reported as one failure naming the
 * group, rather than as the same error repeated by every unit in it.
 *
 * Both the host group and the per-profile container groups live under one `enabled` guard, not just the
 * empty `hostTsUnits`/`CONTAINER_TS_PROFILES` filters: with `enabled` false a `describe` call still
 * registers one passing "compiles every ... unit" test (trivially, over zero units), which is exactly
 * the "797 ignored steps" this file exists to avoid — a registered-and-passing test is not the same as
 * no test, so the opt-in guard needs every `describe` call to not run at all.
 *
 * The `unit discovery` block belongs inside the guard for the opposite reason: with `enabled` false,
 * discovery is deliberately skipped and `units` is deliberately empty, so its floor would fail on a
 * healthy repo.
 */
if (enabled) {
  /**
   * Every runner defends per-unit vacuity; nothing defended the unit list itself.
   *
   * These three tests are registered, not module-level assertions, so a mismatch is reported as a
   * named failure alongside the units rather than as a discovery error that aborts the whole file.
   */
  describe('unit discovery', () => {
    it(`discovers at least ${MINIMUM_UNITS} compile units`, () => {
      expect(units.length).toBeGreaterThanOrEqual(MINIMUM_UNITS);
    });

    it('assigns every discovered unit to exactly one execution group', () => {
      const grouped = [hostTsUnits, ...containerTsUnitsByProfile.values(), kotlinUnits].flat();
      const groupedIds = new Set(grouped.map((u) => u.id));

      // Set size against array length catches a unit claimed by two groups, which the bare sum would
      // hide by cancelling against a unit claimed by none.
      expect(groupedIds.size).toBe(grouped.length);

      const ungrouped = units.filter((u) => !groupedIds.has(u.id)).map((u) => u.id);
      expect(ungrouped).toEqual([]);
    });

    it('finds units for every profile the three group lists name', () => {
      const counts = new Map<string, number>();
      for (const unit of units) counts.set(unit.profile, (counts.get(unit.profile) ?? 0) + 1);

      const empty = [...HOST_TS_PROFILES, ...CONTAINER_TS_PROFILES, ...KOTLIN_PROFILES]
        .filter((profile) => (counts.get(profile) ?? 0) === 0);
      expect(empty).toEqual([]);
    });
  });

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

  for (const [profile, profileUnits] of containerTsUnitsByProfile) {
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

  describe('kotlin (gradle)', () => {
    let results: Map<string, Diagnostic[]> | undefined;

    it('compiles every Kotlin unit', async () => {
      results = await runKotlin(kotlinUnits);
    });

    for (const unit of kotlinUnits) {
      it(unit.id, async () => {
        await verifyUnit(unit, results);
      });
    }
  });
}

async function verifyUnit(unit: CompileUnit, results: Map<string, Diagnostic[]> | undefined): Promise<void> {
  if (results === undefined) throw new Error('The compile step did not run; its failure is the real one.');
  const diagnostics = results.get(unit.id);
  if (diagnostics === undefined) {
    throw new Error(`No result for ${unit.id}. The runner must return an entry for every unit it is given.`);
  }
  await verifyCompileDiagnostics(compileSnapshotFile(compileRootDir, unit), diagnostics);
}
