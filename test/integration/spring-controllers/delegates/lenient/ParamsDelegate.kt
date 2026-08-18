package goast.server

import com.openapi.generated.api.ParamsApiDelegate
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `ParamsApiDelegate` for the two non-strict units.
 *
 * `allLocations` asserts three of the four parameter locations the case declares. The fourth — the
 * spec's `session` cookie — has no parameter in the generated signature at all, so there is nothing to
 * assert and an ignored cookie changes no response: that case can conform on the wire while the
 * parameter is still dropped. Recorded in the plan and in `test/README.md`, not worked around here.
 */
@Component
class ParamsDelegate : ParamsApiDelegate {
    override suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?,
    ): ResponseEntity<Unit> {
        expectParam("allLocations.pathParam", "loc1", pathParam)
        expectParam("allLocations.queryParam", "q1", queryParam)
        expectParam("allLocations.xHeaderParam", "h1", xHeaderParam)
        return ResponseEntity.status(200).build()
    }

    override suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?,
    ): ResponseEntity<Unit> {
        styleMatrixCase(formExploded, formUnexploded, spaceDelimited)
        return ResponseEntity.status(200).build()
    }

    override suspend fun pathStyleSimple(values: List<String>): ResponseEntity<Unit> {
        expectParam("pathStyleSimple.values", listOf("a", "b"), values)
        return ResponseEntity.status(200).build()
    }

    override suspend fun getEncoded(value: String, raw: String?): ResponseEntity<Unit> {
        // The encoding case: the reference client sends `/encoded/abc%20def%2Fx?raw=a%26b%3Dc`, so a
        // correct server hands the delegate the *decoded* values — a space and a slash inside one path
        // segment, and an `&`/`=` inside one query value.
        expectParam("getEncoded.value", "abc def/x", value)
        expectParam("getEncoded.raw", "a&b=c", raw)
        return ResponseEntity.status(200).build()
    }
}
