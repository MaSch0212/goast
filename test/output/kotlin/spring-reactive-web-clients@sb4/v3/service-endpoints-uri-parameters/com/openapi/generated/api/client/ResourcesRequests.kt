package com.openapi.generated.api.client

import com.openapi.generated.model.Permission
import com.openapi.generated.model.Resource
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object ResourcesRequests {
    suspend fun WebClient.listResources(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null
    ): List<Resource> {
        return this
            .listResourcesRequest(
                permission,
                xTenant,
                limit,
                tags
            )
            .retrieve()
            .awaitBody<List<Resource>>()
    }

    suspend fun <T : Any> WebClient.listResources(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.listResourcesRequest(
            permission,
            xTenant,
            limit,
            tags
        ).awaitExchange(responseHandler)
    }

    fun listResourcesUri(
        permission: Permission,
        limit: Int? = null,
        tags: List<String>? = null
    ): String {
        return UriComponentsBuilder.fromPath("resources")
            .apply {
                queryParam("permission", permission.value)
                limit?.also { queryParam("limit", it.toString()) }
                tags?.also { queryParam("tags", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.listResourcesRequest(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("resources") { uriBuilder ->
                uriBuilder
                    .apply {
                        queryParam("permission", permission.value)
                        limit?.also { queryParam("limit", it.toString()) }
                        tags?.also { queryParam("tags", it.joinToString()) }
                    }
                    .build()
            }
            .accept(MediaType.APPLICATION_JSON)
            .headers { headers ->
                headers.add("X-Tenant", xTenant.toString())
            }
    }

    suspend fun WebClient.getPermittedResources(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): List<Resource> {
        return this
            .getPermittedResourcesRequest(resourceType, permission, limit)
            .retrieve()
            .awaitBody<List<Resource>>()
    }

    suspend fun <T : Any> WebClient.getPermittedResources(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.getPermittedResourcesRequest(resourceType, permission, limit).awaitExchange(responseHandler)
    }

    fun getPermittedResourcesUri(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): String {
        return UriComponentsBuilder.fromPath("resources/{resourceType}")
            .apply {
                permission?.also { queryParam("permission", it.value) }
                limit?.also { queryParam("limit", it.toString()) }
            }
            .buildAndExpand(mapOf("resourceType" to resourceType.toString()))
            .toUriString()
    }

    fun WebClient.getPermittedResourcesRequest(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("resources/{resourceType}") { uriBuilder ->
                uriBuilder
                    .apply {
                        permission?.also { queryParam("permission", it.value) }
                        limit?.also { queryParam("limit", it.toString()) }
                    }
                    .build(mapOf("resourceType" to resourceType.toString()))
            }
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.checkResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): Boolean {
        return this
            .checkResourcePermissionRequest(resourceType, resourceId, permission)
            .retrieve()
            .awaitBody<Boolean>()
    }

    suspend fun <T : Any> WebClient.checkResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.checkResourcePermissionRequest(resourceType, resourceId, permission).awaitExchange(responseHandler)
    }

    fun checkResourcePermissionUri(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): String {
        return UriComponentsBuilder.fromPath("resources/{resourceType}/{resourceId}/{permission}")
            .buildAndExpand(mapOf("resourceType" to resourceType.toString(), "resourceId" to resourceId.toString(), "permission" to permission.value))
            .toUriString()
    }

    fun WebClient.checkResourcePermissionRequest(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("resources/{resourceType}/{resourceId}/{permission}", mapOf("resourceType" to resourceType.toString(), "resourceId" to resourceId.toString(), "permission" to permission.value))
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.grantResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null
    ): Unit {
        this
            .grantResourcePermissionRequest(
                resourceType,
                resourceId,
                permission,
                resource,
                notify
            )
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.grantResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.grantResourcePermissionRequest(
            resourceType,
            resourceId,
            permission,
            resource,
            notify
        ).awaitExchange(responseHandler)
    }

    fun grantResourcePermissionUri(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        notify: Boolean? = null
    ): String {
        return UriComponentsBuilder.fromPath("resources/{resourceType}/{resourceId}/{permission}")
            .apply {
                notify?.also { queryParam("notify", it.toString()) }
            }
            .buildAndExpand(mapOf("resourceType" to resourceType.toString(), "resourceId" to resourceId.toString(), "permission" to permission.value))
            .toUriString()
    }

    fun WebClient.grantResourcePermissionRequest(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.PUT)
            .uri("resources/{resourceType}/{resourceId}/{permission}") { uriBuilder ->
                uriBuilder
                    .apply {
                        notify?.also { queryParam("notify", it.toString()) }
                    }
                    .build(mapOf("resourceType" to resourceType.toString(), "resourceId" to resourceId.toString(), "permission" to permission.value))
            }
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(resource)
    }
}
