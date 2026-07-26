package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object Service2Requests {
    suspend fun WebClient.untagged(): Unit {
        this
            .untaggedRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.untagged(responseHandler: suspend (ClientResponse) -> T): T {
        return this.untaggedRequest().awaitExchange(responseHandler)
    }

    fun untaggedUri(): String {
        return UriComponentsBuilder.fromPath("untagged")
            .build()
            .toUriString()
    }

    fun WebClient.untaggedRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(untaggedUri())
    }

    suspend fun WebClient.pathServer(): Unit {
        this
            .pathServerRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.pathServer(responseHandler: suspend (ClientResponse) -> T): T {
        return this.pathServerRequest().awaitExchange(responseHandler)
    }

    fun pathServerUri(): String {
        return UriComponentsBuilder.fromPath("path-server")
            .build()
            .toUriString()
    }

    fun WebClient.pathServerRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(pathServerUri())
    }

    suspend fun WebClient.opServer(): Unit {
        this
            .opServerRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.opServer(responseHandler: suspend (ClientResponse) -> T): T {
        return this.opServerRequest().awaitExchange(responseHandler)
    }

    fun opServerUri(): String {
        return UriComponentsBuilder.fromPath("op-server")
            .build()
            .toUriString()
    }

    fun WebClient.opServerRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(opServerUri())
    }
}
