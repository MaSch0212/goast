package com.openapi.generated.api

import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.codec.multipart.FilePart
import org.springframework.http.ResponseEntity
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestPart

@Validated
@RequestMapping("\${api.base-path:/}")
interface PetsApi {
    companion object {
        const val GET_PET_PATH = "/pets/{id}"
        const val UPDATE_PET_PATH = "/pets/{id}"
        const val DELETE_PET_PATH = "/pets/{id}"
        const val CREATE_PET_PATH = "/pets"
        const val UPLOAD_PET_PHOTO_PATH = "/pets/{id}/photo"
        const val ADD_PET_NOTE_PATH = "/pets/{id}/note"
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

    @Operation(operationId = "updatePet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The updated pet.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))])])
    @RequestMapping(method = [RequestMethod.PUT], value = [UPDATE_PET_PATH], consumes = ["application/json", "application/x-www-form-urlencoded"])
    suspend fun updatePet(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = true)
        @Valid
        @RequestBody
        petUpdate: PetUpdate
    ): ResponseEntity<*> {
        try {
            return getDelegate().updatePet(id, petUpdate)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "deletePet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "The pet was deleted.", content = [Content()])])
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

    @Operation(operationId = "createPet", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "201", description = "The pet was created.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))])])
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

    @Operation(operationId = "uploadPetPhoto", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The photo was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [UPLOAD_PET_PHOTO_PATH], consumes = ["multipart/form-data"])
    suspend fun uploadPetPhoto(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(name = "file", required = true)
        @RequestPart(value = "file", required = true)
        file: FilePart,

        @Parameter(name = "caption", required = false)
        @RequestPart(value = "caption", required = false)
        caption: String?
    ): ResponseEntity<*> {
        try {
            return getDelegate().uploadPetPhoto(id, file, caption)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "addPetNote", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The note was added.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Pet::class))])])
    @RequestMapping(method = [RequestMethod.POST], value = [ADD_PET_NOTE_PATH], consumes = ["text/plain"])
    suspend fun addPetNote(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = true)
        @RequestBody
        string: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().addPetNote(id, string)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for getPet.
     */
    class GetPetResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Pet, headers: MultiValueMap<String, String>? = null) = GetPetResponseEntity<Pet>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for updatePet.
     */
    class UpdatePetResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Pet, headers: MultiValueMap<String, String>? = null) = UpdatePetResponseEntity<Pet>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for deletePet.
     */
    class DeletePetResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 501, headers)

            fun noContent(headers: MultiValueMap<String, String>? = null) = DeletePetResponseEntity<Unit>(null, 204, headers)
        }
    }

    /**
     * Response entity for createPet.
     */
    class CreatePetResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Unit>(null, 501, headers)

            fun created(body: Pet, headers: MultiValueMap<String, String>? = null) = CreatePetResponseEntity<Pet>(body, 201, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }

    /**
     * Response entity for uploadPetPhoto.
     */
    class UploadPetPhotoResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = UploadPetPhotoResponseEntity<Unit>(null, 200, headers)
        }
    }

    /**
     * Response entity for addPetNote.
     */
    class AddPetNoteResponseEntity<T : Any> private constructor(
        body: T?,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Unit>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Unit>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Unit>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Unit>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Unit>(null, 501, headers)

            fun ok(body: Pet, headers: MultiValueMap<String, String>? = null) = AddPetNoteResponseEntity<Pet>(body, 200, LinkedMultiValueMap<String, String>().also {
                        if (headers != null) {
                            it.putAll(headers)
                        }
                        it.addIfAbsent("Content-Type", "application/json")
                    })
        }
    }
}
