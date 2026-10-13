package com.openapi.generated.api

import com.openapi.generated.api.Service2Api.OpServerResponseEntity
import com.openapi.generated.api.Service2Api.PathServerResponseEntity
import com.openapi.generated.api.Service2Api.UntaggedResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service2ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun untagged(): UntaggedResponseEntity<*> {
        return UntaggedResponseEntity.notImplemented()
    }

    suspend fun pathServer(): PathServerResponseEntity<*> {
        return PathServerResponseEntity.notImplemented()
    }

    suspend fun opServer(): OpServerResponseEntity<*> {
        return OpServerResponseEntity.notImplemented()
    }
}
