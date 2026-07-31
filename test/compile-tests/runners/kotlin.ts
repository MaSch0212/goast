import { join } from 'node:path';

import {
  buildImage,
  type CompileUnit,
  type Diagnostic,
  relativizeDiagnostic,
  repoRootDir,
  runContainer,
} from '@goast/test-harness';
import { parseKotlinDiagnostics } from '../../harness/compile/parse-kotlin.ts';

const CONTEXT_DIR = join(repoRootDir, 'test', 'docker', 'kotlin');
const TREE_MOUNT = '/output';
const WORK_MOUNT = '/work';
const GRADLE_VOLUME = 'goast-gradle-cache';

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
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor")',
  ],
  'okhttp3-clients': [
    'add("implementation", "io.swagger.core.v3:swagger-annotations:2.2.30")',
    'add("implementation", "com.squareup.okhttp3:okhttp:4.12.0")',
    'add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")',
  ],
};

const BOM: Record<'sb3' | 'sb4', string> = {
  sb3: 'org.springframework.boot:spring-boot-dependencies:3.5.6',
  sb4: 'org.springframework.boot:spring-boot-dependencies:4.0.0',
};

/**
 * Gradle's own per-task status line for a `compileKotlin` task that had zero source files to compile:
 * `> Task :u0001:compileKotlin NO-SOURCE`.
 *
 * This is this task's equivalent of `runTsc`'s `##GOAST-ROOT##` coverage check. Verified directly with
 * a spike subproject deliberately pointed at a nonexistent `srcDir`: the task state is `NO-SOURCE`, the
 * task exits successfully, and — critically — a `doFirst` block added to the task **never runs**, so a
 * build-script-side source-count marker (the first approach tried here) cannot observe this case at
 * all; only Gradle's own console line does. A unit whose tree path is wrong for any reason (a typo in
 * `synthesizeGradleBuild`, a unit whose corpus directory holds no `.kt` files) would otherwise compile
 * trivially and report nothing, indistinguishable from a genuinely clean unit.
 */
const NO_SOURCE = /^> Task :(u\d+):compileKotlin NO-SOURCE$/;

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

    const { code, stdout, stderr, timedOut } = await runContainer({
      image,
      mounts: [
        { source: join(repoRootDir, 'test', 'output'), target: TREE_MOUNT, readOnly: true },
        { source: workDir, target: WORK_MOUNT },
      ],
      volumes: [{ name: GRADLE_VOLUME, target: '/home/gradle/.gradle' }],
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

    // See NO_SOURCE's doc comment: a unit whose `srcDir` is broken compiles trivially and reports
    // nothing, which is indistinguishable from a genuinely clean unit without this check.
    const unitIdByProjectId = new Map([...projectIds.entries()].map(([unitId, projectId]) => [projectId, unitId]));
    const uncovered: string[] = [];
    for (const line of output.split('\n')) {
      const match = NO_SOURCE.exec(line.trimEnd());
      if (match !== null) uncovered.push(unitIdByProjectId.get(match[1]) ?? match[1]);
    }
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
      results.get(unit.id)!.push(relativizeDiagnostic(diagnostic, treeDir));
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
