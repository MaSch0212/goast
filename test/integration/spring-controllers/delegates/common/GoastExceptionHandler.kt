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
 *
 * **599 and 598 are deterministic; 597 is not, and that is on purpose.** The first two render only text
 * this repo wrote, so they are safe to commit as deviation artifacts. The 597 branch interpolates a
 * framework exception's own `message`, which can carry an identity hash, a buffer offset or a temp path —
 * so a 597 appearing in a committed artifact may churn between runs. Keep it that way: a 597 means
 * something happened that this phase did not model at all, and the message is the only clue about what.
 * Treat a 597 in an artifact as a finding to investigate, not as a snapshot to accept.
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
