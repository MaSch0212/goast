import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  normalizeMessageUrls,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseKotlinDiagnostics } from '../../harness/compile/parse-kotlin.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');
const TREE_MOUNT = '/output';
const WORK_MOUNT = '/work';

/** Dependency lines per profile family, keyed by the profile name's prefix before `@`. */
const DEPENDENCIES: Record<string, string[]> = {
  'models': [
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
  'spring-controllers': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.fasterxml.jackson.core:jackson-annotations:2.18.2")',
    'add("implementation", "org.springframework:spring-web")',
    'add("implementation", "org.springframework:spring-context")',
    'add("implementation", "io.projectreactor:reactor-core")',
    'add("implementation", "jakarta.validation:jakarta.validation-api")',
    'add("implementation", "jakarta.annotation:jakarta.annotation-api")',
  ],
  'spring-reactive-web-clients': [
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
  'okhttp3-clients': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.squareup.okhttp3:okhttp:4.12.0")',
    'add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")',
    // Verified directly: `okhttp3-clients@sb3`/`@sb4` import both `jakarta.validation.Valid` and
    // `jakarta.validation.constraints.Min`, the same omission as `models` and
    // `spring-reactive-web-clients` above. Unlike `kotlinx-coroutines-reactor` above,
    // `jackson-module-kotlin` itself is genuinely used here (`jacksonObjectMapper()` is called directly,
    // confirmed by grep) — the warm-cache gap it exposed (`kotlin-stdlib-common:2.2.0`, see
    // `warmup/build.gradle.kts`) is fixed by adding the missing coordinate to the warmup, not by removing
    // this dependency.
    'add("implementation", "jakarta.validation:jakarta.validation-api")',
  ],
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
 */
const TASK_LINE = /^> Task :(u\d+):compileKotlin(.*)$/;

/**
 * Generates the settings and root build script for a one-subproject-per-unit Gradle build.
 *
 * Subprojects are `u0001`…`uNNNN` because a Gradle project name cannot safely carry the `@` in
 * `models@sb3` or the dot in `v3.1`. Nothing reads the names back: diagnostics are attributed by file
 * path, so the numbering stays an internal detail.
 *
 * Each subproject is configured from the root script by explicit path — `project(":u0001") { ... }` —
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

  units.forEach((unit, index) => {
    const projectId = `u${String(index + 1).padStart(4, '0')}`;
    projectIds.set(unit.id, projectId);
    includes.push(`include("${projectId}")`);

    const family = unit.profile.split('@')[0];
    const variant = unit.profile.includes('@sb4') ? 'sb4' : 'sb3';
    const dependencies = DEPENDENCIES[family];
    if (dependencies === undefined) {
      throw new Error(
        `No dependency set for Kotlin profile family "${family}". Add one to DEPENDENCIES in ` +
          'test/compile-tests/runners/kotlin.ts, and add its coordinates to the warmup project so ' +
          'the offline build can resolve them.',
      );
    }

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
        `}`,
      ].join('\n'),
    );
  });

  const settings = ['rootProject.name = "goast-compile-gate"', ...includes].join('\n') + '\n';
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

  const workDir = await Deno.makeTempDir({ prefix: 'goast-gradle-' });
  try {
    await Deno.writeTextFile(join(workDir, 'settings.gradle.kts'), settings);
    await Deno.writeTextFile(join(workDir, 'build.gradle.kts'), build);

    // No named volume over `GRADLE_USER_HOME`: `--offline` never downloads anything at run time, so a
    // persistent cache volume cannot accumulate value across runs — it can only go stale. Verified
    // directly, and load-bearing: Docker seeds a named volume from the image layer's own directory
    // content only the *first* time that (empty) volume is mounted; once seeded, rebuilding the image
    // with a changed warmup (a new content-hash tag) does not refresh it. Two stale `goast-test-kotlin`
    // tags and one `goast-gradle-cache` volume coexisting is exactly how a fixed-name volume would hide a
    // warmup fix behind a cache that never gets invalidated. Every measurement in this file's own doc
    // comments was re-confirmed with no volume mounted at all — same result, no slower — so there is
    // nothing to keep it for.
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
    const printedProjectIds = new Set<string>();
    const noSourceProjectIds = new Set<string>();
    const failedProjectIds = new Set<string>();
    for (const line of output.split('\n')) {
      const match = TASK_LINE.exec(line.trimEnd());
      if (match === null) continue;
      printedProjectIds.add(match[1]);
      const suffix = match[2].trim();
      if (suffix === 'NO-SOURCE') noSourceProjectIds.add(match[1]);
      if (suffix === 'FAILED') failedProjectIds.add(match[1]);
    }

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
    await Deno.remove(workDir, { recursive: true });
  }
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
