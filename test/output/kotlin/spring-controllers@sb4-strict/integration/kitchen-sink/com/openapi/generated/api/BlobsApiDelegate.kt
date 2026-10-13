package com.openapi.generated.api

import com.openapi.generated.api.BlobsApi.UploadBlobResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface BlobsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun uploadBlob(string: String): UploadBlobResponseEntity<*> {
        return UploadBlobResponseEntity.notImplemented()
    }
}
