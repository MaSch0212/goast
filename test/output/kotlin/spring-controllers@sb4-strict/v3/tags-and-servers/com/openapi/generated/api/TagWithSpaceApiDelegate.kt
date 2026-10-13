package com.openapi.generated.api

import com.openapi.generated.api.TagWithSpaceApi.TagWithSpaceResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface TagWithSpaceApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun tagWithSpace(): TagWithSpaceResponseEntity<*> {
        return TagWithSpaceResponseEntity.notImplemented()
    }
}
