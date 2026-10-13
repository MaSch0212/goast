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
interface BetaApi {
    companion object {
        const val TWO_TAGS_PATH = "/two-tags"
    }

    fun getDelegate(): BetaApiDelegate = object : BetaApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

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
}
