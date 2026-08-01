package com.openapi.generated.api

import com.openapi.generated.model.Pet
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface PetsApi {
    companion object {
        const val GET_PET_PATH = "/pets/{id}"
    }

    fun getDelegate(): PetsApiDelegate = object : PetsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "getPet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_PET_PATH])
    suspend fun getPet(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().getPet(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
