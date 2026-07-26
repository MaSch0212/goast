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
interface ParametersApi {
    companion object {
        const val BODY_PARAM_PATH = "/body"
        const val FORM_DATA_PARAMS_PATH = "/form"
        const val FILE_UPLOAD_PATH = "/upload"
        const val QUERY_PARAMS_PATH = "/query"
    }

    fun getDelegate(): ParametersApiDelegate = object : ParametersApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "bodyParam", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The body parameter echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [BODY_PARAM_PATH])
    suspend fun bodyParam(): ResponseEntity<*> {
        try {
            return getDelegate().bodyParam()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "formDataParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The three form-data parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [FORM_DATA_PARAMS_PATH])
    suspend fun formDataParams(): ResponseEntity<*> {
        try {
            return getDelegate().formDataParams()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "fileUpload", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The uploaded file and its description echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [FILE_UPLOAD_PATH])
    suspend fun fileUpload(): ResponseEntity<*> {
        try {
            return getDelegate().fileUpload()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "queryParams", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The two array-valued query parameters echoed back.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [QUERY_PARAMS_PATH])
    suspend fun queryParams(
        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: Any?,

        @Parameter(required = false)
        @RequestParam(value = "ids", required = false)
        ids: Any?
    ): ResponseEntity<*> {
        try {
            return getDelegate().queryParams(tags, ids)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for bodyParam.
     */
    class BodyParamResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = BodyParamResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for formDataParams.
     */
    class FormDataParamsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FormDataParamsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for fileUpload.
     */
    class FileUploadResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FileUploadResponseEntity<Unit?>(null, 200, headers)
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
}
