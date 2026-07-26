package com.openapi.generated.api

import com.openapi.generated.api.BetaApi.TwoTagsResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface BetaApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun twoTags(): TwoTagsResponseEntity<*> {
        return TwoTagsResponseEntity.notImplemented()
    }
}
