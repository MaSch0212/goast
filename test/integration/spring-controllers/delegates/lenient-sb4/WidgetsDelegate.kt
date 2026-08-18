package goast.server

import com.openapi.generated.api.WidgetsApiDelegate
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `WidgetsApiDelegate` for `spring-controllers@sb4`.
 *
 * The `@sb3` twin in `../lenient-sb3/` is identical except for one type argument: the generated
 * interface returns `ResponseEntity<Any?>` under `@sb3` and `ResponseEntity<Any>` under `@sb4`, and
 * `ResponseEntity<T>` is invariant in `T`, so no single override satisfies both. That one line is the
 * entire reason the lenient flavour has per-variant source directories; everything else the two units
 * need is shared. The case data itself lives in `CaseData.kt#widgetCase`, so the duplication here is
 * the signature, not the behaviour.
 */
@Component
class WidgetsDelegate : WidgetsApiDelegate {
    override suspend fun getWidget(id: String): ResponseEntity<Any> {
        val (status, body) = widgetCase(id)
        var builder = ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON)
        // Declared as a response header on the 200 only, so it is sent on the 200 only.
        if (status == 200) builder = builder.header("X-Rate-Limit", "42")
        return builder.body<Any>(body)
    }
}
