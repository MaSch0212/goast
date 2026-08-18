package com.openapi.generated.api

import com.openapi.generated.api.DeprecationApi.DeprecatedOpNoDescResponseEntity
import com.openapi.generated.api.DeprecationApi.DeprecatedOpResponseEntity
import com.openapi.generated.api.DeprecationApi.DeprecatedParamsResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface DeprecationApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    /**
     * This operation is deprecated.
     */
    suspend fun deprecatedOp(): DeprecatedOpResponseEntity<*> {
        return DeprecatedOpResponseEntity.notImplemented()
    }

    suspend fun deprecatedOpNoDesc(): DeprecatedOpNoDescResponseEntity<*> {
        return DeprecatedOpNoDescResponseEntity.notImplemented()
    }

    suspend fun deprecatedParams(
        withDesc: String?,
        noDesc: String?,
        plain: String?
    ): DeprecatedParamsResponseEntity<*> {
        return DeprecatedParamsResponseEntity.notImplemented()
    }
}
