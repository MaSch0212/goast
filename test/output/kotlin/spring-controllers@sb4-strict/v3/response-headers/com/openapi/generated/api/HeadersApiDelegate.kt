package com.openapi.generated.api

import com.openapi.generated.api.HeadersApi.DeprecatedHeaderResponseEntity
import com.openapi.generated.api.HeadersApi.HeadersAndBodyResponseEntity
import com.openapi.generated.api.HeadersApi.HeadersOnNoContentResponseEntity
import com.openapi.generated.api.HeadersApi.MultipleHeadersResponseEntity
import com.openapi.generated.api.HeadersApi.RefHeaderResponseEntity
import com.openapi.generated.api.HeadersApi.RequiredHeaderResponseEntity
import com.openapi.generated.api.HeadersApi.SingleHeaderResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface HeadersApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun singleHeader(): SingleHeaderResponseEntity<*> {
        return SingleHeaderResponseEntity.notImplemented()
    }

    suspend fun multipleHeaders(): MultipleHeadersResponseEntity<*> {
        return MultipleHeadersResponseEntity.notImplemented()
    }

    suspend fun requiredHeader(): RequiredHeaderResponseEntity<*> {
        return RequiredHeaderResponseEntity.notImplemented()
    }

    suspend fun deprecatedHeader(): DeprecatedHeaderResponseEntity<*> {
        return DeprecatedHeaderResponseEntity.notImplemented()
    }

    suspend fun refHeader(): RefHeaderResponseEntity<*> {
        return RefHeaderResponseEntity.notImplemented()
    }

    suspend fun headersOnNoContent(): HeadersOnNoContentResponseEntity<*> {
        return HeadersOnNoContentResponseEntity.notImplemented()
    }

    suspend fun headersAndBody(): HeadersAndBodyResponseEntity<*> {
        return HeadersAndBodyResponseEntity.notImplemented()
    }
}
