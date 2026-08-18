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
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
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

    /**
     * Response entity for getWidget.
     */
    class GetWidgetResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(body: Error, headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Error>(body, 400, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(body: Error, headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Error>(body, 500, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Unit?>(null, 501, headers)

            fun ok(body: Widget, headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Widget>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun notFound(body: Error, headers: MultiValueMap<String, String>? = null) = GetWidgetResponseEntity<Error>(body, 404, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
