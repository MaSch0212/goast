package goast.server

import com.openapi.generated.api.BlobsApi.UploadBlobResponseEntity
import com.openapi.generated.api.BlobsApiDelegate
import com.openapi.generated.model.BlobRef
import org.springframework.stereotype.Component

/** `BlobsApiDelegate` for the two `-strict` units. Assertion as in the lenient delegate. */
@Component
class BlobsDelegate : BlobsApiDelegate {
    override suspend fun uploadBlob(string: String): UploadBlobResponseEntity<*> {
        expectParam("uploadBlob.string", "hello", string)
        return UploadBlobResponseEntity.created(BlobRef(id = "blob1"))
    }
}
