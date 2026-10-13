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
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import reactor.core.publisher.Flux

@Validated
@RequestMapping("\${api.base-path:/}")
interface Service1Api {
    companion object {
        const val GET_OWNER_PATH = "/owners/{id}"
        const val LIST_PETS_PATH = "/pets"
        const val CREATE_PET_PATH = "/pets"
    }

    fun getDelegate(): Service1ApiDelegate = object : Service1ApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "getOwner", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The requested owner.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Owner::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_OWNER_PATH])
    suspend fun getOwner(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().getOwner(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

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
    @ApiResponses(value = [ApiResponse(responseCode = "201", description = "The created pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))])])
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

    /**
     * Response entity for getOwner.
     */
    class GetOwnerResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Unit?>(null, 501, headers)

            fun ok(body: Owner, headers: MultiValueMap<String, String>? = null) = GetOwnerResponseEntity<Owner>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for listPets.
     */
    class ListPetsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Unit?>(null, 501, headers)

            fun ok(body: Flux<Pet>, headers: MultiValueMap<String, String>? = null) = ListPetsResponseEntity<Flux<Pet>>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for createPet.
     */
    class CreatePetResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit?>(null, 501, headers)

            fun created(body: Pet, headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Pet>(body, 201, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
