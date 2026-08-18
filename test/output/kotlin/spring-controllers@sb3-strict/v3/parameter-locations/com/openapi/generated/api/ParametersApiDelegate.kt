package com.openapi.generated.api

import com.openapi.generated.api.ParametersApi.AllowEmptyValueParamResponseEntity
import com.openapi.generated.api.ParametersApi.CookieParamsResponseEntity
import com.openapi.generated.api.ParametersApi.DescribedParamsResponseEntity
import com.openapi.generated.api.ParametersApi.HeaderParamsResponseEntity
import com.openapi.generated.api.ParametersApi.MixedParamsResponseEntity
import com.openapi.generated.api.ParametersApi.QueryParamsResponseEntity
import com.openapi.generated.api.ParametersApi.ReservedCharParamResponseEntity
import com.openapi.generated.api.ParametersApi.TwoPathParamsResponseEntity
import com.openapi.generated.model.ParamSchema
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ParametersApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun twoPathParams(id: String, sub: Int): TwoPathParamsResponseEntity<*> {
        return TwoPathParamsResponseEntity.notImplemented()
    }

    suspend fun queryParams(
        requiredString: String,
        optionalString: String?,
        intWithDefault: Int,
        flag: Boolean?
    ): QueryParamsResponseEntity<*> {
        return QueryParamsResponseEntity.notImplemented()
    }

    suspend fun headerParams(xRequestId: String, xOptionalHeader: String?): HeaderParamsResponseEntity<*> {
        return HeaderParamsResponseEntity.notImplemented()
    }

    suspend fun cookieParams(): CookieParamsResponseEntity<*> {
        return CookieParamsResponseEntity.notImplemented()
    }

    suspend fun mixedParams(
        id: String,
        filter: String?,
        xTraceId: String?
    ): MixedParamsResponseEntity<*> {
        return MixedParamsResponseEntity.notImplemented()
    }

    suspend fun describedParams(
        withDescription: String?,
        withoutDescription: String?,
        withExample: String?,
        withRefSchema: ParamSchema?
    ): DescribedParamsResponseEntity<*> {
        return DescribedParamsResponseEntity.notImplemented()
    }

    suspend fun allowEmptyValueParam(search: String?): AllowEmptyValueParamResponseEntity<*> {
        return AllowEmptyValueParamResponseEntity.notImplemented()
    }

    suspend fun reservedCharParam(filter: String?): ReservedCharParamResponseEntity<*> {
        return ReservedCharParamResponseEntity.notImplemented()
    }
}
