package com.openapi.generated.api

import com.openapi.generated.api.ParametersApi.BodyParamResponseEntity
import com.openapi.generated.api.ParametersApi.FileUploadResponseEntity
import com.openapi.generated.api.ParametersApi.FormDataParamsResponseEntity
import com.openapi.generated.api.ParametersApi.QueryParamsResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ParametersApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun bodyParam(): BodyParamResponseEntity<*> {
        return BodyParamResponseEntity.notImplemented()
    }

    suspend fun formDataParams(): FormDataParamsResponseEntity<*> {
        return FormDataParamsResponseEntity.notImplemented()
    }

    suspend fun fileUpload(): FileUploadResponseEntity<*> {
        return FileUploadResponseEntity.notImplemented()
    }

    suspend fun queryParams(tags: Any?, ids: Any?): QueryParamsResponseEntity<*> {
        return QueryParamsResponseEntity.notImplemented()
    }
}
