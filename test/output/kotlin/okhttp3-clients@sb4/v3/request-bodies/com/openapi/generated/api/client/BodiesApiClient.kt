package com.openapi.generated.api.client

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
import com.openapi.generated.model.FormBodyRequest
import com.openapi.generated.model.InlineJsonBodyRequest
import com.openapi.generated.model.Payload
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import tools.jackson.databind.ObjectMapper
import java.io.IOException

class BodiesApiClient(
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
    fun jsonBody(payload: Payload): Unit {
        val localVarResponse = jsonBodyWithHttpInfo(payload)

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
    fun jsonBodyWithHttpInfo(payload: Payload): ApiResponse<Unit?> {
        val localVariableConfig = jsonBodyRequestConfig(payload)
        return request<Payload, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation jsonBody
     */
    private fun jsonBodyRequestConfig(payload: Payload): RequestConfig<Payload> {
        val localVariableBody = payload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/json",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun optionalJsonBody(payload: Payload? = null): Unit {
        val localVarResponse = optionalJsonBodyWithHttpInfo(payload)

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
    fun optionalJsonBodyWithHttpInfo(payload: Payload? = null): ApiResponse<Unit?> {
        val localVariableConfig = optionalJsonBodyRequestConfig(payload)
        return request<Payload, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation optionalJsonBody
     */
    private fun optionalJsonBodyRequestConfig(payload: Payload? = null): RequestConfig<Payload> {
        val localVariableBody = payload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/json-optional",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun inlineJsonBody(inlineJsonBodyRequest: InlineJsonBodyRequest): Unit {
        val localVarResponse = inlineJsonBodyWithHttpInfo(inlineJsonBodyRequest)

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
    fun inlineJsonBodyWithHttpInfo(inlineJsonBodyRequest: InlineJsonBodyRequest): ApiResponse<Unit?> {
        val localVariableConfig = inlineJsonBodyRequestConfig(inlineJsonBodyRequest)
        return request<InlineJsonBodyRequest, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation inlineJsonBody
     */
    private fun inlineJsonBodyRequestConfig(inlineJsonBodyRequest: InlineJsonBodyRequest): RequestConfig<InlineJsonBodyRequest> {
        val localVariableBody = inlineJsonBodyRequest
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/json-inline",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun arrayJsonBody(listPayload: List<Payload>): Unit {
        val localVarResponse = arrayJsonBodyWithHttpInfo(listPayload)

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
    fun arrayJsonBodyWithHttpInfo(listPayload: List<Payload>): ApiResponse<Unit?> {
        val localVariableConfig = arrayJsonBodyRequestConfig(listPayload)
        return request<List<Payload>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation arrayJsonBody
     */
    private fun arrayJsonBodyRequestConfig(listPayload: List<Payload>): RequestConfig<List<Payload>> {
        val localVariableBody = listPayload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/json-array",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun primitiveJsonBody(string: String): Unit {
        val localVarResponse = primitiveJsonBodyWithHttpInfo(string)

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
    fun primitiveJsonBodyWithHttpInfo(string: String): ApiResponse<Unit?> {
        val localVariableConfig = primitiveJsonBodyRequestConfig(string)
        return request<String, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation primitiveJsonBody
     */
    private fun primitiveJsonBodyRequestConfig(string: String): RequestConfig<String> {
        val localVariableBody = string
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/json-primitive",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun textBody(string: String): Unit {
        val localVarResponse = textBodyWithHttpInfo(string)

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
    fun textBodyWithHttpInfo(string: String): ApiResponse<Unit?> {
        val localVariableConfig = textBodyRequestConfig(string)
        return request<String, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation textBody
     */
    private fun textBodyRequestConfig(string: String): RequestConfig<String> {
        val localVariableBody = string
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "text/plain"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/text",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun binaryBody(string: String): Unit {
        val localVarResponse = binaryBodyWithHttpInfo(string)

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
    fun binaryBodyWithHttpInfo(string: String): ApiResponse<Unit?> {
        val localVariableConfig = binaryBodyRequestConfig(string)
        return request<String, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation binaryBody
     */
    private fun binaryBodyRequestConfig(string: String): RequestConfig<String> {
        val localVariableBody = string
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/octet-stream"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/binary",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun anyBody(body: Any): Unit {
        val localVarResponse = anyBodyWithHttpInfo(body)

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
    fun anyBodyWithHttpInfo(body: Any): ApiResponse<Unit?> {
        val localVariableConfig = anyBodyRequestConfig(body)
        return request<Any, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation anyBody
     */
    private fun anyBodyRequestConfig(body: Any): RequestConfig<Any> {
        val localVariableBody = body
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "*/*"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/any",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun multiContentBody(payload: Payload): Unit {
        val localVarResponse = multiContentBodyWithHttpInfo(payload)

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
    fun multiContentBodyWithHttpInfo(payload: Payload): ApiResponse<Unit?> {
        val localVariableConfig = multiContentBodyRequestConfig(payload)
        return request<Payload, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation multiContentBody
     */
    private fun multiContentBodyRequestConfig(payload: Payload): RequestConfig<Payload> {
        val localVariableBody = payload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/multi-content",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
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
    fun formBody(formBodyRequest: FormBodyRequest): Unit {
        val localVarResponse = formBodyWithHttpInfo(formBodyRequest)

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
    fun formBodyWithHttpInfo(formBodyRequest: FormBodyRequest): ApiResponse<Unit?> {
        val localVariableConfig = formBodyRequestConfig(formBodyRequest)
        return request<FormBodyRequest, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation formBody
     */
    private fun formBodyRequestConfig(formBodyRequest: FormBodyRequest): RequestConfig<FormBodyRequest> {
        val localVariableBody = formBodyRequest
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/x-www-form-urlencoded"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/form",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    /**
     * @param payload A body with an explanation of its purpose.
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
    fun describedBody(payload: Payload): Unit {
        val localVarResponse = describedBodyWithHttpInfo(payload)

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
     * @param payload A body with an explanation of its purpose.
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun describedBodyWithHttpInfo(payload: Payload): ApiResponse<Unit?> {
        val localVariableConfig = describedBodyRequestConfig(payload)
        return request<Payload, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation describedBody
     *
     * @param payload A body with an explanation of its purpose.
     */
    private fun describedBodyRequestConfig(payload: Payload): RequestConfig<Payload> {
        val localVariableBody = payload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/described-body",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    /**
     * @param payload A request body shared through components.requestBodies.
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
    fun refBody(payload: Payload): Unit {
        val localVarResponse = refBodyWithHttpInfo(payload)

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
     * @param payload A request body shared through components.requestBodies.
     * @throws IllegalStateException If the request is not correctly configured
     * @throws IOException Rethrows the OkHttp execute method exception
     */
    @Throws(IllegalStateException::class, IOException::class)
    fun refBodyWithHttpInfo(payload: Payload): ApiResponse<Unit?> {
        val localVariableConfig = refBodyRequestConfig(payload)
        return request<Payload, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation refBody
     *
     * @param payload A request body shared through components.requestBodies.
     */
    private fun refBodyRequestConfig(payload: Payload): RequestConfig<Payload> {
        val localVariableBody = payload
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/ref-body",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
