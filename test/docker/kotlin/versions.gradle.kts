// Every dependency coordinate tier 3 uses, in one place. The Dockerfile consumes this to pre-warm a
// cache layer, and the synthesized build consumes it for real, so the warm cache is guaranteed to
// cover what the build resolves.
object Versions {
    const val kotlin = "2.2.0"
    const val springBoot3 = "3.5.6"
    const val springBoot4 = "4.0.0"
    const val swaggerAnnotations = "2.2.30"
    const val okhttp = "4.12.0"
    const val jacksonAnnotations = "2.18.2"
}

object Deps {
    val swagger = "io.swagger.core.v3:swagger-annotations:${Versions.swaggerAnnotations}"
    val jacksonAnnotations = "com.fasterxml.jackson.core:jackson-annotations:${Versions.jacksonAnnotations}"
    val okhttp = "com.squareup.okhttp3:okhttp:${Versions.okhttp}"
}
