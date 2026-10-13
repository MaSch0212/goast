package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:https://api.example.com/v1}")
interface Service2Api {
    companion object {
        const val UNTAGGED_PATH = "/untagged"
        const val PATH_SERVER_PATH = "/path-server"
        const val OP_SERVER_PATH = "/op-server"
    }

    fun getDelegate(): Service2ApiDelegate = object : Service2ApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "untagged", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An untagged operation.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [UNTAGGED_PATH])
    suspend fun untagged(): ResponseEntity<*> {
        try {
            return getDelegate().untagged()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "pathServer", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation under a path-item-level server override.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [PATH_SERVER_PATH])
    suspend fun pathServer(): ResponseEntity<*> {
        try {
            return getDelegate().pathServer()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "opServer", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation with its own server override.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [OP_SERVER_PATH])
    suspend fun opServer(): ResponseEntity<*> {
        try {
            return getDelegate().opServer()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
