package com.openapi.generated.api

import com.openapi.generated.model.Thing
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

@Validated
@RequestMapping("\${api.base-path:/}")
interface HeadersApi {
    companion object {
        const val SINGLE_HEADER_PATH = "/one"
        const val MULTIPLE_HEADERS_PATH = "/many"
        const val REQUIRED_HEADER_PATH = "/required"
        const val DEPRECATED_HEADER_PATH = "/deprecated"
        const val REF_HEADER_PATH = "/ref"
        const val HEADERS_ON_NO_CONTENT_PATH = "/no-content-headers"
        const val HEADERS_AND_BODY_PATH = "/both"
    }

    fun getDelegate(): HeadersApiDelegate = object : HeadersApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "singleHeader", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying a single rate-limit header.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SINGLE_HEADER_PATH])
    suspend fun singleHeader(): ResponseEntity<*> {
        try {
            return getDelegate().singleHeader()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multipleHeaders", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying four headers of different types.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [MULTIPLE_HEADERS_PATH])
    suspend fun multipleHeaders(): ResponseEntity<*> {
        try {
            return getDelegate().multipleHeaders()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "requiredHeader", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying a required header.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [REQUIRED_HEADER_PATH])
    suspend fun requiredHeader(): ResponseEntity<*> {
        try {
            return getDelegate().requiredHeader()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "deprecatedHeader", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying a deprecated header.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DEPRECATED_HEADER_PATH])
    suspend fun deprecatedHeader(): ResponseEntity<*> {
        try {
            return getDelegate().deprecatedHeader()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refHeader", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying a header shared through components.headers.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [REF_HEADER_PATH])
    suspend fun refHeader(): ResponseEntity<*> {
        try {
            return getDelegate().refHeader()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "headersOnNoContent", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "A response carrying headers but no body.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [HEADERS_ON_NO_CONTENT_PATH])
    suspend fun headersOnNoContent(): ResponseEntity<*> {
        try {
            return getDelegate().headersOnNoContent()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "headersAndBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response carrying both headers and a body.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [HEADERS_AND_BODY_PATH])
    suspend fun headersAndBody(): ResponseEntity<*> {
        try {
            return getDelegate().headersAndBody()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for singleHeader.
     */
    class SingleHeaderResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = SingleHeaderResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for multipleHeaders.
     */
    class MultipleHeadersResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MultipleHeadersResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for requiredHeader.
     */
    class RequiredHeaderResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = RequiredHeaderResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for deprecatedHeader.
     */
    class DeprecatedHeaderResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeprecatedHeaderResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for refHeader.
     */
    class RefHeaderResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = RefHeaderResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for headersOnNoContent.
     */
    class HeadersOnNoContentResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 501, headers)

            fun noContent(headers: MultiValueMap<String, String>? = null) = HeadersOnNoContentResponseEntity<Unit>(null, 204, headers)
        }
    }

    /**
     * Response entity for headersAndBody.
     */
    class HeadersAndBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Thing, headers: MultiValueMap<String, String>? = null) = HeadersAndBodyResponseEntity<Thing>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
