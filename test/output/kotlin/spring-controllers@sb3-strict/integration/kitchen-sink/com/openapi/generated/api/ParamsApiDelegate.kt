package com.openapi.generated.api

import com.openapi.generated.api.ParamsApi.AllLocationsResponseEntity
import com.openapi.generated.api.ParamsApi.GetEncodedResponseEntity
import com.openapi.generated.api.ParamsApi.PathStyleSimpleResponseEntity
import com.openapi.generated.api.ParamsApi.StyleMatrixResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ParamsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?
    ): AllLocationsResponseEntity<*> {
        return AllLocationsResponseEntity.notImplemented()
    }

    suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?
    ): StyleMatrixResponseEntity<*> {
        return StyleMatrixResponseEntity.notImplemented()
    }

    suspend fun pathStyleSimple(values: List<String>): PathStyleSimpleResponseEntity<*> {
        return PathStyleSimpleResponseEntity.notImplemented()
    }

    suspend fun getEncoded(value: String, raw: String?): GetEncodedResponseEntity<*> {
        return GetEncodedResponseEntity.notImplemented()
    }
}
