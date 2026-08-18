package com.openapi.generated.api.client

import com.fasterxml.jackson.databind.ObjectMapper
import com.openapi.generated.api.client.infrastructure.ApiClient
import com.openapi.generated.api.client.infrastructure.ApiResponse
import com.openapi.generated.api.client.infrastructure.ClientError
import com.openapi.generated.api.client.infrastructure.ClientException
import com.openapi.generated.api.client.infrastructure.MultiValueMap
import com.openapi.generated.api.client.infrastructure.RequestConfig
import com.openapi.generated.api.client.infrastructure.RequestMethod
import com.openapi.generated.api.client.infrastructure.ResponseType
import com.openapi.generated.api.client.infrastructure.Serializer
import com.openapi.generated.api.client.infrastructure.ServerError
import com.openapi.generated.api.client.infrastructure.ServerException
import com.openapi.generated.api.client.infrastructure.Success
import com.openapi.generated.model.Permission
import com.openapi.generated.model.Resource
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import java.io.IOException

class ResourcesApiClient(
    basePath: String = defaultBasePath,
    client: Factory = defaultClient,
    objectMapper: ObjectMapper = Serializer.jacksonObjectMapper
) : ApiClient(basePath, client, objectMapper) {
    companion object {
        @JvmStatic
        val defaultBasePath: String by lazy {
            System.getProperties().getProperty(ApiClient.baseUrlKey, "/")
        }
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     * @throws UnsupportedOperationException If the API returns an informational or redirection response
     * @throws ClientException If the API returns a client error response
     * @throws ServerException If the API returns a server error response
     */
    @Throws(
        IllegalStateException::class,
        IOException::class,
        UnsupportedOperationException::class,
        ClientException::class,
        ServerException::class
    )
    fun listResources(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null
    ): List<Resource> {
        val localVarResponse = listResourcesWithHttpInfo(
            permission,
            xTenant,
            limit,
            tags
        )

        return when (localVarResponse.responseType) {
            ResponseType.Success -> (localVarResponse as Success<*>).data as List<Resource>
            ResponseType.Informational -> throw UnsupportedOperationException("Client does not support Informational responses.")
            ResponseType.Redirection -> throw UnsupportedOperationException("Client does not support Redirection responses.")
            ResponseType.ClientError -> {
                val localVarError = localVarResponse as ClientError<*>
                throw ClientException(
                    "Client error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }

            ResponseType.ServerError -> {
                val localVarError = localVarResponse as ServerError<*>
                throw ServerException(
                    "Server error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }
        }
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun listResourcesWithHttpInfo(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null
    ): ApiResponse<List<Resource>?> {
        val localVariableConfig = listResourcesRequestConfig(
            permission,
            xTenant,
            limit,
            tags
        )
        return request<Unit, List<Resource>>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation listResources
     */
    private fun listResourcesRequestConfig(
        permission: Permission,
        xTenant: String,
        limit: Int? = null,
        tags: List<String>? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                put("permission", listOf(permission.value))
                if (limit != null) {
                    put("limit", listOf(limit.toString()))
                }
                if (tags != null) {
                    put("tags", listOf(tags.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        if (xTenant != null) {
            localVariableHeaders["X-Tenant"] = xTenant.toString()
        }
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/resources",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     * @throws UnsupportedOperationException If the API returns an informational or redirection response
     * @throws ClientException If the API returns a client error response
     * @throws ServerException If the API returns a server error response
     */
    @Throws(
        IllegalStateException::class,
        IOException::class,
        UnsupportedOperationException::class,
        ClientException::class,
        ServerException::class
    )
    fun getPermittedResources(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): List<Resource> {
        val localVarResponse = getPermittedResourcesWithHttpInfo(resourceType, permission, limit)

        return when (localVarResponse.responseType) {
            ResponseType.Success -> (localVarResponse as Success<*>).data as List<Resource>
            ResponseType.Informational -> throw UnsupportedOperationException("Client does not support Informational responses.")
            ResponseType.Redirection -> throw UnsupportedOperationException("Client does not support Redirection responses.")
            ResponseType.ClientError -> {
                val localVarError = localVarResponse as ClientError<*>
                throw ClientException(
                    "Client error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }

            ResponseType.ServerError -> {
                val localVarError = localVarResponse as ServerError<*>
                throw ServerException(
                    "Server error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }
        }
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun getPermittedResourcesWithHttpInfo(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): ApiResponse<List<Resource>?> {
        val localVariableConfig = getPermittedResourcesRequestConfig(resourceType, permission, limit)
        return request<Unit, List<Resource>>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation getPermittedResources
     */
    private fun getPermittedResourcesRequestConfig(
        resourceType: String,
        permission: Permission? = null,
        limit: Int? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (permission != null) {
                    put("permission", listOf(permission.value))
                }
                if (limit != null) {
                    put("limit", listOf(limit.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/resources/${encodeURIComponent(resourceType.toString())}",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     * @throws UnsupportedOperationException If the API returns an informational or redirection response
     * @throws ClientException If the API returns a client error response
     * @throws ServerException If the API returns a server error response
     */
    @Throws(
        IllegalStateException::class,
        IOException::class,
        UnsupportedOperationException::class,
        ClientException::class,
        ServerException::class
    )
    fun checkResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): Boolean {
        val localVarResponse = checkResourcePermissionWithHttpInfo(resourceType, resourceId, permission)

        return when (localVarResponse.responseType) {
            ResponseType.Success -> (localVarResponse as Success<*>).data as Boolean
            ResponseType.Informational -> throw UnsupportedOperationException("Client does not support Informational responses.")
            ResponseType.Redirection -> throw UnsupportedOperationException("Client does not support Redirection responses.")
            ResponseType.ClientError -> {
                val localVarError = localVarResponse as ClientError<*>
                throw ClientException(
                    "Client error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }

            ResponseType.ServerError -> {
                val localVarError = localVarResponse as ServerError<*>
                throw ServerException(
                    "Server error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }
        }
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun checkResourcePermissionWithHttpInfo(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): ApiResponse<Boolean?> {
        val localVariableConfig = checkResourcePermissionRequestConfig(resourceType, resourceId, permission)
        return request<Unit, Boolean>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation checkResourcePermission
     */
    private fun checkResourcePermissionRequestConfig(
        resourceType: String,
        resourceId: String,
        permission: Permission
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/resources/${encodeURIComponent(resourceType.toString())}/${encodeURIComponent(resourceId.toString())}/${encodeURIComponent(permission.value)}",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     * @throws UnsupportedOperationException If the API returns an informational or redirection response
     * @throws ClientException If the API returns a client error response
     * @throws ServerException If the API returns a server error response
     */
    @Throws(
        IllegalStateException::class,
        IOException::class,
        UnsupportedOperationException::class,
        ClientException::class,
        ServerException::class
    )
    fun grantResourcePermission(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null
    ): Unit {
        val localVarResponse = grantResourcePermissionWithHttpInfo(
            resourceType,
            resourceId,
            permission,
            resource,
            notify
        )

        return when (localVarResponse.responseType) {
            ResponseType.Success -> Unit
            ResponseType.Informational -> throw UnsupportedOperationException("Client does not support Informational responses.")
            ResponseType.Redirection -> throw UnsupportedOperationException("Client does not support Redirection responses.")
            ResponseType.ClientError -> {
                val localVarError = localVarResponse as ClientError<*>
                throw ClientException(
                    "Client error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }

            ResponseType.ServerError -> {
                val localVarError = localVarResponse as ServerError<*>
                throw ServerException(
                    "Server error : ${localVarError.statusCode} ${localVarError.message.orEmpty()}",
                    localVarError.statusCode,
                    localVarResponse
                )
            }
        }
    }

    /**
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun grantResourcePermissionWithHttpInfo(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = grantResourcePermissionRequestConfig(
            resourceType,
            resourceId,
            permission,
            resource,
            notify
        )
        return request<Resource, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation grantResourcePermission
     */
    private fun grantResourcePermissionRequestConfig(
        resourceType: String,
        resourceId: String,
        permission: Permission,
        resource: Resource,
        notify: Boolean? = null
    ): RequestConfig<Resource> {
        val localVariableBody = resource
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (notify != null) {
                    put("notify", listOf(notify.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.PUT,
            path = "/resources/${encodeURIComponent(resourceType.toString())}/${encodeURIComponent(resourceId.toString())}/${encodeURIComponent(permission.value)}",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
