package com.openapi.generated.api

import com.openapi.generated.api.AlphaApi.OneTagResponseEntity
import com.openapi.generated.api.AlphaApi.SharedTagResponseEntity
import com.openapi.generated.api.AlphaApi.TwoTagsResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface AlphaApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun oneTag(): OneTagResponseEntity<*> {
        return OneTagResponseEntity.notImplemented()
    }

    suspend fun twoTags(): TwoTagsResponseEntity<*> {
        return TwoTagsResponseEntity.notImplemented()
    }

    suspend fun sharedTag(): SharedTagResponseEntity<*> {
        return SharedTagResponseEntity.notImplemented()
    }
}
