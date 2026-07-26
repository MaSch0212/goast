package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object BetaRequests {
    suspend fun WebClient.twoTags(): Unit {
        this
            .twoTagsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.twoTags(responseHandler: suspend (ClientResponse) -> T): T {
        return this.twoTagsRequest().awaitExchange(responseHandler)
    }

    fun twoTagsUri(): String {
        return UriComponentsBuilder.fromPath("two-tags")
            .build()
            .toUriString()
    }

    fun WebClient.twoTagsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(twoTagsUri())
    }
}
