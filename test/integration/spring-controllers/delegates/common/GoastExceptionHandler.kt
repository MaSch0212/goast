package goast.server

import com.openapi.generated.api.ApiExceptionHandler
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * Turns a delegate's own failure into a deterministic response.
 *
 * Every generated controller method wraps its delegate call in
 * `catch (e: Throwable) { return getExceptionHandler()?.handleApiException(e) ?: throw e }`, and every
 * generated `*ApiController` takes an `@Autowired(required = false) ApiExceptionHandler?`, so a single
 * bean here is wired into all of them.
 *
 * Without it the rethrow reaches WebFlux's default error handling, whose body carries a `timestamp` and
 * a `requestId` — nondeterministic values that would make every deviation artifact churn on each run.
 *
 * `handleApiException` returns an unconstrained `ResponseEntity<*>` in the strict flavour as well as the
 * lenient one (the generated `ApiExceptionHandler.kt` is byte-identical across all four profiles), which
 * is what makes one handler enough. That freedom is deliberately *not* used to work around the strict
 * flavour's missing factories: see `GoastUnexpressible`.
 */
@Component
class GoastExceptionHandler : ApiExceptionHandler {
    override suspend fun handleApiException(exception: Throwable): ResponseEntity<*> = when (exception) {
        is GoastMismatch -> plain(599, "MISMATCH ${exception.detail}")
        is GoastUnexpressible -> plain(598, "UNEXPRESSIBLE ${exception.detail}")
        else -> plain(597, "UNEXPECTED ${exception::class.java.name}: ${exception.message}")
    }

    private fun plain(status: Int, body: String): ResponseEntity<String> =
        ResponseEntity.status(status).contentType(MediaType.TEXT_PLAIN).body(body)
}
