package com.openapi.generated.api

import com.openapi.generated.api.Service1Api.ListThingsResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service1ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listThings(): ListThingsResponseEntity<*> {
        return ListThingsResponseEntity.notImplemented()
    }
}
