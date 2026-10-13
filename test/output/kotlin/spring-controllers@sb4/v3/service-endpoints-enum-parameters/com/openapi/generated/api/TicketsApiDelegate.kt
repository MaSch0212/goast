package com.openapi.generated.api

import com.openapi.generated.model.Priority
import com.openapi.generated.model.Status
import com.openapi.generated.model.Ticket
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface TicketsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listTickets(
        statuses: List<Status>,
        priorities: List<Priority>,
        priority: Priority,
        ids: List<String>?,
        xStatuses: List<Status>?
    ): ResponseEntity<Flux<Ticket>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun createTicket(ticket: Ticket?): ResponseEntity<Ticket> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun updateTicket(id: String, ticket: Ticket): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
