package goast.server

import com.openapi.generated.api.BlobsApiDelegate
import com.openapi.generated.model.BlobRef
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component

/**
 * `BlobsApiDelegate` for the two non-strict units.
 *
 * The generated signature binds an `application/octet-stream` request body to a `String` — the
 * generator's choice, not this test's — so the assertion is against the bytes `"hello"` the case sends,
 * decoded as UTF-8.
 */
@Component
class BlobsDelegate : BlobsApiDelegate {
    override suspend fun uploadBlob(string: String): ResponseEntity<BlobRef> {
        expectParam("uploadBlob.string", "hello", string)
        return json(201, BlobRef(id = "blob1"))
    }
}
