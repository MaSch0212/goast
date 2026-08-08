package com.openapi.generated.api.client

import com.openapi.generated.model.Thing
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object HeadersRequests {
    suspend fun WebClient.singleHeader(): Unit {
        this
            .singleHeaderRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.singleHeader(responseHandler: suspend (ClientResponse) -> T): T {
        return this.singleHeaderRequest().awaitExchange(responseHandler)
    }

    fun singleHeaderUri(): String {
        return UriComponentsBuilder.fromPath("one")
            .build()
            .toUriString()
    }

    fun WebClient.singleHeaderRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(singleHeaderUri())
    }

    suspend fun WebClient.multipleHeaders(): Unit {
        this
            .multipleHeadersRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.multipleHeaders(responseHandler: suspend (ClientResponse) -> T): T {
        return this.multipleHeadersRequest().awaitExchange(responseHandler)
    }

    fun multipleHeadersUri(): String {
        return UriComponentsBuilder.fromPath("many")
            .build()
            .toUriString()
    }

    fun WebClient.multipleHeadersRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(multipleHeadersUri())
    }

    suspend fun WebClient.requiredHeader(): Unit {
        this
            .requiredHeaderRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.requiredHeader(responseHandler: suspend (ClientResponse) -> T): T {
        return this.requiredHeaderRequest().awaitExchange(responseHandler)
    }

    fun requiredHeaderUri(): String {
        return UriComponentsBuilder.fromPath("required")
            .build()
            .toUriString()
    }

    fun WebClient.requiredHeaderRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(requiredHeaderUri())
    }

    suspend fun WebClient.deprecatedHeader(): Unit {
        this
            .deprecatedHeaderRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.deprecatedHeader(responseHandler: suspend (ClientResponse) -> T): T {
        return this.deprecatedHeaderRequest().awaitExchange(responseHandler)
    }

    fun deprecatedHeaderUri(): String {
        return UriComponentsBuilder.fromPath("deprecated")
            .build()
            .toUriString()
    }

    fun WebClient.deprecatedHeaderRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(deprecatedHeaderUri())
    }

    suspend fun WebClient.refHeader(): Unit {
        this
            .refHeaderRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.refHeader(responseHandler: suspend (ClientResponse) -> T): T {
        return this.refHeaderRequest().awaitExchange(responseHandler)
    }

    fun refHeaderUri(): String {
        return UriComponentsBuilder.fromPath("ref")
            .build()
            .toUriString()
    }

    fun WebClient.refHeaderRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(refHeaderUri())
    }

    suspend fun WebClient.headersOnNoContent(): Unit {
        this
            .headersOnNoContentRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.headersOnNoContent(responseHandler: suspend (ClientResponse) -> T): T {
        return this.headersOnNoContentRequest().awaitExchange(responseHandler)
    }

    fun headersOnNoContentUri(): String {
        return UriComponentsBuilder.fromPath("no-content-headers")
            .build()
            .toUriString()
    }

    fun WebClient.headersOnNoContentRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(headersOnNoContentUri())
    }

    suspend fun WebClient.headersAndBody(): Thing {
        return this
            .headersAndBodyRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T : Any> WebClient.headersAndBody(responseHandler: suspend (ClientResponse) -> T): T {
        return this.headersAndBodyRequest().awaitExchange(responseHandler)
    }

    fun headersAndBodyUri(): String {
        return UriComponentsBuilder.fromPath("both")
            .build()
            .toUriString()
    }

    fun WebClient.headersAndBodyRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(headersAndBodyUri())
            .accept(MediaType.APPLICATION_JSON)
    }
}
