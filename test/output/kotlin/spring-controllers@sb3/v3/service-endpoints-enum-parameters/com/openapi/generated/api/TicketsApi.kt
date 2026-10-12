package com.openapi.generated.api

import com.openapi.generated.model.Priority
import com.openapi.generated.model.Status
import com.openapi.generated.model.Ticket
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface TicketsApi {
    companion object {
        const val LIST_TICKETS_PATH = "/tickets"
        const val CREATE_TICKET_PATH = "/tickets"
        const val UPDATE_TICKET_PATH = "/tickets/{id}"
    }

    fun getDelegate(): TicketsApiDelegate = object : TicketsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "listTickets", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The matching tickets.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Ticket::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [LIST_TICKETS_PATH])
    suspend fun listTickets(
        @Parameter(required = true, schema = Schema(allowableValues = [
                    "open",
                    "in-progress",
                    "closed"
                ]))
        @RequestParam(value = "statuses", required = true)
        statuses: List<String>,

        @Parameter(required = false, schema = Schema(defaultValue = "low,high", allowableValues = [
                    "low",
                    "medium",
                    "high"
                ]))
        @RequestParam(value = "priorities", required = false, defaultValue = "low,high")
        priorities: List<String>,

        @Parameter(required = false, schema = Schema(defaultValue = "medium", allowableValues = [
                    "low",
                    "medium",
                    "high"
                ]))
        @RequestParam(value = "priority", required = false, defaultValue = "medium")
        priority: String,

        @Parameter(required = false)
        @RequestParam(value = "ids", required = false)
        ids: List<String>?,

        @Parameter(required = false, hidden = true, schema = Schema(allowableValues = [
                    "open",
                    "in-progress",
                    "closed"
                ]))
        @RequestHeader("X-Statuses")
        xStatuses: List<String>?
    ): ResponseEntity<*> {
        val statuses = statuses.map { Status.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter statuses") }
        val priorities = priorities.map { Priority.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter priorities") }
        val priority = priority.let { Priority.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter priority") }
        val xStatuses = xStatuses?.map { Status.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter X-Statuses") }
        try {
            return getDelegate().listTickets(
                statuses,
                priorities,
                priority,
                ids,
                xStatuses
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "createTicket", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "201", description = "The created ticket.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Ticket::class))])])
    @RequestMapping(method = [RequestMethod.POST], value = [CREATE_TICKET_PATH], consumes = ["application/json"])
    suspend fun createTicket(
        @Parameter(required = false)
        @Valid
        @RequestBody(required = false)
        ticket: Ticket?
    ): ResponseEntity<*> {
        try {
            return getDelegate().createTicket(ticket)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "updateTicket", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "Ticket updated.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.PUT], value = [UPDATE_TICKET_PATH], consumes = ["application/json"])
    suspend fun updateTicket(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = true)
        @Valid
        @RequestBody
        ticket: Ticket
    ): ResponseEntity<*> {
        try {
            return getDelegate().updateTicket(id, ticket)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
