package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object TagWithSpaceRequests {
    suspend fun WebClient.tagWithSpace(): Unit {
        this
            .tagWithSpaceRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.tagWithSpace(responseHandler: suspend (ClientResponse) -> T): T {
        return this.tagWithSpaceRequest().awaitExchange(responseHandler)
    }

    fun tagWithSpaceUri(): String {
        return UriComponentsBuilder.fromPath("tag-with-space")
            .build()
            .toUriString()
    }

    fun WebClient.tagWithSpaceRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(tagWithSpaceUri())
    }
}
