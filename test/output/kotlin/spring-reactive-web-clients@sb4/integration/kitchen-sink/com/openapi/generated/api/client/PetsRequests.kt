package com.openapi.generated.api.client

import com.openapi.generated.api.client.infrastructure.ApiRequestFile
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.BodyInserters
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object PetsRequests {
    suspend fun WebClient.getPet(id: String): Pet {
        return this
            .getPetRequest(id)
            .retrieve()
            .awaitBody<Pet>()
    }

    suspend fun <T : Any> WebClient.getPet(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.getPetRequest(id).awaitExchange(responseHandler)
    }

    fun getPetUri(id: String): String {
        return UriComponentsBuilder.fromPath("pets/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.getPetRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(getPetUri(id))
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.updatePet(id: String, petUpdate: PetUpdate): Pet {
        return this
            .updatePetRequest(id, petUpdate)
            .retrieve()
            .awaitBody<Pet>()
    }

    suspend fun <T : Any> WebClient.updatePet(
        id: String,
        petUpdate: PetUpdate,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.updatePetRequest(id, petUpdate).awaitExchange(responseHandler)
    }

    fun updatePetUri(id: String): String {
        return UriComponentsBuilder.fromPath("pets/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.updatePetRequest(id: String, petUpdate: PetUpdate): RequestHeadersSpec<*> {
        return this.method(HttpMethod.PUT)
            .uri(updatePetUri(id))
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(petUpdate)
    }

    suspend fun WebClient.deletePet(id: String): Unit {
        this
            .deletePetRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.deletePet(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.deletePetRequest(id).awaitExchange(responseHandler)
    }

    fun deletePetUri(id: String): String {
        return UriComponentsBuilder.fromPath("pets/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.deletePetRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.DELETE).uri(deletePetUri(id))
    }

    suspend fun WebClient.createPet(pet: Pet): Pet {
        return this
            .createPetRequest(pet)
            .retrieve()
            .awaitBody<Pet>()
    }

    suspend fun <T : Any> WebClient.createPet(pet: Pet, responseHandler: suspend (ClientResponse) -> T): T {
        return this.createPetRequest(pet).awaitExchange(responseHandler)
    }

    fun createPetUri(): String {
        return UriComponentsBuilder.fromPath("pets")
            .build()
            .toUriString()
    }

    fun WebClient.createPetRequest(pet: Pet): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(createPetUri())
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(pet)
    }

    suspend fun WebClient.uploadPetPhoto(
        id: String,
        file: ApiRequestFile,
        caption: String? = null
    ): Unit {
        this
            .uploadPetPhotoRequest(id, file, caption)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.uploadPetPhoto(
        id: String,
        file: ApiRequestFile,
        caption: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.uploadPetPhotoRequest(id, file, caption).awaitExchange(responseHandler)
    }

    fun uploadPetPhotoUri(id: String): String {
        return UriComponentsBuilder.fromPath("pets/{id}/photo")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.uploadPetPhotoRequest(
        id: String,
        file: ApiRequestFile,
        caption: String? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(uploadPetPhotoUri(id))
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            file.addToBuilder(this)
                            caption?.also { caption -> part("caption", caption).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }
}
