package com.openapi.generated.api

import com.openapi.generated.model.Thing
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import reactor.core.publisher.Flux

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

    /**
     * Response entity for listThings.
     */
    class ListThingsResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Flux<Thing>, headers: MultiValueMap<String, String>? = null) = ListThingsResponseEntity<Flux<Thing>>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
