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
        add(configurationName, "com.fasterxml.jackson.module:jackson-module-kotlin")
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
        // removing that one — see `kotlin.ts`'s `DEPENDENCIES['okhttp3-clients']` comment.
        add(configurationName, "org.jetbrains.kotlin:kotlin-stdlib-common:2.2.0")
    }
    sb3(platform("org.springframework.boot:spring-boot-dependencies:3.5.6"))
    sb4(platform("org.springframework.boot:spring-boot-dependencies:4.0.0"))
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
