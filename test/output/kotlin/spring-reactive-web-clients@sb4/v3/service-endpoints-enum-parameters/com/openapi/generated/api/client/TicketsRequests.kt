package com.openapi.generated.api.client

import com.openapi.generated.model.Priority
import com.openapi.generated.model.Status
import com.openapi.generated.model.Ticket
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object TicketsRequests {
    suspend fun WebClient.listTickets(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null
    ): List<Ticket> {
        return this
            .listTicketsRequest(
                statuses,
                priorities,
                priority,
                ids,
                xStatuses
            )
            .retrieve()
            .awaitBody<List<Ticket>>()
    }

    suspend fun <T : Any> WebClient.listTickets(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.listTicketsRequest(
            statuses,
            priorities,
            priority,
            ids,
            xStatuses
        ).awaitExchange(responseHandler)
    }

    fun listTicketsUri(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null
    ): String {
        return UriComponentsBuilder.fromPath("tickets")
            .apply {
                queryParam("statuses", statuses.joinToString(",", transform = Status::value))
                priorities?.also { queryParam("priorities", it.joinToString(",", transform = Priority::value)) }
                priority?.also { queryParam("priority", it.value) }
                ids?.also { queryParam("ids", it.joinToString(",")) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.listTicketsRequest(
        statuses: List<Status>,
        priorities: List<Priority>? = listOf(Priority.LOW, Priority.HIGH),
        priority: Priority? = Priority.MEDIUM,
        ids: List<String>? = null,
        xStatuses: List<Status>? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("tickets") { uriBuilder ->
                uriBuilder
                    .apply {
                        queryParam("statuses", statuses.joinToString(",", transform = Status::value))
                        priorities?.also { queryParam("priorities", it.joinToString(",", transform = Priority::value)) }
                        priority?.also { queryParam("priority", it.value) }
                        ids?.also { queryParam("ids", it.joinToString(",")) }
                    }
                    .build()
            }
            .accept(MediaType.APPLICATION_JSON)
            .headers { headers ->
                xStatuses?.also { headers.add("X-Statuses", it.joinToString(",", transform = Status::value)) }
            }
    }

    suspend fun WebClient.createTicket(ticket: Ticket? = null): Ticket {
        return this
            .createTicketRequest(ticket)
            .retrieve()
            .awaitBody<Ticket>()
    }

    suspend fun <T : Any> WebClient.createTicket(ticket: Ticket? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.createTicketRequest(ticket).awaitExchange(responseHandler)
    }

    fun createTicketUri(): String {
        return UriComponentsBuilder.fromPath("tickets")
            .build()
            .toUriString()
    }

    fun WebClient.createTicketRequest(ticket: Ticket? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("tickets")
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.parseMediaType("application/json"))
            .apply { ticket?.also { ticket -> bodyValue(ticket) } }
    }

    suspend fun WebClient.updateTicket(id: String, ticket: Ticket): Unit {
        this
            .updateTicketRequest(id, ticket)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.updateTicket(
        id: String,
        ticket: Ticket,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.updateTicketRequest(id, ticket).awaitExchange(responseHandler)
    }

    fun updateTicketUri(id: String): String {
        return UriComponentsBuilder.fromPath("tickets/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.updateTicketRequest(id: String, ticket: Ticket): RequestHeadersSpec<*> {
        return this.method(HttpMethod.PUT)
            .uri("tickets/{id}", mapOf("id" to id.toString()))
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(ticket)
    }
}
