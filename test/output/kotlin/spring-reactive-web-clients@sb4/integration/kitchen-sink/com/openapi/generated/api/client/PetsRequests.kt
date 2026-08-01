package com.openapi.generated.api.client

import com.openapi.generated.model.Pet
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
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
}
