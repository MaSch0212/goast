package com.openapi.generated.api

import com.openapi.generated.model.Owner
import com.openapi.generated.model.Pet
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface PetsApi {
    companion object {
        const val LIST_PETS_PATH = "/pets"
        const val CREATE_PET_PATH = "/pets"
        const val GET_PET_PATH = "/pets/{id}"
        const val DELETE_PET_PATH = "/pets/{id}"
        const val SEARCH_PETS_PATH = "/pets/search"
    }

    fun getDelegate(): PetsApiDelegate = object : PetsApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "listPets", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A list of pets.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Pet::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [LIST_PETS_PATH])
    suspend fun listPets(): ResponseEntity<*> {
        try {
            return getDelegate().listPets()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "createPet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "201", description = "The created pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))]), ApiResponse(responseCode = "400", description = "Invalid input.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [CREATE_PET_PATH], consumes = ["application/json"])
    suspend fun createPet(
        @Parameter(required = true)
        @Valid
        @RequestBody
        pet: Pet
    ): ResponseEntity<*> {
        try {
            return getDelegate().createPet(pet)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "getPet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The requested pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))]), ApiResponse(responseCode = "404", description = "Pet not found.", content = [Content()])])
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

    @Operation(operationId = "deletePet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "Pet deleted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.DELETE], value = [DELETE_PET_PATH])
    suspend fun deletePet(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().deletePet(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "searchPets", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))]), ApiResponse(responseCode = "202", description = "An owner.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Owner::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [SEARCH_PETS_PATH])
    suspend fun searchPets(): ResponseEntity<*> {
        try {
            return getDelegate().searchPets()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
