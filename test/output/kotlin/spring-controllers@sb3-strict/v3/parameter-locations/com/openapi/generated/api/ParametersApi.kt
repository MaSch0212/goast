package com.openapi.generated.api

import com.openapi.generated.model.ParamSchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.HttpStatus
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
interface ParametersApi {
    companion object {
        const val TWO_PATH_PARAMS_PATH = "/path/{id}/{sub}"
        const val QUERY_PARAMS_PATH = "/query"
        const val HEADER_PARAMS_PATH = "/header"
        const val COOKIE_PARAMS_PATH = "/cookie"
        const val MIXED_PARAMS_PATH = "/mixed/{id}"
        const val DESCRIBED_PARAMS_PATH = "/described"
        const val ALLOW_EMPTY_VALUE_PARAM_PATH = "/empty-value"
        const val RESERVED_CHAR_PARAM_PATH = "/reserved"
    }

    fun getDelegate(): ParametersApiDelegate = object : ParametersApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "twoPathParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "Both path parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [TWO_PATH_PARAMS_PATH])
    suspend fun twoPathParams(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = true)
        @PathVariable("sub")
        sub: Int
    ): ResponseEntity<*> {
        try {
            return getDelegate().twoPathParams(id, sub)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "queryParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The four query parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [QUERY_PARAMS_PATH])
    suspend fun queryParams(
        @Parameter(required = true)
        @RequestParam(value = "requiredString", required = true)
        requiredString: String,

        @Parameter(required = false)
        @RequestParam(value = "optionalString", required = false)
        optionalString: String?,

        @Parameter(required = false, schema = Schema(defaultValue = "10"))
        @RequestParam(value = "intWithDefault", required = false, defaultValue = "10")
        intWithDefault: Int,

        @Parameter(required = false)
        @RequestParam(value = "flag", required = false)
        flag: Boolean?
    ): ResponseEntity<*> {
        try {
            return getDelegate().queryParams(
                requiredString,
                optionalString,
                intWithDefault,
                flag
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "headerParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The two header parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [HEADER_PARAMS_PATH])
    suspend fun headerParams(
        @Parameter(required = true, hidden = true)
        @RequestHeader("X-Request-Id")
        xRequestId: String,

        @Parameter(required = false, hidden = true)
        @RequestHeader("X-Optional-Header")
        xOptionalHeader: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().headerParams(xRequestId, xOptionalHeader)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "cookieParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The cookie parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [COOKIE_PARAMS_PATH])
    suspend fun cookieParams(): ResponseEntity<*> {
        try {
            return getDelegate().cookieParams()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "mixedParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "One parameter from each of the four locations echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [MIXED_PARAMS_PATH])
    suspend fun mixedParams(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = false)
        @RequestParam(value = "filter", required = false)
        filter: String?,

        @Parameter(required = false, hidden = true)
        @RequestHeader("X-Trace-Id")
        xTraceId: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().mixedParams(id, filter, xTraceId)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "describedParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The four described query parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [DESCRIBED_PARAMS_PATH])
    suspend fun describedParams(
        @Parameter(description = "A parameter with a description.", required = false)
        @RequestParam(value = "withDescription", required = false)
        withDescription: String?,

        @Parameter(required = false)
        @RequestParam(value = "withoutDescription", required = false)
        withoutDescription: String?,

        @Parameter(required = false)
        @RequestParam(value = "withExample", required = false)
        withExample: String?,

        @Parameter(required = false, schema = Schema(allowableValues = [
                    "one",
                    "two",
                    "three"
                ]))
        @RequestParam(value = "withRefSchema", required = false)
        withRefSchema: String?
    ): ResponseEntity<*> {
        val withRefSchema = withRefSchema?.let { ParamSchema.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter withRefSchema") }
        try {
            return getDelegate().describedParams(
                withDescription,
                withoutDescription,
                withExample,
                withRefSchema
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "allowEmptyValueParam", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The empty-allowed query parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [ALLOW_EMPTY_VALUE_PARAM_PATH])
    suspend fun allowEmptyValueParam(
        @Parameter(required = false)
        @RequestParam(value = "search", required = false)
        search: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().allowEmptyValueParam(search)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "reservedCharParam", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The reserved-character query parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [RESERVED_CHAR_PARAM_PATH])
    suspend fun reservedCharParam(
        @Parameter(required = false)
        @RequestParam(value = "filter", required = false)
        filter: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().reservedCharParam(filter)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for twoPathParams.
     */
    class TwoPathParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = TwoPathParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for queryParams.
     */
    class QueryParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = QueryParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for headerParams.
     */
    class HeaderParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = HeaderParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for cookieParams.
     */
    class CookieParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = CookieParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for mixedParams.
     */
    class MixedParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MixedParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for describedParams.
     */
    class DescribedParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DescribedParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for allowEmptyValueParam.
     */
    class AllowEmptyValueParamResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = AllowEmptyValueParamResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for reservedCharParam.
     */
    class ReservedCharParamResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = ReservedCharParamResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
