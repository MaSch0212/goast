package com.openapi.generated.api.client

import com.openapi.generated.model.Pet
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object PetsRequests {
    suspend fun WebClient.listPets(): List<Pet> {
        return this
            .listPetsRequest()
            .retrieve()
            .awaitBody<List<Pet>>()
    }

    suspend fun <T : Any> WebClient.listPets(responseHandler: suspend (ClientResponse) -> T): T {
        return this.listPetsRequest().awaitExchange(responseHandler)
    }

    fun listPetsUri(): String {
        return UriComponentsBuilder.fromPath("pets")
            .build()
            .toUriString()
    }

    fun WebClient.listPetsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(listPetsUri())
            .accept(MediaType.APPLICATION_JSON)
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

    suspend fun WebClient.searchPets(): Pet {
        return this
            .searchPetsRequest()
            .retrieve()
            .awaitBody<Pet>()
    }

    suspend fun <T : Any> WebClient.searchPets(responseHandler: suspend (ClientResponse) -> T): T {
        return this.searchPetsRequest().awaitExchange(responseHandler)
    }

    fun searchPetsUri(): String {
        return UriComponentsBuilder.fromPath("pets/search")
            .build()
            .toUriString()
    }

    fun WebClient.searchPetsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(searchPetsUri())
            .accept(MediaType.APPLICATION_JSON)
    }
}
