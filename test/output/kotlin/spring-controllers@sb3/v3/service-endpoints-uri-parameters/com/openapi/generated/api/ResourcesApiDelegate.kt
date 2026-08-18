package com.openapi.generated.api

import com.openapi.generated.model.Permission
import com.openapi.generated.model.Resource
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ResourcesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listResources(
        permission: Permission,
        limit: Int?,
        tags: List<String>?,
        xTenant: String
    ): ResponseEntity<Flux<Resource>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun getPermittedResources(
        resourceType: String,
        permission: Permission?,
        limit: Int?
    ): ResponseEntity<Flux<Resource>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun checkResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): ResponseEntity<Boolean> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun grantResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        notify: Boolean?,
        resource: Resource
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
