package com.openapi.generated.api

import com.openapi.generated.model.Schema12
import com.openapi.generated.model.Schema5
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface StylesApi {
    companion object {
        const val FORM_ARRAY_PATH = "/query-form-array"
        const val FORM_ARRAY_NO_EXPLODE_PATH = "/query-form-array-no-explode"
        const val FORM_OBJECT_PATH = "/query-form-object"
        const val SPACE_DELIMITED_PATH = "/query-space-delimited"
        const val PIPE_DELIMITED_PATH = "/query-pipe-delimited"
        const val DEEP_OBJECT_PATH = "/query-deep-object"
        const val SIMPLE_PATH_PATH = "/simple-path/{values}"
        const val LABEL_PATH_PATH = "/label-path/{values}"
        const val MATRIX_PATH_PATH = "/matrix-path/{values}"
        const val SIMPLE_HEADER_PATH = "/simple-header"
    }

    fun getDelegate(): StylesApiDelegate = object : StylesApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "formArray", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The form-style, exploded array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [FORM_ARRAY_PATH])
    suspend fun formArray(
        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().formArray(tags)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "formArrayNoExplode", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The form-style, non-exploded array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [FORM_ARRAY_NO_EXPLODE_PATH])
    suspend fun formArrayNoExplode(
        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().formArrayNoExplode(tags)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "formObject", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The form-style, exploded object parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [FORM_OBJECT_PATH])
    suspend fun formObject(
        @Parameter(required = false)
        @Valid
        @RequestParam(value = "coordinates", required = false)
        coordinates: Schema5?
    ): ResponseEntity<*> {
        try {
            return getDelegate().formObject(coordinates)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "spaceDelimited", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The space-delimited array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SPACE_DELIMITED_PATH])
    suspend fun spaceDelimited(
        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().spaceDelimited(tags)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "pipeDelimited", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The pipe-delimited array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [PIPE_DELIMITED_PATH])
    suspend fun pipeDelimited(
        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().pipeDelimited(tags)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "deepObject", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The deep-object array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DEEP_OBJECT_PATH])
    suspend fun deepObject(
        @Parameter(required = false)
        @Valid
        @RequestParam(value = "filter", required = false)
        filter: Schema12?
    ): ResponseEntity<*> {
        try {
            return getDelegate().deepObject(filter)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "simplePath", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The simple-style path parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SIMPLE_PATH_PATH])
    suspend fun simplePath(
        @Parameter(required = true)
        @PathVariable("values")
        values: List<String>
    ): ResponseEntity<*> {
        try {
            return getDelegate().simplePath(values)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "labelPath", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The label-style path parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [LABEL_PATH_PATH])
    suspend fun labelPath(
        @Parameter(required = true)
        @PathVariable("values")
        values: List<String>
    ): ResponseEntity<*> {
        try {
            return getDelegate().labelPath(values)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "matrixPath", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The matrix-style path parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [MATRIX_PATH_PATH])
    suspend fun matrixPath(
        @Parameter(required = true)
        @PathVariable("values")
        values: List<String>
    ): ResponseEntity<*> {
        try {
            return getDelegate().matrixPath(values)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "simpleHeader", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The simple-style header parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SIMPLE_HEADER_PATH])
    suspend fun simpleHeader(
        @Parameter(required = false, hidden = true)
        @RequestHeader("X-Tags")
        xTags: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().simpleHeader(xTags)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for formArray.
     */
    class FormArrayResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FormArrayResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for formArrayNoExplode.
     */
    class FormArrayNoExplodeResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FormArrayNoExplodeResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for formObject.
     */
    class FormObjectResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FormObjectResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for spaceDelimited.
     */
    class SpaceDelimitedResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = SpaceDelimitedResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for pipeDelimited.
     */
    class PipeDelimitedResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PipeDelimitedResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for deepObject.
     */
    class DeepObjectResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeepObjectResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for simplePath.
     */
    class SimplePathResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = SimplePathResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for labelPath.
     */
    class LabelPathResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = LabelPathResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for matrixPath.
     */
    class MatrixPathResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MatrixPathResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for simpleHeader.
     */
    class SimpleHeaderResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = SimpleHeaderResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
