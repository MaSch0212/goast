package com.openapi.generated.api

import com.openapi.generated.api.InheritanceApi.InheritsAndAddsResponseEntity
import com.openapi.generated.api.InheritanceApi.InheritsParamsResponseEntity
import com.openapi.generated.api.InheritanceApi.OverridesParamResponseEntity
import com.openapi.generated.api.InheritanceApi.RefParamResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface InheritanceApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun inheritsParams(id: String, common: String?): InheritsParamsResponseEntity<*> {
        return InheritsParamsResponseEntity.notImplemented()
    }

    suspend fun inheritsAndAdds(
        id: String,
        common: String?,
        extra: String?
    ): InheritsAndAddsResponseEntity<*> {
        return InheritsAndAddsResponseEntity.notImplemented()
    }

    suspend fun overridesParam(id: String, common: Int?): OverridesParamResponseEntity<*> {
        return OverridesParamResponseEntity.notImplemented()
    }

    suspend fun refParam(id: String, page: Int): RefParamResponseEntity<*> {
        return RefParamResponseEntity.notImplemented()
    }
}
