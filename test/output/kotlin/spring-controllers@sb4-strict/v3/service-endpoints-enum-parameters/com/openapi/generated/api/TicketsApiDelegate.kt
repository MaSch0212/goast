package com.openapi.generated.api

import com.openapi.generated.api.TicketsApi.CreateTicketResponseEntity
import com.openapi.generated.api.TicketsApi.ListTicketsResponseEntity
import com.openapi.generated.api.TicketsApi.UpdateTicketResponseEntity
import com.openapi.generated.model.Priority
import com.openapi.generated.model.Status
import com.openapi.generated.model.Ticket
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
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
    ): ListTicketsResponseEntity<*> {
        return ListTicketsResponseEntity.notImplemented()
    }

    suspend fun createTicket(ticket: Ticket?): CreateTicketResponseEntity<*> {
        return CreateTicketResponseEntity.notImplemented()
    }

    suspend fun updateTicket(id: String, ticket: Ticket): UpdateTicketResponseEntity<*> {
        return UpdateTicketResponseEntity.notImplemented()
    }
}
