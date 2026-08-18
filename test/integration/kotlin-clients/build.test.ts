import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

import { CASE_LINE_PREFIX, DRIVER_UNITS, parseCaseLines, synthesizeDriverBuild } from './build.ts';

describe('DRIVER_UNITS', () => {
  it('drives both client families on both Spring Boot lines', () => {
    expect(DRIVER_UNITS.map((u) => u.id)).toEqual([
      'okhttp3-clients@sb3',
      'okhttp3-clients@sb4',
      'spring-reactive-web-clients@sb3',
      'spring-reactive-web-clients@sb4',
    ]);
  });

  it('agrees on driverDir and driver within each family', () => {
    // A future fifth unit that half-populates these (a copy-paste that updates `family`/`variant` but
    // forgets `driverDir`/`driver`) would silently point two units in the same family at different
    // driver files. Grouping by family and asserting each group collapses to a single (driverDir,
    // driver) pair catches that at the table itself, before it ever reaches synthesizeDriverBuild.
    const byFamily = new Map<string, Set<string>>();
    for (const unit of DRIVER_UNITS) {
      const key = `${unit.driverDir}/${unit.driver}`;
      byFamily.set(unit.family, (byFamily.get(unit.family) ?? new Set()).add(key));
    }
    for (const [family, keys] of byFamily) {
      expect([...keys], `family "${family}" has inconsistent driverDir/driver across its units`).toHaveLength(1);
    }
  });
});

describe('synthesizeDriverBuild', () => {
  it('sources the committed tree and the driver, and nothing else', () => {
    const { build } = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers');

    expect(build).toContain('/output/kotlin/okhttp3-clients@sb3/integration/kitchen-sink');
    expect(build).toContain('/drivers/okhttp3/OkHttp3Driver.kt');
  });

  it('applies the variant BOM and the family dependencies', () => {
    const sb4 = synthesizeDriverBuild(DRIVER_UNITS[1], '/output', '/drivers').build;

    expect(sb4).toContain('spring-boot-dependencies:4.0.0');
    // The Jackson 3 module, which only this variant uses.
    expect(sb4).toContain('tools.jackson.module:jackson-module-kotlin');
  });

  it('adds the runtime JSON codec dependency for spring-reactive-web-clients only, per variant', () => {
    // `spring-reactive-web-clients` has no Jackson databind coordinate of its own — WebFlux's default
    // JSON codecs need it at runtime even though the generated code never imports it (see
    // RUNTIME_JSON_CODEC_DEPENDENCIES's doc comment) — so this driver-only line must be present, and at
    // the variant-appropriate Jackson major version.
    const reactiveSb3 = synthesizeDriverBuild(DRIVER_UNITS[2], '/output', '/drivers').build;
    expect(reactiveSb3).toContain('com.fasterxml.jackson.core:jackson-databind');
    expect(reactiveSb3).not.toContain('tools.jackson.core:jackson-databind');

    const reactiveSb4 = synthesizeDriverBuild(DRIVER_UNITS[3], '/output', '/drivers').build;
    expect(reactiveSb4).toContain('tools.jackson.core:jackson-databind');
    expect(reactiveSb4).not.toContain('com.fasterxml.jackson.core:jackson-databind');

    // okhttp3 already gets a Jackson databind artifact transitively through `jackson-module-kotlin`
    // (kotlinDependenciesFor's own `okhttp3-clients` entry), so this driver-only line would be
    // redundant there and must not appear.
    const okhttp3Sb3 = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers').build;
    expect(okhttp3Sb3).not.toContain('jackson-databind');
  });

  it("scopes the source set to this family's driver directory alone, not the other family's", () => {
    // Reads the `srcDirs(...)` line specifically, not the whole build text: a "Driver under test"
    // debug comment also names the correct driver file regardless of what `srcDirs` actually compiles,
    // so asserting against the full text would pass even if `srcDirs` pointed at the shared drivers
    // root (the exact bug this test exists to catch).
    const srcDirsLine = (build: string) => {
      const line = build.split('\n').find((l) => l.includes('.kotlin.srcDirs('));
      if (line === undefined) throw new Error(`No srcDirs(...) line found in build:\n${build}`);
      return line;
    };

    const okhttp3 = srcDirsLine(synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers').build);
    expect(okhttp3).toContain('/drivers/okhttp3');
    expect(okhttp3).not.toContain('/drivers/reactive');

    const reactive = srcDirsLine(synthesizeDriverBuild(DRIVER_UNITS[2], '/output', '/drivers').build);
    expect(reactive).toContain('/drivers/reactive');
    expect(reactive).not.toContain('/drivers/okhttp3');
  });

  it('names the main class after the driver file Kotlin actually compiles it to', () => {
    const okhttp3 = synthesizeDriverBuild(DRIVER_UNITS[0], '/output', '/drivers').build;
    expect(okhttp3).toContain('application');
    expect(okhttp3).toContain('mainClass.set("OkHttp3DriverKt")');

    const reactive = synthesizeDriverBuild(DRIVER_UNITS[2], '/output', '/drivers').build;
    expect(reactive).toContain('mainClass.set("ReactiveDriverKt")');
  });
});

describe('parseCaseLines', () => {
  it('takes only the sentinel-prefixed lines, ignoring Gradle noise', () => {
    const output = [
      '> Task :compileKotlin',
      `${CASE_LINE_PREFIX}{"caseId":"getPet/ok","result":{"id":"abc"}}`,
      'Downloading nothing, offline',
      `${CASE_LINE_PREFIX}{"caseId":"deletePet/noContent","result":{"status":204}}`,
      'BUILD SUCCESSFUL in 4s',
    ].join('\n');

    expect(parseCaseLines(output)).toEqual([
      { caseId: 'getPet/ok', result: { id: 'abc' } },
      { caseId: 'deletePet/noContent', result: { status: 204 } },
    ]);
  });

  it('throws on a sentinel line that is not valid JSON rather than dropping it', () => {
    expect(() => parseCaseLines(`${CASE_LINE_PREFIX}{oops`)).toThrow(CASE_LINE_PREFIX);
  });
});
