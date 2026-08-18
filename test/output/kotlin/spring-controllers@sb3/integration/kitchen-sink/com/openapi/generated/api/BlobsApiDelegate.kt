package com.openapi.generated.api

import com.openapi.generated.model.BlobRef
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface BlobsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun uploadBlob(string: String): ResponseEntity<BlobRef> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
