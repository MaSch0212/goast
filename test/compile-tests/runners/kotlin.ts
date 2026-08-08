import { createHash } from 'node:crypto';
import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  FALSY_ENV_VALUES,
  normalizeMessageUrls,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseKotlinDiagnostics } from '../../harness/compile/parse-kotlin.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');
const TREE_MOUNT = '/output';
const WORK_MOUNT = '/work';

/**
 * Where a persistent Gradle project directory lives. Git-ignored: it is a local build cache, not a
 * committed artifact, and it holds absolute container paths that mean nothing on another machine.
 */
const WORK_CACHE_DIR = join(repoRootDir, '.goast-cache', 'gradle-work');

/**
 * The Gradle properties for one work mode, written into the project dir rather than baked into the
 * image's entrypoint, so changing them costs nothing and never invalidates the warm dependency layer.
 *
 * `configuration-cache` is the one that matters at this corpus size: the build configures one
 * subproject per unit — hundreds of them — and the configuration cache skips that phase entirely on a
 * hit. It caches the *task graph*, never task outputs, so unlike the build cache it cannot manufacture
 * a false "clean" even if this file's reasoning about reuse were wrong.
 *
 * `caching` (the build cache) can, which is why {@link REUSED_SUFFIXES} argues its safety explicitly.
 * Its local directory is pinned inside the project dir by the settings script, so persistence needs no
 * volume over `GRADLE_USER_HOME` — the trap that made the previous attempt at caching here worse than
 * useless, because Docker seeds a named volume only on first mount and a stale one then hides warmup
 * fixes behind a cache nothing invalidates.
 *
 * The heap bump is not an optimization: configuring this many subprojects under the default heap is
 * close enough to the limit that an OOM shows up as a truncated log, which this runner can only report
 * as an untrustworthy run.
 */
export function gradleProperties(mode: GradleWorkMode): string {
  const lines = ['org.gradle.jvmargs=-Xmx3g'];

  // Both caches only pay off when something later reads them, and in `ephemeral` mode nothing can:
  // the project dir holding both is deleted when the run ends. Measured, not assumed — enabling them
  // against an ephemeral dir took the full gate from 12m06s to 15m50s, because storing a configuration
  // cache entry for hundreds of subprojects is real work and every byte of it was then discarded. CI
  // runs ephemeral, so leaving these on unconditionally would have made the clean-room build slower
  // for no benefit whatsoever.
  if (mode === 'persistent') {
    lines.push('org.gradle.caching=true', 'org.gradle.configuration-cache=true');
  }

  return lines.join('\n') + '\n';
}

/**
 * The Gradle subproject name for one compile unit: `u` plus 12 hex characters of SHA-1.
 *
 * Derived from {@link CompileUnit.id} — `kotlin/<profile>/<versionDir>/<spec>` — and deliberately not
 * from `treeDir`, which is an absolute *host* path: hashing that would give every machine different
 * project names, so a cache directory would be worthless the moment it moved between machines, and the
 * ids would leak someone's checkout location into the build script.
 *
 * Two properties matter, and they are why this is a hash rather than a counter:
 *
 *   * **Stable under insertion.** The names used to be `u0001`…`uNNNN` from the array index, so adding
 *     one spec shifted every later unit onto a different subproject, handing each a different `srcDir`
 *     and forcing a recompile of essentially the whole corpus — exactly the case the persistent work
 *     dir exists to make fast. A unit's name now depends only on that unit.
 *   * **Legal as a Gradle project name.** A profile carries `@` (`models@sb3`) and a version dir a dot
 *     (`v3.1`), neither of which is safe here; hex is.
 *
 * Nothing reads these names back as data — diagnostics are attributed by file path, and
 * {@link runKotlin} keeps a projectId -> unitId map purely so a failure can name the unit rather than
 * the internal id. Truncating to 48 bits is safe at this corpus size, and
 * {@link synthesizeGradleBuild} throws on a collision rather than letting two units share a subproject.
 */
export function gradleProjectId(unit: CompileUnit): string {
  return `u${createHash('sha1').update(unit.id).digest('hex').slice(0, 12)}`;
}

/**
 * How {@link runKotlin} chooses its Gradle project directory.
 *
 * Measured on the full 522-unit gate, so the trade-off is not guesswork:
 *
 * | run                                    | wall clock |
 * | -------------------------------------- | ---------- |
 * | before any of this (no caches, default heap) | 12m06s |
 * | `ephemeral` (caches off, `-Xmx3g`)     | 11m07s     |
 * | `persistent`, cold cache               | 11m07s     |
 * | `persistent`, warm cache               | **1m46s**  |
 *
 * The warm run recompiled nothing: 0 of 522 `build/classes/kotlin/main` directories were modified
 * during it, while the gate still passed against snapshots recorded with caching disabled entirely.
 * That equivalence — cached path, identical diagnostics — is the property that makes reuse safe to
 * rely on, and it is why the snapshots were deliberately recorded on an uncached run first.
 *
 * Note that `-Xmx3g` is worth its line on its own: it accounts for the 12m06s -> 11m07s step, before
 * any cache is involved. Configuring this many subprojects under the default heap was close enough to
 * the limit to cost real time.
 */
export type GradleWorkMode = 'persistent' | 'ephemeral';

/**
 * `persistent` reuses one project dir across runs so Gradle's own up-to-date checks and caches apply;
 * `ephemeral` uses a fresh temp dir, so every task runs from nothing.
 *
 * Defaults the opposite way from most switches here — persistent locally, ephemeral on CI — because
 * the two have different jobs. Locally the bottleneck is iteration: recompiling every unit to learn
 * that sixteen changed is most of a working day's waiting. On CI the job is to be the clean-room
 * result everything else is checked against, and it starts from an empty checkout anyway, so there is
 * no prior state to reuse and nothing to gain from pretending otherwise.
 */
export function resolveGradleWorkMode(
  get: (key: string) => string | undefined = (key) => Deno.env.get(key),
): GradleWorkMode {
  const explicit = get('GOAST_GRADLE_CACHE');
  if (explicit !== undefined && explicit !== '') {
    return FALSY_ENV_VALUES.has(explicit) ? 'ephemeral' : 'persistent';
  }

  const ci = get('CI');
  return ci !== undefined && !FALSY_ENV_VALUES.has(ci) ? 'ephemeral' : 'persistent';
}

/**
 * Dependency lines for one profile family.
 *
 * `shared` applies to both Spring Boot lines; `sb3`/`sb4` are appended for the resolved variant only.
 * The split exists because a profile family is *not* guaranteed to have one dependency surface across
 * both variants — see `okhttp3-clients` below, whose sb4 tree is generated against Jackson 3 while its
 * sb3 tree uses Jackson 2. A family-only table (what this was before Task 6) necessarily gives both
 * variants the same lines and cannot express that.
 */
type DependencySet = { shared: string[]; sb3?: string[]; sb4?: string[] };

/** Dependency lines per profile family, keyed by the profile name's prefix before `@`. */
const DEPENDENCIES: Record<string, DependencySet> = {
  'models': {
    shared: [
      'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
      'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
      // Verified directly against the `models@sb3` corpus, contradicting the plan's own claim that
      // Jackson and Swagger annotations are "the whole dependency surface for this profile": a property
      // whose schema is itself an object (or one of a small set of numeric-bound schemas) gets a
      // `@field:Valid` (`jakarta.validation.Valid`) or `@get:Min`/`@get:Max` (`jakarta.validation.constraints`)
      // annotation. 16 of the 44 `models@sb3` units import `jakarta.validation` — without this coordinate
      // every one of them fails with `Unresolved reference` errors that describe a missing dependency in
      // this gate, not a defect in the generated code.
      'add("implementation", "jakarta.validation:jakarta.validation-api")',
    ],
    // `models@sb4`'s import set is byte-identical to `models@sb3`'s, verified across all 88 units by
    // diffing the sorted non-`kotlin`/`java`/`javax` import roots of the two trees.
  },
  'spring-controllers': {
    shared: [
      'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
      'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
      // Covers `org.springframework.web.bind.annotation.*`, `org.springframework.http.*`,
      // `org.springframework.web.context.request.NativeWebRequest`, and — through `spring-core`, which
      // `spring-web` depends on — the `org.springframework.util.{LinkedMultiValueMap,MultiValueMap}`
      // pair that only the two `-strict` variants import.
      'add("implementation", "org.springframework:spring-web")',
      // `org.springframework.stereotype.Controller` and
      // `org.springframework.validation.annotation.Validated`, plus `spring-beans` transitively for
      // `org.springframework.beans.factory.annotation.Autowired`.
      'add("implementation", "org.springframework:spring-context")',
      'add("implementation", "io.projectreactor:reactor-core")',
      'add("implementation", "jakarta.validation:jakarta.validation-api")',
      'add("implementation", "jakarta.annotation:jakarta.annotation-api")',
    ],
    // All four `spring-controllers` profiles (`@sb3`, `@sb3-strict`, `@sb4`, `@sb4-strict`) share one
    // import set; the `-strict` pair adds only the two `org.springframework.util` names noted above.
  },
  'spring-reactive-web-clients': {
    shared: [
      'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
      'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
      'add("implementation", "org.springframework:spring-webflux")',
      'add("implementation", "io.projectreactor:reactor-core")',
      // Verified directly against the real `spring-reactive-web-clients@sb3`/`@sb4` corpus: it imports
      // `jakarta.validation.Valid`/`jakarta.validation.constraints.Min`, the identical omission Task 5
      // found and fixed for `models`. It does **not** import anything from `kotlinx.*` — its
      // `awaitBody`/`awaitExchange`/`awaitBodilessEntity` calls are Spring WebFlux's own Kotlin coroutine
      // extension functions (`org.springframework.web.reactive.function.client.*`, shipped inside
      // `spring-webflux` itself since Spring 5.2), not `kotlinx-coroutines-reactor`'s `mono {}`/`flux {}`
      // builders — so that coordinate (present in the plan's original table) is dropped here as unused,
      // confirmed by `grep -rl kotlinx test/output/kotlin/spring-reactive-web-clients@sb{3,4}` finding
      // zero files.
      'add("implementation", "jakarta.validation:jakarta.validation-api")',
    ],
    // The sb3 and sb4 trees import exactly the same names — `spring-core`
    // (`org.springframework.core.io.buffer.DataBuffer`) and `spring-web`
    // (`org.springframework.http.*`, `org.springframework.web.util.UriComponentsBuilder`) both arrive
    // transitively through `spring-webflux`.
  },
  'okhttp3-clients': {
    shared: [
      'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
      'add("implementation", "com.squareup.okhttp3:okhttp:4.12.0")',
      // Jackson's *annotations* did not move to the Jackson 3 coordinates: both variants import the
      // same nine `com.fasterxml.jackson.annotation.*` names, and Spring Boot 4.0.0 still manages this
      // artifact (at 2.20, measured). Only databind and the Kotlin module differ, below.
      'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
      // Verified directly: `okhttp3-clients@sb3`/`@sb4` import both `jakarta.validation.Valid` and
      // `jakarta.validation.constraints.Min`, the same omission as `models` and
      // `spring-reactive-web-clients` above.
      'add("implementation", "jakarta.validation:jakarta.validation-api")',
    ],
    // `jacksonObjectMapper()` plus `com.fasterxml.jackson.databind.*` / `.core.type.TypeReference`.
    // Genuinely used, confirmed by grep — the warm-cache gap it exposed (`kotlin-stdlib-common:2.2.0`,
    // see `warmup/build.gradle.kts`) is fixed by adding the missing coordinate to the warmup, not by
    // removing this dependency.
    sb3: ['add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")'],
    // This is the sole reason `DependencySet` has variant slots at all. `okhttp3-clients@sb4` is the
    // only profile in the whole corpus generated against **Jackson 3**: 125 of its files import
    // `tools.jackson.core.type.TypeReference`, `tools.jackson.databind.{ObjectMapper,
    // DeserializationFeature, SerializationFeature}` and `tools.jackson.module.kotlin.jacksonMapperBuilder`,
    // and no other profile imports `tools.jackson` at all. Measured against the Spring Boot 4.0.0 BOM,
    // which manages the whole `tools.jackson` line at 3.0.2: this one coordinate pulls
    // `tools.jackson.core:jackson-databind:3.0.2` and `tools.jackson.core:jackson-core:3.0.2`
    // transitively, so it covers all five imports on its own. The Jackson 2 module above is *not*
    // listed here because sb4's tree imports nothing from `com.fasterxml.jackson.databind`.
    sb4: ['add("implementation", "tools.jackson.module:jackson-module-kotlin")'],
  },
};

const BOM: Record<'sb3' | 'sb4', string> = {
  sb3: 'org.springframework.boot:spring-boot-dependencies:3.5.6',
  sb4: 'org.springframework.boot:spring-boot-dependencies:4.0.0',
};

/**
 * Gradle's own per-task status line for a `compileKotlin` task: `> Task :u0001:compileKotlin
 * <SUFFIX>` where `<SUFFIX>` is `NO-SOURCE`, `UP-TO-DATE`, `FROM-CACHE`, `SKIPPED`, `FAILED`, or empty (a
 * task that actually executed and printed output — Gradle does not print an explicit "success" suffix).
 *
 * Matches the **general** form, not one fixed suffix, because the bare header alone is not a reliable
 * "this task ran" signal on its own: verified directly with a 44-subproject fault-injection run (one
 * subproject given an unresolvable dependency, mirroring a real offline-resolution failure), some failing
 * tasks print *only* their `FAILED` line — no separate bare header ever appears for them anywhere in the
 * log, unlike a task that fails after already printing diagnostic output. Matching
 * `compileKotlin(.*)` and reading whatever trails it — including nothing — is what makes the "did this
 * project's task run at all" check below reliable regardless of which of these shapes a given task
 * produced.
 *
 * This line is also this task's equivalent of `runTsc`'s `##GOAST-ROOT##` coverage check, for the
 * `NO-SOURCE` suffix specifically: verified directly with a spike subproject deliberately pointed at a
 * nonexistent `srcDir`, the task state is `NO-SOURCE`, the task exits successfully, and — critically — a
 * `doFirst` block added to the task **never runs**, so a build-script-side source-count marker (the first
 * approach tried here) cannot observe this case at all; only Gradle's own console line does. A unit whose
 * tree path is wrong for any reason (a typo in `synthesizeGradleBuild`, a unit whose corpus directory
 * holds no `.kt` files) would otherwise compile trivially and report nothing, indistinguishable from a
 * genuinely clean unit.
 *
 * `NO-SOURCE` only proves a unit's `srcDir` resolved to a non-empty directory — it does not by itself
 * prove the unit's sources actually finished compiling. That is what the `FAILED`-suffix check below is
 * for: a task can print neither `NO-SOURCE` nor any `e:` diagnostic and still have failed outright (an
 * offline dependency-resolution error, a worker crash, an OOM), which would otherwise be recorded as a
 * clean unit purely because the vacuous-green guard only looks at the *whole build's* diagnostic count,
 * not each task's own outcome.
 *
 * Every suffix in that enumeration has a branch in {@link scanTaskLines}, and so does a suffix outside
 * it: `UP-TO-DATE`, `FROM-CACHE` and `SKIPPED` were previously fed into neither the `NO-SOURCE` nor the
 * `FAILED` set and so recorded as "ran and clean" — see {@link NOT_EXECUTED_SUFFIXES}.
 */
const TASK_LINE = /^> Task :([^:\s]+):compileKotlin(.*)$/;

/**
 * Suffixes meaning "Gradle reused a prior successful result for this task".
 *
 * **These are a legitimate zero-error result, not an unchecked unit**, and that is a claim about
 * Gradle's semantics rather than a convenience:
 *
 *   * A task is only `UP-TO-DATE` when its inputs and outputs are unchanged *and its previous
 *     execution succeeded*. A failed `compileKotlin` is never recorded as up to date; it re-runs on
 *     the next invocation and re-prints its `e:` lines.
 *   * The build cache only ever stores outputs for tasks that succeeded, so `FROM-CACHE` carries the
 *     same guarantee.
 *   * Source files are hashed as task inputs, so a unit whose tree changed *cannot* be up to date.
 *     (An earlier revision of this comment claimed the opposite — that a skipped unit might have been
 *     "last compiled against a stale tree" — and used it to justify rejecting these suffixes
 *     outright. That reasoning was wrong.)
 *   * {@link parseKotlinDiagnostics} keeps only `e:` errors and drops `w:` warnings. This is what
 *     makes the above sufficient: a compile that succeeded *with warnings* is cacheable and would
 *     print nothing on reuse, so if warnings were recorded, reuse could hide them. They are not.
 *
 * Therefore reuse implies "previous run of these exact inputs succeeded" implies "zero errors", and
 * an empty diagnostic list is the correct result. Units that genuinely fail are never reused — they
 * recompile and re-report every run.
 *
 * The JDK is the one input Gradle would not otherwise track, so {@link synthesizeGradleBuild}
 * declares it explicitly as a task input property.
 */
const REUSED_SUFFIXES = new Set(['UP-TO-DATE', 'FROM-CACHE']);

/**
 * Suffixes meaning "Gradle declined to run this task", so its console output carries no diagnostics
 * and an empty diagnostic list says nothing about whether the unit compiles.
 *
 * `SKIPPED` is emphatically *not* in {@link REUSED_SUFFIXES}: it means the task was disabled or
 * excluded (an `onlyIf` predicate, `-x`), which carries no evidence that it ever succeeded. Nothing
 * in this runner's configuration should produce it, and if it appears, recording the unit clean would
 * be a guess.
 */
const NOT_EXECUTED_SUFFIXES = new Set(['SKIPPED']);

/** What one Gradle run said about each unit's `compileKotlin` task. */
export type TaskStates = {
  /** Every project that printed a `compileKotlin` line at all, whatever its suffix. */
  printed: Set<string>;
  /** Projects whose task found no sources — see {@link TASK_LINE}. */
  noSource: Set<string>;
  /** Projects whose task failed. A task can print both a bare header and a `FAILED` line. */
  failed: Set<string>;
  /**
   * Projects whose task Gradle reused a prior successful result for: {@link REUSED_SUFFIXES}, mapped
   * to the suffix seen. Treated as executed-and-clean — see that set's doc comment for why that is
   * sound.
   */
  reused: Map<string, string>;
  /** Projects Gradle declined to run: {@link NOT_EXECUTED_SUFFIXES}, mapped to the suffix seen. */
  notExecuted: Map<string, string>;
  /** Projects whose suffix this runner does not recognise, mapped to the suffix seen. */
  unknown: Map<string, string>;
};

/**
 * Classifies every `compileKotlin` task line in a Gradle log.
 *
 * Split out from {@link runKotlin} so every suffix case can be asserted directly. `UP-TO-DATE` and
 * `FROM-CACHE` are reachable whenever the persistent work dir holds prior state (see
 * {@link REUSED_SUFFIXES}); `SKIPPED` should never appear.
 */
export function scanTaskLines(output: string): TaskStates {
  const states: TaskStates = {
    printed: new Set(),
    noSource: new Set(),
    failed: new Set(),
    reused: new Map(),
    notExecuted: new Map(),
    unknown: new Map(),
  };

  for (const line of output.split('\n')) {
    const match = TASK_LINE.exec(line.trimEnd());
    if (match === null) continue;
    const [, projectId, rawSuffix] = match;
    const suffix = rawSuffix.trim();
    states.printed.add(projectId);

    if (suffix === '') continue; // Executed; Gradle prints no explicit success suffix.
    if (suffix === 'NO-SOURCE') states.noSource.add(projectId);
    else if (suffix === 'FAILED') states.failed.add(projectId);
    else if (REUSED_SUFFIXES.has(suffix)) states.reused.set(projectId, suffix);
    else if (NOT_EXECUTED_SUFFIXES.has(suffix)) states.notExecuted.set(projectId, suffix);
    else states.unknown.set(projectId, suffix);
  }

  return states;
}

/**
 * Generates the settings and root build script for a one-subproject-per-unit Gradle build.
 *
 * Subprojects are named by {@link gradleProjectId} — a hash of the unit id, not its array position —
 * so that adding or removing a spec leaves every other unit's subproject untouched and the persistent
 * work dir stays warm. See that function for why the name is a hash and why it hashes the id rather
 * than the tree path.
 *
 * Each subproject is configured from the root script by explicit path — `project(":u1f3c…") { ... }` —
 * rather than a single `subprojects { ... }` block, because different profile families need different
 * dependency sets. Verified directly in the Step 4 spike: configuring named subprojects this way from
 * the root script, with the Kotlin plugin applied via `apply(plugin = ...)` inside each block (the root
 * `plugins {}` block only declares the version, with `apply false`), compiles correctly — including
 * when one subproject fails and others must still be attempted (see `runKotlin`'s doc comment on
 * `--continue`).
 */
export function synthesizeGradleBuild(
  units: readonly CompileUnit[],
  treeMount: string,
): { settings: string; build: string; projectIds: Map<string, string> } {
  const projectIds = new Map<string, string>();
  const includes: string[] = [];
  const blocks: string[] = [];

  const unitIdByProjectId = new Map<string, string>();

  units.forEach((unit) => {
    const projectId = gradleProjectId(unit);
    // Two units sharing a subproject would silently compile one tree twice and never read the other,
    // reporting the unread one as clean. 48 bits over a corpus this size makes it vanishingly unlikely,
    // but "unlikely" and "checked" are different things, and the failure would be invisible.
    const collidesWith = unitIdByProjectId.get(projectId);
    if (collidesWith !== undefined) {
      throw new Error(
        `Gradle project id ${projectId} is shared by "${collidesWith}" and "${unit.id}". Widen the ` +
          'slice in gradleProjectId; do not deduplicate, both units need their own subproject.',
      );
    }
    unitIdByProjectId.set(projectId, unit.id);

    projectIds.set(unit.id, projectId);
    includes.push(`include("${projectId}")`);

    const family = unit.profile.split('@')[0];
    // Substring, not equality: four of the ten profiles carry a `-strict` suffix after the variant
    // (`spring-controllers@sb3-strict`, `@sb4-strict`), so `=== '@sb4'` would silently file both
    // strict profiles under sb3 and compile them against the wrong Spring Boot line.
    const variant = unit.profile.includes('@sb4') ? 'sb4' : 'sb3';
    const dependencySet = DEPENDENCIES[family];
    if (dependencySet === undefined) {
      throw new Error(
        `No dependency set for Kotlin profile family "${family}". Add one to DEPENDENCIES in ` +
          'test/compile-tests/runners/kotlin.ts, and add its coordinates to the warmup project so ' +
          'the offline build can resolve them.',
      );
    }
    const dependencies = [...dependencySet.shared, ...(dependencySet[variant] ?? [])];

    const treeDir = `${treeMount}/kotlin/${unit.profile}/${unit.versionDir}/${unit.spec}`;
    blocks.push(
      [
        `project(":${projectId}") {`,
        `    apply(plugin = "org.jetbrains.kotlin.jvm")`,
        `    repositories { mavenCentral() }`,
        `    extensions.configure<org.gradle.api.tasks.SourceSetContainer>("sourceSets") {`,
        `        named("main") { java.setSrcDirs(listOf("${treeDir}")) }`,
        `    }`,
        `    dependencies {`,
        `        add("implementation", platform("${BOM[variant]}"))`,
        ...dependencies.map((line) => `        ${line}`),
        `    }`,
        // The JDK is the one thing that changes what the compiler does without Gradle noticing.
        // Source files, the build script and the resolved compile classpath are all tracked inputs
        // already, and Gradle scopes its own project state by Gradle version — but nothing here
        // declares a toolchain, so the compiler just uses the container's daemon JVM. Bump the base
        // image's JDK and these tasks could stay UP-TO-DATE while the recorded result came from the
        // old one. Declaring it as an input property fixes that without changing what gets compiled;
        // declaring a `jvmToolchain` instead would also change the compilation target, which could
        // move the committed diagnostics and needs its own verified run.
        //
        // Matched by task name rather than by importing `KotlinCompile` so a change in the Kotlin
        // plugin's type hierarchy cannot silently stop matching.
        `    tasks.matching { it.name == "compileKotlin" }.configureEach {`,
        `        inputs.property("jvmVersion", System.getProperty("java.vm.version"))`,
        `    }`,
        `}`,
      ].join('\n'),
    );
  });

  // The build cache's local directory is pinned inside the project dir so that persisting the project
  // dir persists the cache too. See GRADLE_PROPERTIES for why this is deliberately not a volume over
  // GRADLE_USER_HOME.
  const settings = [
    'rootProject.name = "goast-compile-gate"',
    'buildCache { local { directory = File(rootDir, ".build-cache") } }',
    ...includes,
  ].join('\n') + '\n';
  const build = [
    'plugins { kotlin("jvm") version "2.2.0" apply false }',
    '',
    ...blocks,
  ].join('\n\n') + '\n';

  return { settings, build, projectIds };
}

/**
 * Compiles every Kotlin unit in one Gradle build.
 *
 * `--continue` (in the image's entrypoint) is what lets one subproject's compile failure not prevent
 * the others from running. Verified directly, not merely assumed: a three-subproject spike with two
 * broken units (`v3/extreme-names` and `v3/non-ascii-names`) reported both units' full diagnostics in
 * the same run — neither suppressed the other's, and the clean third unit still compiled. This is a
 * different shape from Task 4's `tsc` finding (a single shared `Program`'s syntax error silently
 * discarding every other file's semantic diagnostics): each subproject here is its own Kotlin compiler
 * invocation over its own, disjoint source set, so there is no shared compilation state one unit's
 * failure could corrupt for another.
 */
export async function runKotlin(units: readonly CompileUnit[]): Promise<Map<string, Diagnostic[]>> {
  const results = new Map<string, Diagnostic[]>(units.map((unit) => [unit.id, []]));
  if (units.length === 0) return results;

  const image = await buildImage('kotlin', CONTEXT_DIR);
  const { settings, build, projectIds } = synthesizeGradleBuild(units, TREE_MOUNT);

  const workMode = resolveGradleWorkMode();
  const workDir = workMode === 'persistent' ? WORK_CACHE_DIR : await Deno.makeTempDir({ prefix: 'goast-gradle-' });
  try {
    await Deno.mkdir(workDir, { recursive: true });
    await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
    await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);
    await Deno.writeTextFile(join(workDir, 'gradle.properties'), gradleProperties(workMode));

    // Still no named volume over `GRADLE_USER_HOME`, and that decision is unchanged: `--offline` never
    // downloads anything at run time, so a dependency-cache volume cannot accumulate value across runs
    // — it can only go stale. Verified directly, and load-bearing: Docker seeds a named volume from the
    // image layer's own directory content only the *first* time that (empty) volume is mounted; once
    // seeded, rebuilding the image with a changed warmup (a new content-hash tag) does not refresh it.
    // Two stale `goast-test-kotlin` tags and one `goast-gradle-cache` volume coexisting is exactly how a
    // fixed-name volume would hide a warmup fix behind a cache that never gets invalidated.
    //
    // What DOES persist between runs is the project dir, bind-mounted from the host (see
    // `resolveGradleWorkMode`). Gradle keeps task state, the configuration cache and — per the settings
    // script — the local build cache inside the project dir, so reuse needs nothing mounted over
    // `GRADLE_USER_HOME` and cannot go stale the way a seeded volume can: a bind mount always shows
    // exactly what is on the host, and every input Gradle keys on is either hashed by Gradle itself or
    // declared as a task input.
    const { code, stdout, stderr, timedOut } = await runContainer({
      image,
      mounts: [
        { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
        { source: workDir, target: WORK_MOUNT },
      ],
      workdir: WORK_MOUNT,
      timeoutMs: 30 * 60 * 1000,
    });

    // A killed run's output is whatever happened to be flushed before the signal landed — neither
    // "clean" nor "these are all the diagnostics" is a safe reading of it, exactly as `runTsc` treats
    // its own `timedOut` case.
    if (timedOut) {
      throw new Error(
        `Gradle timed out compiling ${units.length} Kotlin unit(s). Its output cannot be trusted as a ` +
          `complete result.\n\n${stdout}${stderr}`,
      );
    }

    const output = stdout + stderr;
    const unitIdByProjectId = new Map([...projectIds.entries()].map(([unitId, projectId]) => [projectId, unitId]));

    // Every project's `compileKotlin` task line, whatever its suffix (including none). See TASK_LINE's
    // doc comment for why the general form is required and the bare header alone is not enough.
    const taskStates = scanTaskLines(output);
    const { printed: printedProjectIds, noSource: noSourceProjectIds, failed: failedProjectIds } = taskStates;

    // A unit whose project never printed a `compileKotlin` line at all: Gradle never reached it (a
    // whole-build configuration failure, a crash before the task graph ran). Its result cannot be trusted
    // either way.
    const missingStatus = units.filter((unit) => !printedProjectIds.has(projectIds.get(unit.id)!));
    if (missingStatus.length > 0) {
      throw new Error(
        `${missingStatus.length} unit(s) never printed a compileKotlin status line at all: ` +
          `${missingStatus.map((u) => u.id).join(', ')}. Gradle may not have reached them; their result ` +
          `cannot be trusted either way.\n\n${output}`,
      );
    }

    // See TASK_LINE's doc comment: a unit whose `srcDir` is broken compiles trivially and reports
    // nothing, which is indistinguishable from a genuinely clean unit without this check.
    const uncovered = [...noSourceProjectIds].map((projectId) => unitIdByProjectId.get(projectId) ?? projectId);
    if (uncovered.length > 0) {
      throw new Error(
        `${uncovered.length} unit(s) contributed no source files to their Gradle compilation ` +
          `(NO-SOURCE): ${uncovered.join(', ')}. The srcDir is broken for them; a unit reporting no ` +
          'diagnostics for this reason has not actually been checked.',
      );
    }

    // Gradle declined to run the task, so the log holds no diagnostics for the unit and its empty
    // result means "not checked", not "clean". Reuse (UP-TO-DATE/FROM-CACHE) is deliberately NOT in
    // this set — see REUSED_SUFFIXES for why reuse is a sound zero-error result and SKIPPED is not.
    const notExecuted = describeProjects(taskStates.notExecuted, unitIdByProjectId);
    if (notExecuted.length > 0) {
      throw new Error(
        `${notExecuted.length} unit(s) did not compile because Gradle declined to run their task: ` +
          `${notExecuted.join(', ')}. Their sources were never read on this run, so an empty diagnostic ` +
          'list is not evidence that they compile. A task is only SKIPPED when something disabled or ' +
          'excluded it (an onlyIf predicate, -x); nothing in this runner should do that.',
      );
    }

    // A suffix this runner has no branch for: whatever Gradle meant by it, recording the unit clean
    // would be a guess. See TASK_LINE's doc comment for the enumerated set.
    const unknownState = describeProjects(taskStates.unknown, unitIdByProjectId);
    if (unknownState.length > 0) {
      throw new Error(
        `${unknownState.length} unit(s) reported a compileKotlin task state this runner does not ` +
          `recognise: ${unknownState.join(', ')}. Gradle's set of task-state suffixes has probably ` +
          'changed; classify the new one in scanTaskLines before trusting these units.',
      );
    }

    const diagnostics = parseKotlinDiagnostics(output);

    if (code !== 0 && diagnostics.length === 0) {
      throw new Error(
        `Gradle exited ${code} but no Kotlin diagnostics were parsed. Either the output format ` +
          'changed and the gate would be vacuously green, or the build itself failed to configure.\n\n' +
          output,
      );
    }

    for (const diagnostic of diagnostics) {
      const unit = attribute(diagnostic, units);
      if (unit === undefined) {
        throw new Error(
          `Could not attribute a Kotlin diagnostic to a unit: ${diagnostic.file} ${diagnostic.message}`,
        );
      }
      const treeDir = `${TREE_MOUNT}/kotlin/${unit.profile}/${unit.versionDir}/${unit.spec}`;
      results.get(unit.id)!.push({
        ...relativizeDiagnostic(diagnostic, treeDir),
        message: normalizeMessageUrls(diagnostic.message, treeDir),
      });
    }

    // A project whose task line says `FAILED` but which owns zero attributed diagnostics: the build
    // failed for that unit for a reason that never produced an `e:` line (an offline dependency
    // resolution error, a worker crash, an OOM — see TASK_LINE's doc comment). Without this check that
    // unit's empty diagnostic list is indistinguishable from a genuine pass, and `verifyCompileDiagnostics`
    // would record it clean.
    const failedWithoutDiagnostics = [...failedProjectIds]
      .map((projectId) => unitIdByProjectId.get(projectId))
      .filter((unitId): unitId is string => unitId !== undefined && results.get(unitId)!.length === 0);
    if (failedWithoutDiagnostics.length > 0) {
      throw new Error(
        `${failedWithoutDiagnostics.length} unit(s) FAILED to compile but produced no attributable ` +
          `diagnostic: ${failedWithoutDiagnostics.join(', ')}. This usually means an offline dependency ` +
          'resolution failure, a worker crash, or an OOM — the unit cannot be recorded as clean.\n\n' +
          output,
      );
    }

    return results;
  } finally {
    // A persistent project dir is the whole point of `persistent` mode — deleting it here would make
    // every run a cold one while looking like it cached. `deno task test:compile:clean` removes it.
    if (workMode === 'ephemeral') await Deno.remove(workDir, { recursive: true });
  }
}

/** `<unit id> (<suffix>)` per entry, so a failure names the unit rather than the internal project id. */
function describeProjects(bySuffix: Map<string, string>, unitIdByProjectId: Map<string, string>): string[] {
  return [...bySuffix].map(([projectId, suffix]) => `${unitIdByProjectId.get(projectId) ?? projectId} (${suffix})`);
}

/** Longest matching prefix, so `v3/a` never claims a diagnostic belonging to `v3/ab`. */
function attribute(diagnostic: Diagnostic, units: readonly CompileUnit[]): CompileUnit | undefined {
  let best: CompileUnit | undefined;
  for (const unit of units) {
    const prefix = `${TREE_MOUNT}/kotlin/${unit.profile}/${unit.versionDir}/${unit.spec}/`;
    if (!diagnostic.file.startsWith(prefix)) continue;
    const bestPrefix = best === undefined
      ? undefined
      : `${TREE_MOUNT}/kotlin/${best.profile}/${best.versionDir}/${best.spec}/`;
    if (best === undefined || prefix.length > bestPrefix!.length) best = unit;
  }
  return best;
}
