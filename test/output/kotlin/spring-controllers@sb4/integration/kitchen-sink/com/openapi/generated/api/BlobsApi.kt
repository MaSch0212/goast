package com.openapi.generated.api

import com.openapi.generated.model.BlobRef
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface BlobsApi {
    companion object {
        const val UPLOAD_BLOB_PATH = "/blobs"
    }

    fun getDelegate(): BlobsApiDelegate = object : BlobsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "uploadBlob", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "201", description = "The blob was stored.", content = [Content(mediaType = "application/json", schema = Schema(implementation = BlobRef::class))])])
    @RequestMapping(method = [RequestMethod.POST], value = [UPLOAD_BLOB_PATH], consumes = ["application/octet-stream"])
    suspend fun uploadBlob(
        @Parameter(required = true)
        @RequestBody
        string: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().uploadBlob(string)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
