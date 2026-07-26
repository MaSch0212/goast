package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
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
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface InheritanceApi {
    companion object {
        const val INHERITS_PARAMS_PATH = "/inherited/{id}"
        const val INHERITS_AND_ADDS_PATH = "/inherited/{id}"
        const val OVERRIDES_PARAM_PATH = "/overridden/{id}"
        const val REF_PARAM_PATH = "/ref-param/{id}"
    }

    fun getDelegate(): InheritanceApiDelegate = object : InheritanceApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "inheritsParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The inherited path and query parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [INHERITS_PARAMS_PATH])
    suspend fun inheritsParams(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = false)
        @RequestParam(value = "common", required = false)
        common: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().inheritsParams(id, common)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "inheritsAndAdds", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The inherited parameters plus this operation's own one echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [INHERITS_AND_ADDS_PATH])
    suspend fun inheritsAndAdds(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = false)
        @RequestParam(value = "common", required = false)
        common: String?,

        @Parameter(required = false)
        @RequestParam(value = "extra", required = false)
        extra: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().inheritsAndAdds(id, common, extra)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "overridesParam", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The operation-level override of the inherited parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [OVERRIDES_PARAM_PATH])
    suspend fun overridesParam(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(description = "Overrides the inherited parameter with a different type.", required = false)
        @RequestParam(value = "common", required = false)
        common: Int?
    ): ResponseEntity<*> {
        try {
            return getDelegate().overridesParam(id, common)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refParam", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The two \$ref'd parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [REF_PARAM_PATH])
    suspend fun refParam(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = false, schema = Schema(defaultValue = "1"))
        @RequestParam(value = "page", required = false, defaultValue = "1")
        page: Int
    ): ResponseEntity<*> {
        try {
            return getDelegate().refParam(id, page)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for inheritsParams.
     */
    class InheritsParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = InheritsParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for inheritsAndAdds.
     */
    class InheritsAndAddsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = InheritsAndAddsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for overridesParam.
     */
    class OverridesParamResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OverridesParamResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for refParam.
     */
    class RefParamResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = RefParamResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
