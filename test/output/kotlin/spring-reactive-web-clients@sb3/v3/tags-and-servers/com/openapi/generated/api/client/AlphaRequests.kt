package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object AlphaRequests {
    suspend fun WebClient.oneTag(): Unit {
        this
            .oneTagRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.oneTag(responseHandler: suspend (ClientResponse) -> T): T {
        return this.oneTagRequest().awaitExchange(responseHandler)
    }

    fun oneTagUri(): String {
        return UriComponentsBuilder.fromPath("one-tag")
            .build()
            .toUriString()
    }

    fun WebClient.oneTagRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("one-tag")
    }

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
        return this.method(HttpMethod.GET).uri("two-tags")
    }

    suspend fun WebClient.sharedTag(): Unit {
        this
            .sharedTagRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.sharedTag(responseHandler: suspend (ClientResponse) -> T): T {
        return this.sharedTagRequest().awaitExchange(responseHandler)
    }

    fun sharedTagUri(): String {
        return UriComponentsBuilder.fromPath("shared-tag")
            .build()
            .toUriString()
    }

    fun WebClient.sharedTagRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("shared-tag")
    }
}
