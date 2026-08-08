package com.openapi.generated.api

import com.openapi.generated.model.Error
import com.openapi.generated.model.OtherThing
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
interface ResponsesApi {
    companion object {
        const val TWO_SUCCESS_CODES_PATH = "/two-success"
        const val SUCCESS_AND_DEFAULT_PATH = "/default"
        const val ONLY_DEFAULT_PATH = "/only-default"
        const val NO_CONTENT_PATH = "/no-content"
        const val EMPTY_BODY_200_PATH = "/empty-200"
        const val RANGE_CODES_PATH = "/ranges"
        const val MIXED_EXACT_AND_RANGE_PATH = "/mixed-codes"
        const val ERROR_CODES_PATH = "/errors"
        const val MULTI_CONTENT_RESPONSE_PATH = "/multi-content"
        const val PRIMITIVE_RESPONSE_PATH = "/primitive"
        const val ARRAY_RESPONSE_PATH = "/array"
        const val REF_RESPONSE_PATH = "/ref-response"
    }

    fun getDelegate(): ResponsesApiDelegate = object : ResponsesApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "twoSuccessCodes", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing already existed.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]), ApiResponse(responseCode = "201", description = "The thing was created.", content = [Content(mediaType = "application/json", schema = Schema(implementation = OtherThing::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [TWO_SUCCESS_CODES_PATH])
    suspend fun twoSuccessCodes(): ResponseEntity<*> {
        try {
            return getDelegate().twoSuccessCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "successAndDefault", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]), ApiResponse(responseCode = "default", description = "An unexpected error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [SUCCESS_AND_DEFAULT_PATH])
    suspend fun successAndDefault(): ResponseEntity<*> {
        try {
            return getDelegate().successAndDefault()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "onlyDefault", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "default", description = "Whatever happens, this is the response.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [ONLY_DEFAULT_PATH])
    suspend fun onlyDefault(): ResponseEntity<*> {
        try {
            return getDelegate().onlyDefault()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "noContent", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "There is nothing to return.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [NO_CONTENT_PATH])
    suspend fun noContent(): ResponseEntity<*> {
        try {
            return getDelegate().noContent()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "emptyBody200", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The request succeeded, with no response body.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [EMPTY_BODY_200_PATH])
    suspend fun emptyBody200(): ResponseEntity<*> {
        try {
            return getDelegate().emptyBody200()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "rangeCodes", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "2XX", description = "Any success.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "4XX", description = "Any client error.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "5XX", description = "Any server error.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [RANGE_CODES_PATH])
    suspend fun rangeCodes(): ResponseEntity<*> {
        try {
            return getDelegate().rangeCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "mixedExactAndRange", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "2XX", description = "Some other success.", content = [Content(mediaType = "application/json", schema = Schema(implementation = OtherThing::class))]),
            ApiResponse(responseCode = "default", description = "An unexpected error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [MIXED_EXACT_AND_RANGE_PATH])
    suspend fun mixedExactAndRange(): ResponseEntity<*> {
        try {
            return getDelegate().mixedExactAndRange()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "errorCodes", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "400", description = "The request was invalid.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "401", description = "Authentication is required.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "404", description = "The thing was not found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "500", description = "An internal error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [ERROR_CODES_PATH])
    suspend fun errorCodes(): ResponseEntity<*> {
        try {
            return getDelegate().errorCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multiContentResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing, as JSON or as plain text.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class)), Content(mediaType = "text/plain", schema = Schema(implementation = String::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [MULTI_CONTENT_RESPONSE_PATH])
    suspend fun multiContentResponse(): ResponseEntity<*> {
        try {
            return getDelegate().multiContentResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "primitiveResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A plain string.", content = [Content(mediaType = "application/json", schema = Schema(implementation = String::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [PRIMITIVE_RESPONSE_PATH])
    suspend fun primitiveResponse(): ResponseEntity<*> {
        try {
            return getDelegate().primitiveResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "arrayResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An array of things.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Thing::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [ARRAY_RESPONSE_PATH])
    suspend fun arrayResponse(): ResponseEntity<*> {
        try {
            return getDelegate().arrayResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response shared through components.responses.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [REF_RESPONSE_PATH])
    suspend fun refResponse(): ResponseEntity<*> {
        try {
            return getDelegate().refResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for twoSuccessCodes.
     */
    class TwoSuccessCodesResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun created(body: OtherThing, headers: MultiValueMap<String, String>? = null) = TwoSuccessCodesResponseEntity<OtherThing>(body, 201, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for successAndDefault.
     */
    class SuccessAndDefaultResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = SuccessAndDefaultResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for onlyDefault.
     */
    class OnlyDefaultResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OnlyDefaultResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OnlyDefaultResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OnlyDefaultResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OnlyDefaultResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OnlyDefaultResponseEntity<Unit>(null, 501, headers)
        }
    }

    /**
     * Response entity for noContent.
     */
    class NoContentResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 501, headers)

            fun noContent(headers: MultiValueMap<String, String>? = null) = NoContentResponseEntity<Unit>(null, 204, headers)
        }
    }

    /**
     * Response entity for emptyBody200.
     */
    class EmptyBody200ResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = EmptyBody200ResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for rangeCodes.
     */
    class RangeCodesResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RangeCodesResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RangeCodesResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RangeCodesResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RangeCodesResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RangeCodesResponseEntity<Unit>(null, 501, headers)
        }
    }

    /**
     * Response entity for mixedExactAndRange.
     */
    class MixedExactAndRangeResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = MixedExactAndRangeResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for errorCodes.
     */
    class ErrorCodesResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(body: Error, headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Error>(body, 400, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun unauthorized(body: Error, headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Error>(body, 401, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(body: Error, headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Error>(body, 500, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })

            fun notFound(body: Error, headers: MultiValueMap<String, String>? = null) = ErrorCodesResponseEntity<Error>(body, 404, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for multiContentResponse.
     */
    class MultiContentResponseResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Any, headers: MultiValueMap<String, String>? = null) = MultiContentResponseResponseEntity<Any>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for primitiveResponse.
     */
    class PrimitiveResponseResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<Unit>(null, 501, headers)

            fun ok(body: String, headers: MultiValueMap<String, String>? = null) = PrimitiveResponseResponseEntity<String>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for arrayResponse.
     */
    class ArrayResponseResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Flux<Thing>, headers: MultiValueMap<String, String>? = null) = ArrayResponseResponseEntity<Flux<Thing>>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for refResponse.
     */
    class RefResponseResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = RefResponseResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
