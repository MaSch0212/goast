/**
 * Synthesizes the one-project-per-unit Gradle build that runs a Kotlin driver against the reference
 * server, and parses the sentinel-prefixed case lines a driver run reports.
 *
 * Deliberately not tier 3's `synthesizeGradleBuild` (`test/compile-tests/runners/kotlin.ts`): tier 3
 * compiles every unit in one multi-project build with `--continue` so a broken unit cannot stop the
 * others from being checked. A driver here has to *run* — it makes real network calls against a
 * reference server and prints its own case results — so it needs its own process, its own stdout, and
 * its own failure that cannot be masked by another unit's success. Hence one single-project build per
 * unit, run one at a time, rather than a shared multi-project build.
 */
import { KOTLIN_BOM, kotlinDependenciesFor } from '@goast/test-harness';

/** One (client family, Spring Boot variant) pair this phase drives against the reference server. */
export type DriverUnit = {
  /** `<family>@<variant>`, matching the profile name used elsewhere in the corpus. */
  id: string;
  /** The generator profile name; identical to `id` here since neither family has a `-strict` sibling. */
  profile: string;
  /** The client family, e.g. `okhttp3-clients`. Looked up in `kotlinDependenciesFor`. */
  family: string;
  /** Which Spring Boot line the unit is generated against. */
  variant: 'sb3' | 'sb4';
  /** Path under the committed `test/output/` tree holding the generated client code for this unit. */
  treePath: string;
  /**
   * Directory under the mounted drivers root holding this unit's driver, one per family. Kept separate
   * from every other family's directory: a shared drivers directory would put both `OkHttp3Driver.kt`
   * and `ReactiveDriver.kt` in one project's source set, and each imports symbols that only exist in
   * its own family's generated tree, so the other driver in that set would fail to resolve.
   */
  driverDir: string;
  /** File name of the hand-written driver that exercises this unit's generated API. */
  driver: string;
};

/**
 * The four units this phase drives: both client families, crossed with both Spring Boot lines.
 *
 * `okhttp3-clients` and `spring-reactive-web-clients` do not share a driver — their generated API
 * shapes differ (client classes vs. `WebClient` extension functions), so each family gets its own
 * driver file, reused across both variants since a variant only changes the dependency set, not the
 * generated declaration shape.
 */
export const DRIVER_UNITS: readonly DriverUnit[] = [
  {
    id: 'okhttp3-clients@sb3',
    profile: 'okhttp3-clients@sb3',
    family: 'okhttp3-clients',
    variant: 'sb3',
    treePath: 'kotlin/okhttp3-clients@sb3/integration/kitchen-sink',
    driverDir: 'okhttp3',
    driver: 'OkHttp3Driver.kt',
  },
  {
    id: 'okhttp3-clients@sb4',
    profile: 'okhttp3-clients@sb4',
    family: 'okhttp3-clients',
    variant: 'sb4',
    treePath: 'kotlin/okhttp3-clients@sb4/integration/kitchen-sink',
    driverDir: 'okhttp3',
    driver: 'OkHttp3Driver.kt',
  },
  {
    id: 'spring-reactive-web-clients@sb3',
    profile: 'spring-reactive-web-clients@sb3',
    family: 'spring-reactive-web-clients',
    variant: 'sb3',
    treePath: 'kotlin/spring-reactive-web-clients@sb3/integration/kitchen-sink',
    driverDir: 'reactive',
    driver: 'ReactiveDriver.kt',
  },
  {
    id: 'spring-reactive-web-clients@sb4',
    profile: 'spring-reactive-web-clients@sb4',
    family: 'spring-reactive-web-clients',
    variant: 'sb4',
    treePath: 'kotlin/spring-reactive-web-clients@sb4/integration/kitchen-sink',
    driverDir: 'reactive',
    driver: 'ReactiveDriver.kt',
  },
];

/**
 * The two runtime coroutine coordinates the image's warm dependency cache was extended with (Task 3),
 * pinned to the exact versions warmed so the offline `runtimeClasspath` resolution the `run` task
 * performs has a chance of finding them. Not sourced from `kotlinDependenciesFor`: that table only
 * covers what tier 3's `compileClasspath` resolution needs, and coroutines are a driver-only runtime
 * concern no compiled unit imports.
 */
const RUNTIME_COROUTINE_DEPENDENCIES: readonly string[] = [
  'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")',
  'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")',
];

/**
 * A runtime-only JSON codec, needed only by `spring-reactive-web-clients`.
 *
 * `kotlinDependenciesFor('spring-reactive-web-clients', …)` deliberately carries no Jackson databind
 * coordinate: the generated tree never imports it directly, because WebFlux's default
 * `Jackson2JsonEncoder`/`Jackson2JsonDecoder` are wired up through `spring-web`'s *optional* dependency
 * on it, and Gradle does not pull an optional Maven dependency in transitively. That gap is invisible to
 * tier 3 — the compile gate never runs a line of generated code — but running this driver hits it on
 * essentially every JSON-bodied call: `UnsupportedMediaTypeException: Content type 'application/json'
 * not supported for bodyType=...`, on both the request-encode and response-decode side. A real caller of
 * this generated client would hit the identical wall the moment they used it outside a Spring Boot
 * starter (which bundles `jackson-databind` transitively via `spring-boot-starter-json`) — no change to
 * the generated declaration shape could route around it, so this is a driver-only *runtime* dependency
 * gap, the same kind of gap `RUNTIME_COROUTINE_DEPENDENCIES` above already exists to close, not a
 * `kotlinDependenciesFor` entry.
 *
 * Verified directly against the warm image before adding this: `sb3`/`sb4` in
 * `test/docker/kotlin/warmup/build.gradle.kts` already resolve `jackson-module-kotlin` for the okhttp3
 * family inside the very same configuration, which pulls the matching Jackson databind artifact
 * transitively at whichever version each Spring Boot BOM manages it at — so this coordinate, version-less
 * and BOM-managed exactly like the platform import beside it, resolves offline with nothing new to warm.
 *
 * Applied only to `spring-reactive-web-clients` units in {@link synthesizeDriverBuild} (guarded by
 * `unit.family`), not unconditionally to all four: the okhttp3 family already gets this artifact
 * transitively through `jackson-module-kotlin` (see `kotlinDependenciesFor`'s `okhttp3-clients` entry),
 * so adding it there again would be redundant rather than closing a real gap, and the guard lets the
 * build state its own reason instead of relying on a comment to explain harmless duplication.
 */
const RUNTIME_JSON_CODEC_DEPENDENCIES: Readonly<Record<'sb3' | 'sb4', string>> = {
  sb3: 'add("implementation", "com.fasterxml.jackson.core:jackson-databind")',
  sb4: 'add("implementation", "tools.jackson.core:jackson-databind")',
};

/**
 * Generates the settings and build scripts for one driver's single-project Gradle build.
 *
 * `treeMount` and `driverMount` are container paths, not host paths — the caller (Task 6) mounts the
 * committed `test/output/` tree and the driver sources separately and passes their in-container mount
 * points here, mirroring how tier 3's `synthesizeGradleBuild` takes `treeMount` rather than a host path.
 *
 * The driver source and the generated tree are added to the *same* source set (`sourceSets["main"]`,
 * not a separate `test` or driver-only set), so the driver's `import`-free calls into the generated
 * package resolve without any dependency edge between them — the two directories simply are one
 * compilation unit.
 */
export function synthesizeDriverBuild(
  unit: DriverUnit,
  treeMount: string,
  driverMount: string,
): { settings: string; build: string } {
  const settings = 'rootProject.name = "driver"\n';

  const treeDir = `${treeMount}/${unit.treePath}`;
  const driverDir = `${driverMount}/${unit.driverDir}`;
  const driverFile = `${driverDir}/${unit.driver}`;
  const dependencies = kotlinDependenciesFor(unit.family, unit.variant);

  // Kotlin names a file's top-level-declarations class after the file itself: `OkHttp3Driver.kt`
  // compiles to `OkHttp3DriverKt`. Derived from `unit.driver` rather than hardcoded so the two values
  // cannot drift apart — a driver renamed in Task 6 without updating DRIVER_UNITS would otherwise still
  // produce a build that compiles clean and then fails at `run` time with a class-not-found.
  const mainClass = `${unit.driver.replace(/\.kt$/, '')}Kt`;

  const build = [
    // This project's `main` source set is exactly two roots: the committed output tree at `treeDir`
    // below, and this unit's driver directory, `driverDir` below — scoped to this family alone so the
    // *other* family's driver (which imports symbols this tree does not have) is never compiled
    // alongside it. `srcDirs` takes the driver's directory, not the file itself (Gradle source roots
    // are directories); this comment names the actual file for a reader debugging a failed run.
    `// Driver under test: ${driverFile}`,
    '',
    'plugins {',
    '    kotlin("jvm") version "2.2.0"',
    '    application',
    '}',
    '',
    // Never resolved — the image runs Gradle `--offline`, so nothing is ever fetched from here — but
    // Gradle requires at least one repository to be declared before dependency resolution is configured
    // at all. Omitting this produces a "no repositories defined" failure that reads exactly like a
    // missing dependency, which is not the failure this build should ever produce.
    'repositories { mavenCentral() }',
    '',
    'dependencies {',
    `    add("implementation", platform("${KOTLIN_BOM[unit.variant]}"))`,
    ...dependencies.map((line) => `    ${line}`),
    ...RUNTIME_COROUTINE_DEPENDENCIES.map((line) => `    ${line}`),
    // Only `spring-reactive-web-clients` needs this closed explicitly — see
    // RUNTIME_JSON_CODEC_DEPENDENCIES's doc comment for why okhttp3 already has it transitively.
    ...(unit.family === 'spring-reactive-web-clients' ? [`    ${RUNTIME_JSON_CODEC_DEPENDENCIES[unit.variant]}`] : []),
    '}',
    '',
    'sourceSets["main"].kotlin.srcDirs("' + treeDir + '", "' + driverDir + '")',
    '',
    'application {',
    `    mainClass.set("${mainClass}")`,
    '}',
  ].join('\n') + '\n';

  return { settings, build };
}

/** Sentinel prefix a driver puts on every line of case output, distinguishing it from Gradle's own noise. */
export const CASE_LINE_PREFIX = '##GOAST-CASE##';

/**
 * Extracts every case result a driver reported from a run's combined stdout/stderr.
 *
 * Only lines starting with {@link CASE_LINE_PREFIX} are considered; everything else (Gradle's task
 * headers, download noise, the final `BUILD SUCCESSFUL` banner) is ignored rather than rejected, since
 * a driver's own case output is interleaved with Gradle's console output in the same stream.
 *
 * A sentinel line that fails to parse as JSON throws immediately, naming the offending line, rather
 * than being silently dropped: a dropped line would understate coverage, and a drift check comparing
 * reported case ids against the declared case table would then fail with "this case was never
 * reported" — a confusing symptom that points at the driver rather than at the real cause, which is
 * this line specifically.
 */
export function parseCaseLines(output: string): { caseId: string; result: unknown }[] {
  const results: { caseId: string; result: unknown }[] = [];

  for (const line of output.split('\n')) {
    if (!line.startsWith(CASE_LINE_PREFIX)) continue;
    const payload = line.slice(CASE_LINE_PREFIX.length);
    try {
      results.push(JSON.parse(payload) as { caseId: string; result: unknown });
    } catch (cause) {
      throw new Error(`Malformed ${CASE_LINE_PREFIX} line, could not parse as JSON: ${line}`, { cause });
    }
  }

  return results;
}
