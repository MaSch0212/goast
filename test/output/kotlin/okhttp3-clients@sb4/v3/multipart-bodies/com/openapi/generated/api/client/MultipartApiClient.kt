package com.openapi.generated.api.client

import com.openapi.generated.api.client.infrastructure.ApiClient
import com.openapi.generated.api.client.infrastructure.ApiResponse
import com.openapi.generated.api.client.infrastructure.ClientError
import com.openapi.generated.api.client.infrastructure.ClientException
import com.openapi.generated.api.client.infrastructure.MultiValueMap
import com.openapi.generated.api.client.infrastructure.PartConfig
import com.openapi.generated.api.client.infrastructure.RequestConfig
import com.openapi.generated.api.client.infrastructure.RequestMethod
import com.openapi.generated.api.client.infrastructure.ResponseType
import com.openapi.generated.api.client.infrastructure.Serializer
import com.openapi.generated.api.client.infrastructure.ServerError
import com.openapi.generated.api.client.infrastructure.ServerException
import com.openapi.generated.model.NestedObjectPartRequest
import com.openapi.generated.model.Payload
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import tools.jackson.databind.ObjectMapper
import java.io.File
import java.io.IOException

class MultipartApiClient(
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
    fun singleFile(file: File): Unit {
        val localVarResponse = singleFileWithHttpInfo(file)

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
    fun singleFileWithHttpInfo(file: File): ApiResponse<Unit?> {
        val localVariableConfig = singleFileRequestConfig(file)
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation singleFile
     */
    private fun singleFileRequestConfig(file: File): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>("file" to PartConfig(body = file))
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/file",
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
    fun multipleFiles(files: List<String>? = null): Unit {
        val localVarResponse = multipleFilesWithHttpInfo(files)

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
    fun multipleFilesWithHttpInfo(files: List<String>? = null): ApiResponse<Unit?> {
        val localVariableConfig = multipleFilesRequestConfig(files)
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation multipleFiles
     */
    private fun multipleFilesRequestConfig(files: List<String>? = null): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>("files" to PartConfig(body = files))
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/files",
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
    fun fileAndFields(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): Unit {
        val localVarResponse = fileAndFieldsWithHttpInfo(
            file,
            label,
            quantity,
            active
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
    fun fileAndFieldsWithHttpInfo(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = fileAndFieldsRequestConfig(
            file,
            label,
            quantity,
            active
        )
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation fileAndFields
     */
    private fun fileAndFieldsRequestConfig(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>(
            "file" to PartConfig(body = file),
            "label" to PartConfig(body = label),
            "quantity" to PartConfig(body = quantity),
            "active" to PartConfig(body = active)
        )
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/mixed",
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
    fun nestedObjectPart(metadata: NestedObjectPartRequest? = null): Unit {
        val localVarResponse = nestedObjectPartWithHttpInfo(metadata)

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
    fun nestedObjectPartWithHttpInfo(metadata: NestedObjectPartRequest? = null): ApiResponse<Unit?> {
        val localVariableConfig = nestedObjectPartRequestConfig(metadata)
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation nestedObjectPart
     */
    private fun nestedObjectPartRequestConfig(metadata: NestedObjectPartRequest? = null): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>("metadata" to PartConfig(body = metadata))
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/nested",
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
    fun refPart(payload: Payload? = null): Unit {
        val localVarResponse = refPartWithHttpInfo(payload)

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
    fun refPartWithHttpInfo(payload: Payload? = null): ApiResponse<Unit?> {
        val localVariableConfig = refPartRequestConfig(payload)
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation refPart
     */
    private fun refPartRequestConfig(payload: Payload? = null): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>("payload" to PartConfig(body = payload))
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/ref-part",
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
    fun withEncoding(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): Unit {
        val localVarResponse = withEncodingWithHttpInfo(
            file,
            label,
            quantity,
            active
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
    fun withEncodingWithHttpInfo(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): ApiResponse<Unit?> {
        val localVariableConfig = withEncodingRequestConfig(
            file,
            label,
            quantity,
            active
        )
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation withEncoding
     */
    private fun withEncodingRequestConfig(
        file: File = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>(
            "file" to PartConfig(body = file),
            "label" to PartConfig(body = label),
            "quantity" to PartConfig(body = quantity),
            "active" to PartConfig(body = active)
        )
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/encoded",
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
    fun optionalFile(file: File = null): Unit {
        val localVarResponse = optionalFileWithHttpInfo(file)

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
    fun optionalFileWithHttpInfo(file: File = null): ApiResponse<Unit?> {
        val localVariableConfig = optionalFileRequestConfig(file)
        return request<Map<String, PartConfig<*>>, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation optionalFile
     */
    private fun optionalFileRequestConfig(file: File = null): RequestConfig<Map<String, PartConfig<*>>> {
        val localVariableBody = mapOf<String, PartConfig<*>>("file" to PartConfig(body = file))
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "multipart/form-data"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/optional-file",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
