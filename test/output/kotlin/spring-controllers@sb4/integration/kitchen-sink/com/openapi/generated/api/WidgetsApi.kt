package com.openapi.generated.api

import com.openapi.generated.model.Error
import com.openapi.generated.model.Widget
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface WidgetsApi {
    companion object {
        const val GET_WIDGET_PATH = "/widgets/{id}"
    }

    fun getDelegate(): WidgetsApiDelegate = object : WidgetsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "getWidget", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "200", description = "The widget.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Widget::class))]),
            ApiResponse(responseCode = "400", description = "The request was invalid.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "404", description = "The widget was not found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "500", description = "An internal error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "default", description = "An unexpected error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_WIDGET_PATH])
    suspend fun getWidget(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().getWidget(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
