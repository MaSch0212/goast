package com.openapi.generated.api

import com.openapi.generated.model.Thing
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface Service1Api {
    companion object {
        const val LIST_THINGS_PATH = "/things"
    }

    fun getDelegate(): Service1ApiDelegate = object : Service1ApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "listThings", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A list of things.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Thing::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [LIST_THINGS_PATH])
    suspend fun listThings(): ResponseEntity<*> {
        try {
            return getDelegate().listThings()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
