package goast.server

import kotlinx.coroutines.reactive.awaitSingle
import org.springframework.core.io.buffer.DataBufferUtils
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart

/**
 * Thrown when a parameter Spring bound is not what the case table says the request carried.
 *
 * The delegates are the server direction's assertion, the way a typed `client.createPet(Pet(name = "x"))`
 * call is the client direction's: the only channel a test on the host can observe is the HTTP response,
 * so a mis-bound parameter has to become a *distinguishable response* or it is not observable at all.
 * `GoastExceptionHandler` renders this as `599` with the detail as a plain-text body, which lands
 * verbatim in the committed deviation artifact.
 */
class GoastMismatch(val detail: String) : RuntimeException(detail)

/**
 * Thrown when the generated return type cannot express the response the case table declares.
 *
 * One real case: `spring-controllers@sb3-strict`/`@sb4-strict` generate no response-entity factory for
 * `getWidget`'s `default` response, and the primary constructor is `private`, so the `503` that
 * `getWidget/unexpectedError` declares is unreachable from a strict delegate. Signalling it explicitly
 * keeps the artifact honest: substituting some other available status would record a smaller, wrong
 * deviation and hide the actual gap.
 */
class GoastUnexpressible(val detail: String) : RuntimeException(detail)

/** Asserts one bound parameter against the case table, and returns it so callers can chain. */
fun <T> expectParam(name: String, expected: T, actual: T): T {
    if (expected != actual) throw GoastMismatch("$name expected <$expected> but was <$actual>")
    return actual
}

/** A JSON response with an explicit status, for the lenient flavour. */
fun <T : Any> json(status: Int, body: T): ResponseEntity<T> =
    ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body)

/** Reads a multipart file part's bytes as a UTF-8 string, so its content can be asserted. */
suspend fun readPart(part: FilePart): String {
    val buffer = DataBufferUtils.join(part.content()).awaitSingle()
    try {
        val bytes = ByteArray(buffer.readableByteCount())
        buffer.read(bytes)
        return String(bytes, Charsets.UTF_8)
    } finally {
        DataBufferUtils.release(buffer)
    }
}
