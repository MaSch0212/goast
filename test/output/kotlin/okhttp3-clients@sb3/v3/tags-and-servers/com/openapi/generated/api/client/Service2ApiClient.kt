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

class Service2ApiClient(
    basePath: String = defaultBasePath,
    client: Factory = defaultClient,
    objectMapper: ObjectMapper = Serializer.jacksonObjectMapper
) : ApiClient(basePath, client, objectMapper) {
    companion object {
        @JvmStatic
        val defaultBasePath: String by lazy {
            System.getProperties().getProperty(ApiClient.baseUrlKey, "https://api.example.com/v1")
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
    fun untagged(): Unit {
        val localVarResponse = untaggedWithHttpInfo()

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
    fun untaggedWithHttpInfo(): ApiResponse<Unit?> {
        val localVariableConfig = untaggedRequestConfig()
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation untagged
     */
    private fun untaggedRequestConfig(): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/untagged",
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
    fun pathServer(): Unit {
        val localVarResponse = pathServerWithHttpInfo()

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
    fun pathServerWithHttpInfo(): ApiResponse<Unit?> {
        val localVariableConfig = pathServerRequestConfig()
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation pathServer
     */
    private fun pathServerRequestConfig(): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/path-server",
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
    fun opServer(): Unit {
        val localVarResponse = opServerWithHttpInfo()

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
    fun opServerWithHttpInfo(): ApiResponse<Unit?> {
        val localVariableConfig = opServerRequestConfig()
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation opServer
     */
    private fun opServerRequestConfig(): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/op-server",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
