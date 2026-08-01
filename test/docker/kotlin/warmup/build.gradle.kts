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
        add(configurationName, "org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
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
    // Jackson 2's module is *removed* from the loop for the same reason in reverse — sb4's generated
    // tree imports nothing from `com.fasterxml.jackson.databind`, so warming it against the sb4 BOM
    // would put artifacts in the cache that no real subproject asks for while making the warmed graph
    // differ from the real one. Both configurations resolving the same graph the real build resolves is
    // the property that makes `--offline` work; a superset is not automatically safe, because a larger
    // graph can resolve a shared transitive *upwards* and leave the version the smaller real graph
    // wants uncached.
    sb3("com.fasterxml.jackson.module:jackson-module-kotlin")
    sb4("tools.jackson.module:jackson-module-kotlin")
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
    }
}
