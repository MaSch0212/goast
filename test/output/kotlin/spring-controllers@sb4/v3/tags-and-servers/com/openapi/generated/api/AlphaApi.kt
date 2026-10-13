package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:https://api.example.com/v1}")
interface AlphaApi {
    companion object {
        const val ONE_TAG_PATH = "/one-tag"
        const val TWO_TAGS_PATH = "/two-tags"
        const val SHARED_TAG_PATH = "/shared-tag"
    }

    fun getDelegate(): AlphaApiDelegate = object : AlphaApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "oneTag", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation with one tag.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [ONE_TAG_PATH])
    suspend fun oneTag(): ResponseEntity<*> {
        try {
            return getDelegate().oneTag()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "twoTags", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation with two tags.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [TWO_TAGS_PATH])
    suspend fun twoTags(): ResponseEntity<*> {
        try {
            return getDelegate().twoTags()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "sharedTag", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "An operation sharing a tag with another.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [SHARED_TAG_PATH])
    suspend fun sharedTag(): ResponseEntity<*> {
        try {
            return getDelegate().sharedTag()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
