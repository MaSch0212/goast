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
