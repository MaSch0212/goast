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
import com.openapi.generated.model.Schema12
import com.openapi.generated.model.Schema5
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import java.io.IOException

class StylesApiClient(
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
    fun formArray(tags: List<String>? = null): Unit {
        val localVarResponse = formArrayWithHttpInfo(tags)

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
    fun formArrayWithHttpInfo(tags: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = formArrayRequestConfig(tags)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation formArray
     */
    private fun formArrayRequestConfig(tags: List<String>? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (tags != null) {
                    put("tags", listOf(tags.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-form-array",
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
    fun formArrayNoExplode(tags: List<String>? = null): Unit {
        val localVarResponse = formArrayNoExplodeWithHttpInfo(tags)

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
    fun formArrayNoExplodeWithHttpInfo(tags: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = formArrayNoExplodeRequestConfig(tags)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation formArrayNoExplode
     */
    private fun formArrayNoExplodeRequestConfig(tags: List<String>? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (tags != null) {
                    put("tags", listOf(tags.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-form-array-no-explode",
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
    fun formObject(coordinates: Schema5? = null): Unit {
        val localVarResponse = formObjectWithHttpInfo(coordinates)

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
    fun formObjectWithHttpInfo(coordinates: Schema5? = null): ApiResponse<Unit?> {
        val localVariableConfig = formObjectRequestConfig(coordinates)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation formObject
     */
    private fun formObjectRequestConfig(coordinates: Schema5? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (coordinates != null) {
                    put("coordinates", listOf(coordinates.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-form-object",
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
    fun spaceDelimited(tags: List<String>? = null): Unit {
        val localVarResponse = spaceDelimitedWithHttpInfo(tags)

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
    fun spaceDelimitedWithHttpInfo(tags: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = spaceDelimitedRequestConfig(tags)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation spaceDelimited
     */
    private fun spaceDelimitedRequestConfig(tags: List<String>? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (tags != null) {
                    put("tags", listOf(tags.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-space-delimited",
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
    fun pipeDelimited(tags: List<String>? = null): Unit {
        val localVarResponse = pipeDelimitedWithHttpInfo(tags)

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
    fun pipeDelimitedWithHttpInfo(tags: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = pipeDelimitedRequestConfig(tags)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation pipeDelimited
     */
    private fun pipeDelimitedRequestConfig(tags: List<String>? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (tags != null) {
                    put("tags", listOf(tags.joinToString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-pipe-delimited",
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
    fun deepObject(filter: Schema12? = null): Unit {
        val localVarResponse = deepObjectWithHttpInfo(filter)

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
    fun deepObjectWithHttpInfo(filter: Schema12? = null): ApiResponse<Unit?> {
        val localVariableConfig = deepObjectRequestConfig(filter)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation deepObject
     */
    private fun deepObjectRequestConfig(filter: Schema12? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                if (filter != null) {
                    put("filter", listOf(filter.toString()))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/query-deep-object",
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
    fun simplePath(values: List<String>): Unit {
        val localVarResponse = simplePathWithHttpInfo(values)

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
    fun simplePathWithHttpInfo(values: List<String>): ApiResponse<Unit?> {
        val localVariableConfig = simplePathRequestConfig(values)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation simplePath
     */
    private fun simplePathRequestConfig(values: List<String>): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/simple-path/${encodeURIComponent(values.joinToString())}",
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
    fun labelPath(values: List<String>): Unit {
        val localVarResponse = labelPathWithHttpInfo(values)

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
    fun labelPathWithHttpInfo(values: List<String>): ApiResponse<Unit?> {
        val localVariableConfig = labelPathRequestConfig(values)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation labelPath
     */
    private fun labelPathRequestConfig(values: List<String>): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/label-path/${encodeURIComponent(values.joinToString())}",
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
    fun matrixPath(values: List<String>): Unit {
        val localVarResponse = matrixPathWithHttpInfo(values)

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
    fun matrixPathWithHttpInfo(values: List<String>): ApiResponse<Unit?> {
        val localVariableConfig = matrixPathRequestConfig(values)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation matrixPath
     */
    private fun matrixPathRequestConfig(values: List<String>): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/matrix-path/${encodeURIComponent(values.joinToString())}",
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
    fun simpleHeader(xTags: List<String>? = null): Unit {
        val localVarResponse = simpleHeaderWithHttpInfo(xTags)

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
    fun simpleHeaderWithHttpInfo(xTags: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = simpleHeaderRequestConfig(xTags)
        return request<Unit, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation simpleHeader
     */
    private fun simpleHeaderRequestConfig(xTags: List<String>? = null): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        if (xTags != null) {
            localVariableHeaders["X-Tags"] = xTags.joinToString()
        }
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/simple-header",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
