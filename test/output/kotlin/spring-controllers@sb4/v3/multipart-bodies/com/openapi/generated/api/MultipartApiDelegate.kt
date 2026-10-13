package com.openapi.generated.api

import com.openapi.generated.model.NestedObjectPartRequest
import com.openapi.generated.model.Payload
import jakarta.annotation.Generated
import org.springframework.http.codec.multipart.FilePart
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface MultipartApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun singleFile(file: FilePart): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun multipleFiles(files: Flux<String>): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun fileAndFields(
        file: FilePart,
        label: String?,
        quantity: Int?,
        active: Boolean?
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun nestedObjectPart(metadata: NestedObjectPartRequest?): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun refPart(payload: Payload?): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun withEncoding(
        file: FilePart,
        label: String?,
        quantity: Int?,
        active: Boolean?
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun optionalFile(file: FilePart): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
