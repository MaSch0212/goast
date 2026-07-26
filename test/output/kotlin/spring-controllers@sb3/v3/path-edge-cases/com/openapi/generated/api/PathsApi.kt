package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
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
}
