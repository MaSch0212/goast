package com.openapi.generated.api

import com.openapi.generated.api.ResourcesApi.CheckResourcePermissionResponseEntity
import com.openapi.generated.api.ResourcesApi.GetPermittedResourcesResponseEntity
import com.openapi.generated.api.ResourcesApi.GrantResourcePermissionResponseEntity
import com.openapi.generated.api.ResourcesApi.ListResourcesResponseEntity
import com.openapi.generated.model.Permission
import com.openapi.generated.model.Resource
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ResourcesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listResources(
        permission: Permission,
        limit: Int?,
        tags: List<String>?,
        xTenant: String
    ): ListResourcesResponseEntity<*> {
        return ListResourcesResponseEntity.notImplemented()
    }

    suspend fun getPermittedResources(
        resourceType: String,
        permission: Permission?,
        limit: Int?
    ): GetPermittedResourcesResponseEntity<*> {
        return GetPermittedResourcesResponseEntity.notImplemented()
    }

    suspend fun checkResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): CheckResourcePermissionResponseEntity<*> {
        return CheckResourcePermissionResponseEntity.notImplemented()
    }

    suspend fun grantResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        notify: Boolean?,
        resource: Resource
    ): GrantResourcePermissionResponseEntity<*> {
        return GrantResourcePermissionResponseEntity.notImplemented()
    }
}
