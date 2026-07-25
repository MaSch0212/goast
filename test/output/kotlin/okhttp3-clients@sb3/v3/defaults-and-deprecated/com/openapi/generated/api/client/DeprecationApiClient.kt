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
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import java.io.IOException

class DeprecationApiClient(
    basePath: String = defaultBasePath,
    client: Factory = defaultClient,
    objectMapper: ObjectMapper = Serializer.jacksonObjectMapper
) : ApiClient(basePath, objectMapper, client) {
    companion object {
        @JvmStatic
        val defaultBasePath: String by lazy {
            System.getProperties().getProperty(ApiClient.baseUrlKey, "/")
        }
    }

    /**
     * This operation is deprecated.
     *
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
    @Deprecated("")
    fun deprecatedOp(): Unit {
        val localVarResponse = deprecatedOpWithHttpInfo()

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
     * This operation is deprecated.
     *
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    @Deprecated("")
    fun deprecatedOpWithHttpInfo(): ApiResponse<Unit?> {
        val localVariableConfig = deprecatedOpRequestConfig()
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation deprecatedOp
     */
    @Deprecated("")
    private fun deprecatedOpRequestConfig(): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/deprecated-op",
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
    @Deprecated("")
    fun deprecatedOpNoDesc(): Unit {
        val localVarResponse = deprecatedOpNoDescWithHttpInfo()

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
    @Deprecated("")
    fun deprecatedOpNoDescWithHttpInfo(): ApiResponse<Unit?> {
        val localVariableConfig = deprecatedOpNoDescRequestConfig()
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation deprecatedOpNoDesc
     */
    @Deprecated("")
    private fun deprecatedOpNoDescRequestConfig(): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/deprecated-op-no-desc",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    /**
     * @param withDesc This parameter is deprecated.
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
    fun deprecatedParams(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): Unit {
        val localVarResponse = deprecatedParamsWithHttpInfo(withDesc, noDesc, plain)

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
     * @param withDesc This parameter is deprecated.
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun deprecatedParamsWithHttpInfo(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = deprecatedParamsRequestConfig(withDesc, noDesc, plain)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation deprecatedParams
     *
     * @param withDesc This parameter is deprecated.
     */
    private fun deprecatedParamsRequestConfig(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (withDesc != null) {
                    put("withDesc", listOf(withDesc.toString()))
                }
                if (noDesc != null) {
                    put("noDesc", listOf(noDesc.toString()))
                }
                if (plain != null) {
                    put("plain", listOf(plain.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/deprecated-params",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
