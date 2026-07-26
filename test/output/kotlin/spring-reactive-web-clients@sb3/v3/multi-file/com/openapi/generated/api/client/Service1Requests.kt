package com.openapi.generated.api.client

import com.openapi.generated.model.Owner
import com.openapi.generated.model.Pet
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object Service1Requests {
    suspend fun WebClient.getOwner(id: String): Owner {
        return this
            .getOwnerRequest(id)
            .retrieve()
            .awaitBody<Owner>()
    }

    suspend fun <T> WebClient.getOwner(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.getOwnerRequest(id).awaitExchange(responseHandler)
    }

    fun getOwnerUri(id: String): String {
        return UriComponentsBuilder.fromPath("owners/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.getOwnerRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(getOwnerUri(id))
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.listPets(): List<Pet> {
        return this
            .listPetsRequest()
            .retrieve()
            .awaitBody<List<Pet>>()
    }

    suspend fun <T> WebClient.listPets(responseHandler: suspend (ClientResponse) -> T): T {
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

    suspend fun <T> WebClient.createPet(pet: Pet, responseHandler: suspend (ClientResponse) -> T): T {
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
}
