// This file, `../versions.gradle.kts`'s (former) `Versions`/`Deps` objects, and
// `../../../compile-tests/runners/kotlin.ts`'s `DEPENDENCIES`/`BOM` tables are one coordinate list,
// hand-maintained in three places. There is no machine-enforced single source of truth: `versions.gradle.kts`
// claimed to be one ("the warm cache is guaranteed to cover what the build resolves") but nothing ever
// read it — it was `COPY`'d into the image and never `apply(from = ...)`'d or referenced — so the claim was
// false. Deleted rather than fixed: the Kotlin DSL's `plugins {}` block cannot take its version from a
// value defined by `apply(from = ...)` (plugin resolution runs before the rest of the script), so a
// genuinely machine-enforced version catalog here would mean adopting Gradle's actual version-catalog
// mechanism (`gradle/libs.versions.toml` + `pluginManagement`) — real infrastructure work, not a two-line
// fix, and not something to improvise under this task's time budget against a DSL this plan has already
// gotten wrong five times. Keep this list and `kotlin.ts`'s in sync by hand; Important 2 in the Task 5
// review (`kotlin-stdlib-common:2.2.0` missing here after `jackson-module-kotlin` was added to
// `okhttp3-clients` without updating this file) is a direct, verified instance of what happens when they
// drift — treat every edit to one as needing a matching look at the other.
plugins {
    kotlin("jvm") version "2.2.0"
}

repositories { mavenCentral() }

// Two custom resolvable configurations, one per Spring Boot line, not one shared `compileOnly`.
//
// Verified directly: a single configuration holding both `platform("...spring-boot-dependencies:3.5.6")`
// and `platform("...spring-boot-dependencies:4.0.0")` does not conflict loudly. Gradle treats the two
// platforms as the same module (`org.springframework.boot:spring-boot-dependencies`) at two versions and
// applies its default newest-wins conflict resolution silently: `dependencyInsight` showed "By conflict
// resolution: between versions 4.0.0 and 3.5.6", and only 4.0.0 ended up in `GRADLE_USER_HOME`'s module
// cache. The `warm` task still reported `BUILD SUCCESSFUL` — nothing failed, so this is not the "if
// Gradle reports a conflict" case the original plan anticipated; the failure surfaces later and
// silently, as an offline resolution error for 3.5.6 the first time the real build asks for it. Splitting
// into two configurations, each with its own platform and nothing that could conflict with the other,
// is what actually warms both.
val sb3 by configurations.creating
val sb4 by configurations.creating

// And each line is warmed a second time, under the *compile* usage.
//
// `sb3`/`sb4` above carry no attributes at all, so Gradle resolves every module through its `runtime`
// variant. A real build's `compileClasspath` asks for `Usage=java-api` instead, and the two graphs are
// genuinely different — not merely differently ordered. Measured, from the warm cache with
// `spring-boot-starter-webflux` warmed only through the attribute-less configurations:
// `spring-controllers@sb4`'s real `compileKotlin` failed offline on five artifacts
// (`biz.aQute.bnd:biz.aQute.bnd.annotation:7.1.0`, `com.google.errorprone:error_prone_annotations:2.38.0`,
// `org.osgi:org.osgi.annotation.bundle:2.0.0`, `org.osgi:org.osgi.annotation.versioning:1.1.2`,
// `com.github.spotbugs:spotbugs-annotations:4.8.6`) that `log4j-api`/`log4j-to-slf4j:2.25.2` — Spring Boot
// 4.0.0's managed Log4j, reached through `spring-boot-starter-logging` — declares in its api variant and
// omits from its runtime variant. Spring Boot 3.5.6 manages an older Log4j that does not, which is why the
// sb3 unit compiled and only sb4 failed.
//
// `extendsFrom` rather than a second coordinate list: there is exactly one list to maintain below, and the
// two usages of it cannot drift apart. The attributes are the ones the `java` plugin puts on
// `compileClasspath`, so this resolves the same variants the real gate does. A `platform()` dependency
// carries `Category=regular-platform` on the dependency itself, which takes precedence over the
// `Category=library` set here, so the BOMs still resolve as platforms.
val sb3Api by configurations.creating { extendsFrom(sb3) }
val sb4Api by configurations.creating { extendsFrom(sb4) }

for (configuration in listOf(sb3Api, sb4Api)) {
    configuration.attributes {
        attribute(Usage.USAGE_ATTRIBUTE, objects.named(Usage::class.java, Usage.JAVA_API))
        attribute(Category.CATEGORY_ATTRIBUTE, objects.named(Category::class.java, Category.LIBRARY))
        attribute(
            LibraryElements.LIBRARY_ELEMENTS_ATTRIBUTE,
            objects.named(LibraryElements::class.java, LibraryElements.JAR),
        )
        attribute(Bundling.BUNDLING_ATTRIBUTE, objects.named(Bundling::class.java, Bundling.EXTERNAL))
        attribute(TargetJvmVersion.TARGET_JVM_VERSION_ATTRIBUTE, 21)
    }
}

// Every extra duplicated into both configurations rather than shared: nothing here declares a version
// of its own (each is resolved through whichever BOM constrains it), so there is nothing for the two
// configurations to disagree about, and duplication keeps the cache warm no matter which BOM line a
// real subproject picks.
//
// The loop is for coordinates `kotlin.ts` puts in a family's `shared` list. A coordinate that lives in
// a `sb3`/`sb4` slot there must be added *after* the loop instead, against that one configuration —
// see the two blocks below the loop. Adding a variant-specific coordinate to the loop declares it
// against the other line's BOM as well, which for a Jackson 3 artifact means the sb3 BOM, which does
// not manage it: no version, and the image build fails during `RUN gradle warm`.
dependencies {
    for (configurationName in listOf("sb3", "sb4")) {
        add(configurationName, "io.swagger.core.v3:swagger-annotations:2.2.30")
        add(configurationName, "com.fasterxml.jackson.core:jackson-annotations:2.18.2")
        add(configurationName, "com.squareup.okhttp3:okhttp:4.12.0")
        add(configurationName, "org.springframework:spring-web")
        add(configurationName, "org.springframework:spring-webflux")
        add(configurationName, "org.springframework:spring-context")
        add(configurationName, "io.projectreactor:reactor-core")
        // `org.jetbrains.kotlinx:kotlinx-coroutines-reactor` was removed from here once before. It is in
        // no `DEPENDENCIES` entry — `kotlin.ts` drops it as unused for `spring-reactive-web-clients`,
        // whose `awaitBody`/`awaitExchange` are Spring WebFlux's own extensions — and
        // `grep -rl kotlinx test/output/kotlin` finds zero files, so compilation genuinely never needs
        // it. It (and `kotlinx-coroutines-core`, for `runBlocking`) is warmed again below the
        // `kotlin-stdlib-common` line, not for compiling but for a tier-4 driver *running* generated code
        // — see that comment for why running needs what compiling does not.
        add(configurationName, "jakarta.validation:jakarta.validation-api")
        add(configurationName, "jakarta.annotation:jakarta.annotation-api")
        // Verified directly, from a pristine image layer with no named volume: once
        // `jackson-module-kotlin` enters the graph (as it does for `okhttp3-clients`), it forces
        // `kotlin-stdlib-common` to resolve at the exact Kotlin plugin version (2.2.0) rather than
        // whatever version another dependency's own metadata happens to pull in — `okhttp:4.12.0`'s own
        // metadata pulls `kotlin-stdlib-common:2.2.21`, and no coordinate above pulls `2.2.0`, so without
        // this line only `1.9.25`/`2.2.21` land in the warm cache and the real build fails offline
        // (`Could not resolve org.jetbrains.kotlin:kotlin-stdlib-common:2.2.0 ... No cached version
        // available for offline mode`). `jackson-module-kotlin` itself is genuinely used by generated
        // `okhttp3-clients` code (`jacksonObjectMapper()`), so the fix is adding this coordinate, not
        // removing that one — see `kotlin.ts`'s `DEPENDENCIES['okhttp3-clients']` comment. (Task 6 moved
        // the two `jackson-module-kotlin` declarations themselves below the loop, one per variant; this
        // line stays in the loop because it is pinned outright and both lines need it warm.)
        add(configurationName, "org.jetbrains.kotlin:kotlin-stdlib-common:2.2.0")
        // Runtime-only, and deliberately absent from the compile-time list above: a tier-4 driver enters
        // a coroutine from `main` via `runBlocking` (coroutines-core) and WebFlux's `awaitBody`/
        // `awaitExchange` bridge a Reactor publisher into a suspension at run time (coroutines-reactor).
        // Neither BOM manages these, so both carry an explicit version.
        add(configurationName, "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
        add(configurationName, "org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")
        // Tier 4's server direction *runs* a generated `spring-controllers` tree as a real Spring Boot
        // application, which needs the whole WebFlux runtime — `spring-boot`, `spring-boot-autoconfigure`,
        // Netty, Reactor Netty — none of which any generated file imports, so tier 3 never resolves it and
        // `kotlinDependenciesFor` deliberately does not list it. Managed by both BOMs, hence inside this
        // loop rather than in a variant slot below. See `SERVER_RUNTIME_DEPENDENCIES` in
        // `test/integration/spring-controllers/build.ts` for the consuming end.
        add(configurationName, "org.springframework.boot:spring-boot-starter-webflux")
    }
    sb3(platform("org.springframework.boot:spring-boot-dependencies:3.5.6"))
    sb4(platform("org.springframework.boot:spring-boot-dependencies:4.0.0"))

    // Variant-specific, mirroring `DEPENDENCIES['okhttp3-clients'].sb3`/`.sb4` in `kotlin.ts`.
    //
    // `okhttp3-clients@sb4` is generated against Jackson 3, whose Maven coordinates moved to the
    // `tools.jackson.*` groups; its sb3 sibling still uses Jackson 2's `com.fasterxml.jackson.*`. These
    // cannot go in the loop above: the sb3 BOM (Spring Boot 3.5.6) does not manage `tools.jackson`, so a
    // version-less declaration against `sb3` fails to resolve outright.
    //
    // Jackson 2's module is sb3-only because sb4's generated tree imports nothing from
    // `com.fasterxml.jackson.databind`.
    //
    // ---- The invariant this file has to satisfy, stated precisely ----
    //
    // It is NOT "each warmed configuration resolves the same graph as the real build". That is
    // unachievable here and this file does not do it: `sb3` and `sb4` are each ONE configuration
    // holding the union of every family's coordinates, whereas the real gate resolves EIGHT disjoint
    // per-family graphs (four families x two variants). Pruning a coordinate shrinks the union; it
    // never makes the union equal to any one real graph.
    //
    // The actual invariant is a superset relation over resolved coordinates:
    //
    //     for each variant v: { GAVs resolved by warm_v } union { GAVs resolved by compileClasspath }
    //         MUST CONTAIN  the union of the GAVs resolved by all four real families at variant v
    //
    // GAV = group:artifact:VERSION. The version is the whole point, and it is why membership in
    // `DEPENDENCIES` does NOT imply warm: a coordinate is only warm at the exact version the real graph
    // asks for. A larger graph can resolve a shared transitive *upwards* (newest-wins conflict
    // resolution), so the union can hold `foo:2.0` while a real family's smaller graph wants `foo:1.9`
    // and fails offline. That is the general form of the `kotlin-stdlib-common:2.2.0` failure above.
    //
    // Two consequences a maintainer must not skip:
    //   * ADDING a coordinate here does not prove anything is warm, and neither does deleting one prove
    //     it is safe. Pruning changes conflict resolution and can *lower* a transitive out of the cache.
    //   * Only a per-GAV diff can establish the relation. Reading the two lists side by side cannot:
    //     the versions that matter are transitive and appear in neither list.
    //
    // So verify it, do not reason about it. Resolve all eight real (family x variant) configurations
    // and both warmed ones in a scratch Gradle project, and diff the resolved artifact sets — a real
    // family's set minus its variant's warmed set must be empty. Model each real configuration as its
    // `DEPENDENCIES` lines PLUS `org.jetbrains.kotlin:kotlin-stdlib` at the plugin version: the
    // `kotlin("jvm")` plugin adds that to every subproject's `implementation`, and a model that omits it
    // resolves a different graph and reports gaps that do not exist. Task 6 ran exactly this check
    // against the coordinate set below and measured zero uncovered artifacts across all eight.
    sb3("com.fasterxml.jackson.module:jackson-module-kotlin")
    sb4("tools.jackson.module:jackson-module-kotlin")

    // Runtime-only, for tier 4's reactive client units: `spring-reactive-web-clients` imports no Jackson
    // databind class (so `kotlinDependenciesFor` rightly omits it), but WebFlux's default JSON codecs need
    // one at run time, and Gradle does not pull `spring-web`'s *optional* Maven dependency on it. See
    // `RUNTIME_JSON_CODEC_DEPENDENCIES` in `test/integration/kotlin-clients/build.ts`. Named explicitly
    // rather than left to arrive transitively through the okhttp3 family's `jackson-module-kotlin`: that
    // route works but couples this family's runtime to another family's compile-time needs, and phase 6a's
    // final review flagged it as a gap that would surface only as an offline resolution failure.
    sb3("com.fasterxml.jackson.core:jackson-databind")
    sb4("tools.jackson.core:jackson-databind")
}

tasks.register("warm") {
    doLast {
        // `compileClasspath` is what actually needs warming beyond `sb3`/`sb4` above: the `kotlin("jvm")`
        // plugin adds `kotlin-stdlib` as an `implementation` dependency of its own accord, which lands
        // there, not in either custom configuration. Verified directly: without this line the real build
        // fails offline on `org.jetbrains.kotlin:kotlin-stdlib:2.2.0`, a coordinate this script never
        // names.
        configurations.compileClasspath.get().resolve()
        // Kotlin 2.x's Gradle plugin runs `compileKotlin` through the Build Tools API, which resolves
        // `kotlinBuildToolsApiClasspath` (pulling in `kotlin-build-tools-impl` and friends) the moment a
        // subproject actually compiles — not merely when the plugin is applied. Resolving `compileClasspath`
        // above never touches it, so it stays cold. Verified directly: without this line the real build
        // fails offline on `org.jetbrains.kotlin:kotlin-build-tools-impl:2.2.0` at the first `compileKotlin`
        // task, one layer deeper than the `kotlin-stdlib` gap above (an artifact transform's own inputs,
        // not the compilation classpath itself).
        configurations.getByName("kotlinBuildToolsApiClasspath").resolve()
        sb3.resolve()
        sb4.resolve()
        // The `java-api` views of the same two lists. See the `sb3Api`/`sb4Api` declarations above for the
        // five artifacts that are only reachable this way.
        sb3Api.resolve()
        sb4Api.resolve()
        // No `runtimeClasspath.get().resolve()` alongside `compileClasspath` above, and that is a measured
        // conclusion rather than an oversight. Tier 4's server direction runs `gradle run`, which resolves
        // `runtimeClasspath`, so the question is real; but this project declares nothing in `runtimeOnly`
        // and the only thing the plugin puts in `implementation` is `kotlin-stdlib`, whose api and runtime
        // variants carry the same artifact and the same single dependency. The attribute-less `sb3`/`sb4`
        // above already resolve every listed coordinate through its *runtime* variant, which is the half
        // `sb3Api`/`sb4Api` do not cover. Verified end to end against this image: all four
        // `spring-controllers` units compile and boot under `--offline run`.
    }
}

/*
 * A note for whoever next hits an offline resolution failure here.
 *
 * The `sb3`/`sb4` + `sb3Api`/`sb4Api` pairing covers the two usages a real build asks for, but it is still
 * one union-of-all-families configuration per usage, not the eight disjoint per-family graphs the real
 * gates resolve — so the superset invariant documented above remains a superset relation that has to be
 * *verified*, not assumed. The structural fix, if this file needs a third or fourth axis, is to stop
 * hand-modelling configurations and make the warmup a multi-project build whose subprojects apply
 * `kotlin("jvm")` and declare the real coordinate sets, so `compileClasspath`/`runtimeClasspath` resolution
 * is the real thing by construction. That was deliberately not done here: this task's budget was one
 * infrastructure risk gate, and rewriting a file whose current coordinate set is verified against all eight
 * real graphs would have put that verification back to zero.
 */
