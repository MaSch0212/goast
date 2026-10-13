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
@RequestMapping("\${api.base-path:https://api.example.com/v1}")
interface TagWithSpaceApi {
    companion object {
        const val TAG_WITH_SPACE_PATH = "/tag-with-space"
    }

    fun getDelegate(): TagWithSpaceApiDelegate = object : TagWithSpaceApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "tagWithSpace", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation tagged with a name containing a space.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [TAG_WITH_SPACE_PATH])
    suspend fun tagWithSpace(): ResponseEntity<*> {
        try {
            return getDelegate().tagWithSpace()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for tagWithSpace.
     */
    class TagWithSpaceResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = TagWithSpaceResponseEntity<Unit>(null, 200, headers)
        }
    }
}
