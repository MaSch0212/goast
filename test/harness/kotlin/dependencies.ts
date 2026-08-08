/**
 * Dependency lines for one profile family.
 *
 * `shared` applies to both Spring Boot lines; `sb3`/`sb4` are appended for the resolved variant only.
 * The split exists because a profile family is *not* guaranteed to have one dependency surface across
 * both variants — see `okhttp3-clients` below, whose sb4 tree is generated against Jackson 3 while its
 * sb3 tree uses Jackson 2. A family-only table (what this was before Task 6) necessarily gives both
 * variants the same lines and cannot express that.
 */
export type DependencySet = { shared: string[]; sb3?: string[]; sb4?: string[] };

/** Dependency lines per profile family, keyed by the profile name's prefix before `@`. */
export const KOTLIN_DEPENDENCIES: Readonly<Record<string, DependencySet>> = {
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

export const KOTLIN_BOM: Readonly<Record<'sb3' | 'sb4', string>> = {
  sb3: 'org.springframework.boot:spring-boot-dependencies:3.5.6',
  sb4: 'org.springframework.boot:spring-boot-dependencies:4.0.0',
};

/**
 * Dependency lines for one profile family and Spring Boot variant: `shared` plus the variant slot.
 *
 * The single place tier 3 and tier 4 both go for a family's coordinates, so neither tier can drift
 * from the other the way the warmup's hand-maintained coordinate list can still drift from this one.
 */
export function kotlinDependenciesFor(family: string, variant: 'sb3' | 'sb4'): string[] {
  const set = KOTLIN_DEPENDENCIES[family];
  if (set === undefined) {
    throw new Error(
      `No dependency set for Kotlin profile family "${family}". Add one to KOTLIN_DEPENDENCIES in ` +
        `test/harness/kotlin/dependencies.ts.`,
    );
  }
  return [...set.shared, ...(set[variant] ?? [])];
}
