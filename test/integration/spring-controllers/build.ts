/**
 * Synthesizes the single-project Gradle build that runs one generated `spring-controllers` tree as a
 * real Spring Boot application, with handwritten delegates supplying the behaviour the case table
 * declares.
 *
 * Mirrors `test/integration/kotlin-clients/build.ts` (tier 4's client direction) rather than tier 3's
 * `synthesizeGradleBuild`: tier 3 compiles the whole corpus in one multi-project build with
 * `--continue`, whereas a unit here has to *run*, hold a port, and be driven over HTTP, so it needs its
 * own process and its own failure.
 */
import { join } from 'node:path';

import { KOTLIN_BOM, kotlinDependenciesFor, repoRootDir } from '@goast/test-harness';

/** One (strictness flavour, Spring Boot variant) pair this phase runs as a server. */
export type ServerUnit = {
  /** `spring-controllers@<variant>[-strict]`, matching the committed tree directory name. */
  id: string;
  /** The generator profile name; identical to `id`. */
  profile: string;
  /** Which Spring Boot line the tree is generated against. */
  variant: 'sb3' | 'sb4';
  /** Path under the committed `test/output/` tree holding this unit's generated server code. */
  treePath: string;
  /**
   * Directories under the mounted delegates root that make up this unit's handwritten glue, in source
   * order. Split by what actually forces a split and nothing else — see the plan's File Structure — so
   * `common` appears in all four units, `lenient`/`strict` in two each, and `lenient-sb3`/`lenient-sb4`
   * hold the single method (`getWidget`) whose return type differs between the Boot lines.
   */
  delegateDirs: readonly string[];
};

/** The four units: both strictness flavours crossed with both Spring Boot lines. */
export const SERVER_UNITS: readonly ServerUnit[] = [
  {
    id: 'spring-controllers@sb3',
    profile: 'spring-controllers@sb3',
    variant: 'sb3',
    treePath: 'kotlin/spring-controllers@sb3/integration/kitchen-sink',
    delegateDirs: ['common', 'lenient', 'lenient-sb3'],
  },
  {
    id: 'spring-controllers@sb4',
    profile: 'spring-controllers@sb4',
    variant: 'sb4',
    treePath: 'kotlin/spring-controllers@sb4/integration/kitchen-sink',
    delegateDirs: ['common', 'lenient', 'lenient-sb4'],
  },
  {
    id: 'spring-controllers@sb3-strict',
    profile: 'spring-controllers@sb3-strict',
    variant: 'sb3',
    treePath: 'kotlin/spring-controllers@sb3-strict/integration/kitchen-sink',
    delegateDirs: ['common', 'strict'],
  },
  {
    id: 'spring-controllers@sb4-strict',
    profile: 'spring-controllers@sb4-strict',
    variant: 'sb4',
    treePath: 'kotlin/spring-controllers@sb4-strict/integration/kitchen-sink',
    delegateDirs: ['common', 'strict'],
  },
];

/**
 * The class Gradle's `application` plugin runs.
 *
 * Kotlin names a file's top-level declarations class after the file, so `GoastApplication.kt`'s `main`
 * lands in `goast.server.GoastApplicationKt`. A constant rather than a literal in the template, so the
 * build script and Task 4's file name cannot drift apart into a build that compiles and then fails at
 * `run` with a class-not-found.
 */
export const MAIN_CLASS = 'goast.server.GoastApplicationKt';

/** Container path the committed `test/output/` tree is mounted at, read-only. */
export const TREE_MOUNT = '/output';
/** Container path the handwritten delegate sources are mounted at, read-only. */
export const DELEGATE_MOUNT = '/delegates';
/** Container path the synthesized Gradle project is mounted at, writable. */
export const WORK_MOUNT = '/work';
/** Port the Spring Boot app listens on inside the container. Boot's default; nothing overrides it. */
export const SERVER_PORT = 8080;
/** Host path of the delegate sources, mounted at {@link DELEGATE_MOUNT}. */
export const DELEGATES_DIR: string = join(repoRootDir, 'test', 'integration', 'spring-controllers', 'delegates');

/**
 * Runtime coordinates the generated tree never imports but the application cannot start without.
 *
 * Deliberately not added to `kotlinDependenciesFor`'s `spring-controllers` entry: that table is tier
 * 3's compile classpath, its diagnostics are committed snapshots, and widening it would change what
 * tier 3 resolves for a reason that has nothing to do with compiling. This is the same split
 * `RUNTIME_COROUTINE_DEPENDENCIES` makes in the client direction's build module.
 *
 * - `spring-boot-starter-webflux` brings `spring-boot`, `spring-boot-autoconfigure`, Netty and Reactor
 *   Netty. WebFlux and not MVC because the generated code is reactive by construction: every handler is
 *   a `suspend fun` and `uploadPetPhoto` takes `org.springframework.http.codec.multipart.FilePart`.
 * - `jackson-module-kotlin` is what lets Jackson construct a generated `data class` that has no
 *   no-argument constructor. Boot's own starters do not include it. The coordinate moved groups for
 *   Jackson 3, which is why this is per-variant — the same split `kotlinDependenciesFor`'s
 *   `okhttp3-clients` entry documents.
 * - `kotlinx-coroutines-reactor` is what bridges a Reactor publisher into a suspension, which the
 *   delegates need to read a `FilePart`'s content, and what Spring uses to invoke a `suspend` handler.
 */
export const SERVER_RUNTIME_DEPENDENCIES: Readonly<Record<'sb3' | 'sb4', readonly string[]>> = {
  sb3: [
    'add("implementation", "org.springframework.boot:spring-boot-starter-webflux")',
    'add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")',
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")',
  ],
  sb4: [
    'add("implementation", "org.springframework.boot:spring-boot-starter-webflux")',
    'add("implementation", "tools.jackson.module:jackson-module-kotlin")',
    'add("implementation", "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")',
  ],
};

/**
 * Generates the settings and build scripts for one unit's single-project Gradle build.
 *
 * `treeMount` and `delegateMount` are *container* paths: the caller bind-mounts the committed
 * `test/output/` tree and the delegate sources and passes their in-container mount points here.
 *
 * The generated tree and the delegate directories go into the *same* source set, so a delegate's
 * `import com.openapi.generated.api.PetsApiDelegate` resolves with no dependency edge between them —
 * they are one compilation unit.
 */
export function synthesizeServerBuild(
  unit: ServerUnit,
  treeMount: string,
  delegateMount: string,
): { settings: string; build: string } {
  const settings = 'rootProject.name = "server"\n';

  const srcDirs = [
    `${treeMount}/${unit.treePath}`,
    ...unit.delegateDirs.map((dir) => `${delegateMount}/${dir}`),
  ];

  const build = [
    'plugins {',
    '    kotlin("jvm") version "2.2.0"',
    '    application',
    '}',
    '',
    // Never resolved — the image runs `--offline` — but Gradle refuses to configure dependency
    // resolution at all without one, and the resulting "no repositories defined" failure reads exactly
    // like the missing-dependency failure this build must never be confused with.
    'repositories { mavenCentral() }',
    '',
    'dependencies {',
    `    add("implementation", platform("${KOTLIN_BOM[unit.variant]}"))`,
    ...kotlinDependenciesFor('spring-controllers', unit.variant).map((line) => `    ${line}`),
    ...SERVER_RUNTIME_DEPENDENCIES[unit.variant].map((line) => `    ${line}`),
    '}',
    '',
    `sourceSets["main"].kotlin.srcDirs(${srcDirs.map((dir) => `"${dir}"`).join(', ')})`,
    '',
    'application {',
    `    mainClass.set("${MAIN_CLASS}")`,
    '}',
  ].join('\n') + '\n';

  return { settings, build };
}
