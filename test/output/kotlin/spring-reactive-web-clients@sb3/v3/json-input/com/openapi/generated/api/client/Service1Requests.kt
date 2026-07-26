package com.openapi.generated.api.client

import com.openapi.generated.model.Thing
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object Service1Requests {
    suspend fun WebClient.listThings(): List<Thing> {
        return this
            .listThingsRequest()
            .retrieve()
            .awaitBody<List<Thing>>()
    }

    suspend fun <T> WebClient.listThings(responseHandler: suspend (ClientResponse) -> T): T {
        return this.listThingsRequest().awaitExchange(responseHandler)
    }

    fun listThingsUri(): String {
        return UriComponentsBuilder.fromPath("things")
            .build()
            .toUriString()
    }

    fun WebClient.listThingsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(listThingsUri())
            .accept(MediaType.APPLICATION_JSON)
    }
}
