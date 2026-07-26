package com.openapi.generated.api

import com.openapi.generated.model.FormBodyRequest
import com.openapi.generated.model.InlineJsonBodyRequest
import com.openapi.generated.model.Payload
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import reactor.core.publisher.Flux

@Validated
@RequestMapping("\${api.base-path:/}")
interface BodiesApi {
    companion object {
        const val JSON_BODY_PATH = "/json"
        const val OPTIONAL_JSON_BODY_PATH = "/json-optional"
        const val INLINE_JSON_BODY_PATH = "/json-inline"
        const val ARRAY_JSON_BODY_PATH = "/json-array"
        const val PRIMITIVE_JSON_BODY_PATH = "/json-primitive"
        const val TEXT_BODY_PATH = "/text"
        const val BINARY_BODY_PATH = "/binary"
        const val ANY_BODY_PATH = "/any"
        const val MULTI_CONTENT_BODY_PATH = "/multi-content"
        const val FORM_BODY_PATH = "/form"
        const val DESCRIBED_BODY_PATH = "/described-body"
        const val REF_BODY_PATH = "/ref-body"
    }

    fun getDelegate(): BodiesApiDelegate = object : BodiesApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "jsonBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The JSON body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [JSON_BODY_PATH], consumes = ["application/json"])
    suspend fun jsonBody(
        @Parameter(required = true)
        @Valid
        @RequestBody
        payload: Payload
    ): ResponseEntity<*> {
        try {
            return getDelegate().jsonBody(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "optionalJsonBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The optional JSON body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [OPTIONAL_JSON_BODY_PATH], consumes = ["application/json"])
    suspend fun optionalJsonBody(
        @Parameter(required = false)
        @Valid
        @RequestBody
        payload: Payload?
    ): ResponseEntity<*> {
        try {
            return getDelegate().optionalJsonBody(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "inlineJsonBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The inline JSON body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [INLINE_JSON_BODY_PATH], consumes = ["application/json"])
    suspend fun inlineJsonBody(
        @Parameter(required = true)
        @Valid
        @RequestBody
        inlineJsonBodyRequest: InlineJsonBodyRequest
    ): ResponseEntity<*> {
        try {
            return getDelegate().inlineJsonBody(inlineJsonBodyRequest)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "arrayJsonBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The array of payloads was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [ARRAY_JSON_BODY_PATH], consumes = ["application/json"])
    suspend fun arrayJsonBody(
        @Parameter(required = true)
        @RequestBody
        listPayload: Flux<Payload>
    ): ResponseEntity<*> {
        try {
            return getDelegate().arrayJsonBody(listPayload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "primitiveJsonBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The primitive JSON body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [PRIMITIVE_JSON_BODY_PATH], consumes = ["application/json"])
    suspend fun primitiveJsonBody(
        @Parameter(required = true)
        @RequestBody
        string: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().primitiveJsonBody(string)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "textBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The text body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [TEXT_BODY_PATH], consumes = ["text/plain"])
    suspend fun textBody(
        @Parameter(required = true)
        @RequestBody
        string: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().textBody(string)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "binaryBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The binary body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [BINARY_BODY_PATH], consumes = ["application/octet-stream"])
    suspend fun binaryBody(
        @Parameter(required = true)
        @RequestBody
        string: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().binaryBody(string)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "anyBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The body of any content type was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [ANY_BODY_PATH], consumes = ["*/*"])
    suspend fun anyBody(
        @Parameter(required = true)
        @RequestBody
        body: Any
    ): ResponseEntity<*> {
        try {
            return getDelegate().anyBody(body)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multiContentBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "One of the three content types was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [MULTI_CONTENT_BODY_PATH], consumes = [
            "application/json",
            "application/xml",
            "text/plain"
        ])
    suspend fun multiContentBody(
        @Parameter(required = true)
        @Valid
        @RequestBody
        payload: Payload
    ): ResponseEntity<*> {
        try {
            return getDelegate().multiContentBody(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "formBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The form body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [FORM_BODY_PATH], consumes = ["application/x-www-form-urlencoded"])
    suspend fun formBody(
        @Parameter(required = true)
        @Valid
        @RequestBody
        formBodyRequest: FormBodyRequest
    ): ResponseEntity<*> {
        try {
            return getDelegate().formBody(formBodyRequest)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "describedBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The described body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [DESCRIBED_BODY_PATH], consumes = ["application/json"])
    suspend fun describedBody(
        @Parameter(description = "A body with an explanation of its purpose.", required = true)
        @Valid
        @RequestBody
        payload: Payload
    ): ResponseEntity<*> {
        try {
            return getDelegate().describedBody(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refBody", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The shared request body was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [REF_BODY_PATH], consumes = ["application/json"])
    suspend fun refBody(
        @Parameter(description = "A request body shared through components.requestBodies.", required = true)
        @Valid
        @RequestBody
        payload: Payload
    ): ResponseEntity<*> {
        try {
            return getDelegate().refBody(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for jsonBody.
     */
    class JsonBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = JsonBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for optionalJsonBody.
     */
    class OptionalJsonBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OptionalJsonBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for inlineJsonBody.
     */
    class InlineJsonBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = InlineJsonBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for arrayJsonBody.
     */
    class ArrayJsonBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = ArrayJsonBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for primitiveJsonBody.
     */
    class PrimitiveJsonBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PrimitiveJsonBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for textBody.
     */
    class TextBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = TextBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for binaryBody.
     */
    class BinaryBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = BinaryBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for anyBody.
     */
    class AnyBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = AnyBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for multiContentBody.
     */
    class MultiContentBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MultiContentBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for formBody.
     */
    class FormBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FormBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for describedBody.
     */
    class DescribedBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DescribedBodyResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for refBody.
     */
    class RefBodyResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = RefBodyResponseEntity<Unit>(null, 200, headers)
        }
    }
}
