package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface PathsApi {
    companion object {
        const val OVERLAP_TEMPLATED_PATH = "/overlap/{id}"
        const val OVERLAP_LITERAL_PATH = "/overlap/fixed"
        const val WITH_DOT_PATH = "/with.dot"
        const val WITH_DASH_PATH = "/with-dash"
        const val WITH_UNDERSCORE_PATH = "/with_underscore"
        const val WITH_TILDE_PATH = "/with~tilde"
        const val WITH_COLON_PATH = "/with:colon"
        const val WITH_AT_PATH = "/with@at"
        const val TRAILING_SLASH_PATH = "/trailing/"
        const val PARAM_ONLY_PATH_PATH = "/{id}"
        const val THREE_PARAMS_PATH = "/a/{p1}/b/{p2}/c/{p3}"
        const val CASE_VARIETY_PATH = "/UPPER/Mixed/lower"
        const val VERY_DEEP_PATH_PATH = "/very/deep/nested/path/with/many/segments/here"
    }

    fun getDelegate(): PathsApiDelegate = object : PathsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "overlapTemplated", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A templated overlap segment.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [OVERLAP_TEMPLATED_PATH])
    suspend fun overlapTemplated(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().overlapTemplated(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "overlapLiteral", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A literal overlap segment.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [OVERLAP_LITERAL_PATH])
    suspend fun overlapLiteral(): ResponseEntity<*> {
        try {
            return getDelegate().overlapLiteral()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withDot", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing a dot.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_DOT_PATH])
    suspend fun withDot(): ResponseEntity<*> {
        try {
            return getDelegate().withDot()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withDash", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing a dash.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_DASH_PATH])
    suspend fun withDash(): ResponseEntity<*> {
        try {
            return getDelegate().withDash()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withUnderscore", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing an underscore.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_UNDERSCORE_PATH])
    suspend fun withUnderscore(): ResponseEntity<*> {
        try {
            return getDelegate().withUnderscore()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withTilde", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing a tilde.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_TILDE_PATH])
    suspend fun withTilde(): ResponseEntity<*> {
        try {
            return getDelegate().withTilde()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withColon", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing a colon.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_COLON_PATH])
    suspend fun withColon(): ResponseEntity<*> {
        try {
            return getDelegate().withColon()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withAt", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path segment containing an at sign.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [WITH_AT_PATH])
    suspend fun withAt(): ResponseEntity<*> {
        try {
            return getDelegate().withAt()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "trailingSlash", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path with a trailing slash.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [TRAILING_SLASH_PATH])
    suspend fun trailingSlash(): ResponseEntity<*> {
        try {
            return getDelegate().trailingSlash()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "paramOnlyPath", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path that is a parameter in its entirety.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [PARAM_ONLY_PATH_PATH])
    suspend fun paramOnlyPath(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().paramOnlyPath(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "threeParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "Three parameters interleaved with literals.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [THREE_PARAMS_PATH])
    suspend fun threeParams(
        @Parameter(required = true)
        @PathVariable("p1")
        p1: String,

        @Parameter(required = true)
        @PathVariable("p2")
        p2: String,

        @Parameter(required = true)
        @PathVariable("p3")
        p3: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().threeParams(p1, p2, p3)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "caseVariety", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path with casing variety in its segments.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [CASE_VARIETY_PATH])
    suspend fun caseVariety(): ResponseEntity<*> {
        try {
            return getDelegate().caseVariety()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "veryDeepPath", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A very deep path.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [VERY_DEEP_PATH_PATH])
    suspend fun veryDeepPath(): ResponseEntity<*> {
        try {
            return getDelegate().veryDeepPath()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for overlapTemplated.
     */
    class OverlapTemplatedResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OverlapTemplatedResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for overlapLiteral.
     */
    class OverlapLiteralResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OverlapLiteralResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withDot.
     */
    class WithDotResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithDotResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withDash.
     */
    class WithDashResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithDashResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withUnderscore.
     */
    class WithUnderscoreResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithUnderscoreResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withTilde.
     */
    class WithTildeResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithTildeResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withColon.
     */
    class WithColonResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithColonResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withAt.
     */
    class WithAtResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithAtResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for trailingSlash.
     */
    class TrailingSlashResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = TrailingSlashResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for paramOnlyPath.
     */
    class ParamOnlyPathResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = ParamOnlyPathResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for threeParams.
     */
    class ThreeParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = ThreeParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for caseVariety.
     */
    class CaseVarietyResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = CaseVarietyResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for veryDeepPath.
     */
    class VeryDeepPathResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = VeryDeepPathResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
