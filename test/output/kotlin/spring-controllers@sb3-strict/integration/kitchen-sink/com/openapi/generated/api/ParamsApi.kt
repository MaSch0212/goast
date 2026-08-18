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
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface ParamsApi {
    companion object {
        const val ALL_LOCATIONS_PATH = "/locations/{pathParam}"
        const val STYLE_MATRIX_PATH = "/styles"
        const val PATH_STYLE_SIMPLE_PATH = "/styles/{values}"
        const val GET_ENCODED_PATH = "/encoded/{value}"
    }

    fun getDelegate(): ParamsApiDelegate = object : ParamsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "allLocations", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "All four parameter locations echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [ALL_LOCATIONS_PATH])
    suspend fun allLocations(
        @Parameter(required = true)
        @PathVariable("pathParam")
        pathParam: String,

        @Parameter(required = false)
        @RequestParam(value = "queryParam", required = false)
        queryParam: String?,

        @Parameter(required = false, hidden = true)
        @RequestHeader("X-Header-Param")
        xHeaderParam: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().allLocations(pathParam, queryParam, xHeaderParam)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "styleMatrix", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The style/explode query array parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [STYLE_MATRIX_PATH])
    suspend fun styleMatrix(
        @Parameter(required = false)
        @RequestParam(value = "formExploded", required = false)
        formExploded: List<String>?,

        @Parameter(required = false)
        @RequestParam(value = "formUnexploded", required = false)
        formUnexploded: List<String>?,

        @Parameter(required = false)
        @RequestParam(value = "spaceDelimited", required = false)
        spaceDelimited: List<String>?
    ): ResponseEntity<*> {
        try {
            return getDelegate().styleMatrix(formExploded, formUnexploded, spaceDelimited)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "pathStyleSimple", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The simple-style path array parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [PATH_STYLE_SIMPLE_PATH])
    suspend fun pathStyleSimple(
        @Parameter(required = true)
        @PathVariable("values")
        values: List<String>
    ): ResponseEntity<*> {
        try {
            return getDelegate().pathStyleSimple(values)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "getEncoded", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A path and a query parameter whose values require percent-encoding.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_ENCODED_PATH])
    suspend fun getEncoded(
        @Parameter(required = true)
        @PathVariable("value")
        value: String,

        @Parameter(required = false)
        @RequestParam(value = "raw", required = false)
        raw: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().getEncoded(value, raw)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for allLocations.
     */
    class AllLocationsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = AllLocationsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for styleMatrix.
     */
    class StyleMatrixResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = StyleMatrixResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for pathStyleSimple.
     */
    class PathStyleSimpleResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PathStyleSimpleResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for getEncoded.
     */
    class GetEncodedResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetEncodedResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
