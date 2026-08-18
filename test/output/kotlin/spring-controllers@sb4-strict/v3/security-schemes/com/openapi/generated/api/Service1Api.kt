package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface Service1Api {
    companion object {
        const val INHERITS_SECURITY_PATH = "/inherits-security"
        const val OVERRIDES_SECURITY_PATH = "/overrides-security"
        const val NO_SECURITY_PATH = "/no-security"
        const val MULTI_SECURITY_PATH = "/multi-security"
        const val AND_SECURITY_PATH = "/and-security"
        const val SCOPED_SECURITY_PATH = "/scoped"
    }

    fun getDelegate(): Service1ApiDelegate = object : Service1ApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "inheritsSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation that inherits the document-level security.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [INHERITS_SECURITY_PATH])
    suspend fun inheritsSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().inheritsSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "overridesSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation that overrides the document-level security.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [OVERRIDES_SECURITY_PATH])
    suspend fun overridesSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().overridesSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "noSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation explicitly marked as public.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [NO_SECURITY_PATH])
    suspend fun noSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().noSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multiSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation with two alternative security requirements.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [MULTI_SECURITY_PATH])
    suspend fun multiSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().multiSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "andSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation requiring two schemes together.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [AND_SECURITY_PATH])
    suspend fun andSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().andSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "scopedSecurity", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation requiring an OAuth2 scheme with both scopes.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SCOPED_SECURITY_PATH])
    suspend fun scopedSecurity(): ResponseEntity<*> {
        try {
            return getDelegate().scopedSecurity()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for inheritsSecurity.
     */
    class InheritsSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = InheritsSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for overridesSecurity.
     */
    class OverridesSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OverridesSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for noSecurity.
     */
    class NoSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = NoSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for multiSecurity.
     */
    class MultiSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MultiSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for andSecurity.
     */
    class AndSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = AndSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for scopedSecurity.
     */
    class ScopedSecurityResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = ScopedSecurityResponseEntity<Unit>(null, 200, headers)
        }
    }
}
