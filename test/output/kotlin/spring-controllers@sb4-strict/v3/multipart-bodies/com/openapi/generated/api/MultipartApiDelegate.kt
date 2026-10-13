package com.openapi.generated.api

import com.openapi.generated.api.MultipartApi.FileAndFieldsResponseEntity
import com.openapi.generated.api.MultipartApi.MultipleFilesResponseEntity
import com.openapi.generated.api.MultipartApi.NestedObjectPartResponseEntity
import com.openapi.generated.api.MultipartApi.OptionalFileResponseEntity
import com.openapi.generated.api.MultipartApi.RefPartResponseEntity
import com.openapi.generated.api.MultipartApi.SingleFileResponseEntity
import com.openapi.generated.api.MultipartApi.WithEncodingResponseEntity
import com.openapi.generated.model.NestedObjectPartRequest
import com.openapi.generated.model.Payload
import jakarta.annotation.Generated
import org.springframework.http.codec.multipart.FilePart
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface MultipartApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun singleFile(file: FilePart): SingleFileResponseEntity<*> {
        return SingleFileResponseEntity.notImplemented()
    }

    suspend fun multipleFiles(files: Flux<String>): MultipleFilesResponseEntity<*> {
        return MultipleFilesResponseEntity.notImplemented()
    }

    suspend fun fileAndFields(
        file: FilePart,
        label: String?,
        quantity: Int?,
        active: Boolean?
    ): FileAndFieldsResponseEntity<*> {
        return FileAndFieldsResponseEntity.notImplemented()
    }

    suspend fun nestedObjectPart(metadata: NestedObjectPartRequest?): NestedObjectPartResponseEntity<*> {
        return NestedObjectPartResponseEntity.notImplemented()
    }

    suspend fun refPart(payload: Payload?): RefPartResponseEntity<*> {
        return RefPartResponseEntity.notImplemented()
    }

    suspend fun withEncoding(
        file: FilePart,
        label: String?,
        quantity: Int?,
        active: Boolean?
    ): WithEncodingResponseEntity<*> {
        return WithEncodingResponseEntity.notImplemented()
    }

    suspend fun optionalFile(file: FilePart): OptionalFileResponseEntity<*> {
        return OptionalFileResponseEntity.notImplemented()
    }
}
