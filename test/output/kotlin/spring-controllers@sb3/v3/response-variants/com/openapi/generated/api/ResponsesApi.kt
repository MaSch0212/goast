package com.openapi.generated.api

import com.openapi.generated.model.Error
import com.openapi.generated.model.OtherThing
import com.openapi.generated.model.Thing
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface ResponsesApi {
    companion object {
        const val TWO_SUCCESS_CODES_PATH = "/two-success"
        const val SUCCESS_AND_DEFAULT_PATH = "/default"
        const val ONLY_DEFAULT_PATH = "/only-default"
        const val NO_CONTENT_PATH = "/no-content"
        const val EMPTY_BODY_200_PATH = "/empty-200"
        const val RANGE_CODES_PATH = "/ranges"
        const val MIXED_EXACT_AND_RANGE_PATH = "/mixed-codes"
        const val ERROR_CODES_PATH = "/errors"
        const val MULTI_CONTENT_RESPONSE_PATH = "/multi-content"
        const val PRIMITIVE_RESPONSE_PATH = "/primitive"
        const val ARRAY_RESPONSE_PATH = "/array"
        const val REF_RESPONSE_PATH = "/ref-response"
    }

    fun getDelegate(): ResponsesApiDelegate = object : ResponsesApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "twoSuccessCodes", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing already existed.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]), ApiResponse(responseCode = "201", description = "The thing was created.", content = [Content(mediaType = "application/json", schema = Schema(implementation = OtherThing::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [TWO_SUCCESS_CODES_PATH])
    suspend fun twoSuccessCodes(): ResponseEntity<*> {
        try {
            return getDelegate().twoSuccessCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "successAndDefault", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]), ApiResponse(responseCode = "default", description = "An unexpected error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [SUCCESS_AND_DEFAULT_PATH])
    suspend fun successAndDefault(): ResponseEntity<*> {
        try {
            return getDelegate().successAndDefault()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "onlyDefault", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "default", description = "Whatever happens, this is the response.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [ONLY_DEFAULT_PATH])
    suspend fun onlyDefault(): ResponseEntity<*> {
        try {
            return getDelegate().onlyDefault()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "noContent", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "There is nothing to return.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [NO_CONTENT_PATH])
    suspend fun noContent(): ResponseEntity<*> {
        try {
            return getDelegate().noContent()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "emptyBody200", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The request succeeded, with no response body.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [EMPTY_BODY_200_PATH])
    suspend fun emptyBody200(): ResponseEntity<*> {
        try {
            return getDelegate().emptyBody200()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "rangeCodes", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "2XX", description = "Any success.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "4XX", description = "Any client error.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "5XX", description = "Any server error.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [RANGE_CODES_PATH])
    suspend fun rangeCodes(): ResponseEntity<*> {
        try {
            return getDelegate().rangeCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "mixedExactAndRange", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "2XX", description = "Some other success.", content = [Content(mediaType = "application/json", schema = Schema(implementation = OtherThing::class))]),
            ApiResponse(responseCode = "default", description = "An unexpected error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [MIXED_EXACT_AND_RANGE_PATH])
    suspend fun mixedExactAndRange(): ResponseEntity<*> {
        try {
            return getDelegate().mixedExactAndRange()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "errorCodes", deprecated = false)
    @ApiResponses(value = [
            ApiResponse(responseCode = "200", description = "The thing was found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))]),
            ApiResponse(responseCode = "400", description = "The request was invalid.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "401", description = "Authentication is required.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "404", description = "The thing was not found.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))]),
            ApiResponse(responseCode = "500", description = "An internal error occurred.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Error::class))])
        ])
    @RequestMapping(method = [RequestMethod.GET], value = [ERROR_CODES_PATH])
    suspend fun errorCodes(): ResponseEntity<*> {
        try {
            return getDelegate().errorCodes()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multiContentResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The thing, as JSON or as plain text.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class)), Content(mediaType = "text/plain", schema = Schema(implementation = String::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [MULTI_CONTENT_RESPONSE_PATH])
    suspend fun multiContentResponse(): ResponseEntity<*> {
        try {
            return getDelegate().multiContentResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "primitiveResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A plain string.", content = [Content(mediaType = "application/json", schema = Schema(implementation = String::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [PRIMITIVE_RESPONSE_PATH])
    suspend fun primitiveResponse(): ResponseEntity<*> {
        try {
            return getDelegate().primitiveResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "arrayResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An array of things.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Thing::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [ARRAY_RESPONSE_PATH])
    suspend fun arrayResponse(): ResponseEntity<*> {
        try {
            return getDelegate().arrayResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refResponse", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A response shared through components.responses.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Thing::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [REF_RESPONSE_PATH])
    suspend fun refResponse(): ResponseEntity<*> {
        try {
            return getDelegate().refResponse()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
