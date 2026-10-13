package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface DeprecationApi {
    companion object {
        const val DEPRECATED_OP_PATH = "/deprecated-op"
        const val DEPRECATED_OP_NO_DESC_PATH = "/deprecated-op-no-desc"
        const val DEPRECATED_PARAMS_PATH = "/deprecated-params"
    }

    fun getDelegate(): DeprecationApiDelegate = object : DeprecationApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    /**
     * This operation is deprecated.
     */
    @Operation(operationId = "deprecatedOp", description = "This operation is deprecated.", deprecated = true)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "OK.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DEPRECATED_OP_PATH])
    suspend fun deprecatedOp(): ResponseEntity<*> {
        try {
            return getDelegate().deprecatedOp()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "deprecatedOpNoDesc", deprecated = true)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "OK.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DEPRECATED_OP_NO_DESC_PATH])
    suspend fun deprecatedOpNoDesc(): ResponseEntity<*> {
        try {
            return getDelegate().deprecatedOpNoDesc()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "deprecatedParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "OK.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DEPRECATED_PARAMS_PATH])
    suspend fun deprecatedParams(
        @Parameter(description = "This parameter is deprecated.", required = false, deprecated = true)
        @RequestParam(value = "withDesc", required = false)
        withDesc: String?,

        @Parameter(required = false, deprecated = true)
        @RequestParam(value = "noDesc", required = false)
        noDesc: String?,

        @Parameter(required = false)
        @RequestParam(value = "plain", required = false)
        plain: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().deprecatedParams(withDesc, noDesc, plain)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for deprecatedOp.
     */
    class DeprecatedOpResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeprecatedOpResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for deprecatedOpNoDesc.
     */
    class DeprecatedOpNoDescResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeprecatedOpNoDescResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for deprecatedParams.
     */
    class DeprecatedParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeprecatedParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
