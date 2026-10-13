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
import com.openapi.generated.api.client.infrastructure.Success
import com.openapi.generated.model.Priority
import com.openapi.generated.model.Status
import com.openapi.generated.model.Ticket
import okhttp3.Call.Factory
import okhttp3.HttpUrl
import tools.jackson.databind.ObjectMapper
import java.io.IOException

class TicketsApiClient(
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
    fun listTickets(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null
    ): List<Ticket> {
        val localVarResponse = listTicketsWithHttpInfo(
            statuses,
            priorities,
            priority,
            ids,
            xStatuses
        )

        return when (localVarResponse.responseType) {
            ResponseType.Success -> (localVarResponse as Success<*>).data as List<Ticket>
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
    fun listTicketsWithHttpInfo(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null
    ): ApiResponse<List<Ticket>?> {
        val localVariableConfig = listTicketsRequestConfig(
            statuses,
            priorities,
            priority,
            ids,
            xStatuses
        )
        return request<Unit, List<Ticket>>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation listTickets
     */
    private fun listTicketsRequestConfig(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null
    ): RequestConfig<Unit> {
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
            .apply {
                put("statuses", listOf(statuses.joinToString(",", transform = Status::value)))
                if (priorities != null) {
                    put("priorities", listOf(priorities.joinToString(",", transform = Priority::value)))
                }
                if (priority != null) {
                    put("priority", listOf(priority.value))
                }
                if (ids != null) {
                    put("ids", listOf(ids.joinToString(",")))
                }
            }
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        if (xStatuses != null) {
            localVariableHeaders["X-Statuses"] = xStatuses.joinToString(",", transform = Status::value)
        }
        return RequestConfig(
            method = RequestMethod.GET,
            path = "/tickets",
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
    fun createTicket(ticket: Ticket? = null): Ticket {
        val localVarResponse = createTicketWithHttpInfo(ticket)

        return when (localVarResponse.responseType) {
            ResponseType.Success -> (localVarResponse as Success<*>).data as Ticket
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
    fun createTicketWithHttpInfo(ticket: Ticket? = null): ApiResponse<Ticket?> {
        val localVariableConfig = createTicketRequestConfig(ticket)
        return request<Ticket, Ticket>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation createTicket
     */
    private fun createTicketRequestConfig(ticket: Ticket? = null): RequestConfig<Ticket> {
        val localVariableBody = ticket
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.POST,
            path = "/tickets",
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
    fun updateTicket(id: String, ticket: Ticket): Unit {
        val localVarResponse = updateTicketWithHttpInfo(id, ticket)

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
    fun updateTicketWithHttpInfo(id: String, ticket: Ticket): ApiResponse<Unit?> {
        val localVariableConfig = updateTicketRequestConfig(id, ticket)
        return request<Ticket, Unit>(localVariableConfig)
    }

    /**
     * To obtain the request config of the operation updateTicket
     */
    private fun updateTicketRequestConfig(id: String, ticket: Ticket): RequestConfig<Ticket> {
        val localVariableBody = ticket
        val localVariableQuery: MultiValueMap = mutableMapOf<String, List<String>>()
        val localVariableHeaders: MutableMap<String, String> = mutableMapOf()
        localVariableHeaders["Content-Type"] = "application/json"
        return RequestConfig(
            method = RequestMethod.PUT,
            path = "/tickets/${encodeURIComponent(id.toString())}",
            query = localVariableQuery,
            headers = localVariableHeaders,
            requiresAuthentication = false,
            body = localVariableBody
        )
    }

    private fun encodeURIComponent(uriComponent: String): String = HttpUrl.Builder().scheme("http").host("localhost").addPathSegment(uriComponent).build().encodedPathSegments[0]
}
