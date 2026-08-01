package com.openapi.generated.api

import com.openapi.generated.api.PetsApi.GetPetResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface PetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getPet(id: String): GetPetResponseEntity<*> {
        return GetPetResponseEntity.notImplemented()
    }
}
