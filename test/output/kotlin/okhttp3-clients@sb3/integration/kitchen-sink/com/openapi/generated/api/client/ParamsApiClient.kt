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

class ParamsApiClient(
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
    fun allLocations(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null
    ): Unit {
        val localVarResponse = allLocationsWithHttpInfo(pathParam, queryParam, xHeaderParam)

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
    fun allLocationsWithHttpInfo(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = allLocationsRequestConfig(pathParam, queryParam, xHeaderParam)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation allLocations
     */
    private fun allLocationsRequestConfig(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (queryParam != null) {
                    put("queryParam", listOf(queryParam.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        if (xHeaderParam != null) {
            localVariableHeaders["X-Header-Param"] = xHeaderParam.toString()
        }
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/locations/${encodeURIComponent(pathParam.toString())}",
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
    fun styleMatrix(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): Unit {
        val localVarResponse = styleMatrixWithHttpInfo(formExploded, formUnexploded, spaceDelimited)

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
    fun styleMatrixWithHttpInfo(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = styleMatrixRequestConfig(formExploded, formUnexploded, spaceDelimited)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation styleMatrix
     */
    private fun styleMatrixRequestConfig(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (formExploded != null) {
                    put("formExploded", listOf(formExploded.joinToString()))
                }
                if (formUnexploded != null) {
                    put("formUnexploded", listOf(formUnexploded.joinToString()))
                }
                if (spaceDelimited != null) {
                    put("spaceDelimited", listOf(spaceDelimited.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/styles",
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
    fun pathStyleSimple(values: List<String>): Unit {
        val localVarResponse = pathStyleSimpleWithHttpInfo(values)

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
    fun pathStyleSimpleWithHttpInfo(values: List<String>): ApiResponse<Unit?> {
        val localVariableConfig = pathStyleSimpleRequestConfig(values)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation pathStyleSimple
     */
    private fun pathStyleSimpleRequestConfig(values: List<String>): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/styles/${encodeURIComponent(values.joinToString())}",
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
    fun getEncoded(value: String, raw: String? = null): Unit {
        val localVarResponse = getEncodedWithHttpInfo(value, raw)

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
    fun getEncodedWithHttpInfo(value: String, raw: String? = null): ApiResponse<Unit?> {
        val localVariableConfig = getEncodedRequestConfig(value, raw)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation getEncoded
     */
    private fun getEncodedRequestConfig(value: String, raw: String? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (raw != null) {
                    put("raw", listOf(raw.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/encoded/${encodeURIComponent(value.toString())}",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
