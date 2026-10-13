package com.openapi.generated.api

import com.openapi.generated.api.Service1Api.AndSecurityResponseEntity
import com.openapi.generated.api.Service1Api.InheritsSecurityResponseEntity
import com.openapi.generated.api.Service1Api.MultiSecurityResponseEntity
import com.openapi.generated.api.Service1Api.NoSecurityResponseEntity
import com.openapi.generated.api.Service1Api.OverridesSecurityResponseEntity
import com.openapi.generated.api.Service1Api.ScopedSecurityResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service1ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun inheritsSecurity(): InheritsSecurityResponseEntity<*> {
        return InheritsSecurityResponseEntity.notImplemented()
    }

    suspend fun overridesSecurity(): OverridesSecurityResponseEntity<*> {
        return OverridesSecurityResponseEntity.notImplemented()
    }

    suspend fun noSecurity(): NoSecurityResponseEntity<*> {
        return NoSecurityResponseEntity.notImplemented()
    }

    suspend fun multiSecurity(): MultiSecurityResponseEntity<*> {
        return MultiSecurityResponseEntity.notImplemented()
    }

    suspend fun andSecurity(): AndSecurityResponseEntity<*> {
        return AndSecurityResponseEntity.notImplemented()
    }

    suspend fun scopedSecurity(): ScopedSecurityResponseEntity<*> {
        return ScopedSecurityResponseEntity.notImplemented()
    }
}
