package goast.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/**
 * The application under test: generated controllers, handwritten delegates, nothing else.
 *
 * `proxyBeanMethods = false` is what removes the need for the Kotlin `all-open` compiler plugin —
 * Spring would otherwise have to subclass this final Kotlin class to intercept `@Bean` methods, and
 * this class declares none.
 *
 * `scanBasePackages` names both halves explicitly: the generated `@Controller` classes live in
 * `com.openapi.generated.api`, which is not under this class's own package, so the default
 * "scan my package and below" would find the delegates and none of the controllers, and every route
 * would 404.
 */
@SpringBootApplication(
    proxyBeanMethods = false,
    scanBasePackages = ["goast.server", "com.openapi.generated.api"],
)
class GoastApplication

fun main(args: Array<String>) {
    runApplication<GoastApplication>(*args)
}
