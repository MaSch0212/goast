package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object NamingRequests {
    suspend fun WebClient.getItems(): Unit {
        this
            .getItemsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.getItems(responseHandler: suspend (ClientResponse) -> T): T {
        return this.getItemsRequest().awaitExchange(responseHandler)
    }

    fun getItemsUri(): String {
        return UriComponentsBuilder.fromPath("items")
            .build()
            .toUriString()
    }

    fun WebClient.getItemsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getItemsUri())
    }

    suspend fun WebClient.postItems(): Unit {
        this
            .postItemsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.postItems(responseHandler: suspend (ClientResponse) -> T): T {
        return this.postItemsRequest().awaitExchange(responseHandler)
    }

    fun postItemsUri(): String {
        return UriComponentsBuilder.fromPath("items")
            .build()
            .toUriString()
    }

    fun WebClient.postItemsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST).uri(postItemsUri())
    }

    suspend fun WebClient.optionsItems(): Unit {
        this
            .optionsItemsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.optionsItems(responseHandler: suspend (ClientResponse) -> T): T {
        return this.optionsItemsRequest().awaitExchange(responseHandler)
    }

    fun optionsItemsUri(): String {
        return UriComponentsBuilder.fromPath("items")
            .build()
            .toUriString()
    }

    fun WebClient.optionsItemsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.OPTIONS).uri(optionsItemsUri())
    }

    suspend fun WebClient.headItems(): Unit {
        this
            .headItemsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.headItems(responseHandler: suspend (ClientResponse) -> T): T {
        return this.headItemsRequest().awaitExchange(responseHandler)
    }

    fun headItemsUri(): String {
        return UriComponentsBuilder.fromPath("items")
            .build()
            .toUriString()
    }

    fun WebClient.headItemsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.HEAD).uri(headItemsUri())
    }

    suspend fun WebClient.getItemsId(id: String): Unit {
        this
            .getItemsIdRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.getItemsId(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.getItemsIdRequest(id).awaitExchange(responseHandler)
    }

    fun getItemsIdUri(id: String): String {
        return UriComponentsBuilder.fromPath("items/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.getItemsIdRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getItemsIdUri(id))
    }

    suspend fun WebClient.putItemsId(id: String): Unit {
        this
            .putItemsIdRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.putItemsId(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.putItemsIdRequest(id).awaitExchange(responseHandler)
    }

    fun putItemsIdUri(id: String): String {
        return UriComponentsBuilder.fromPath("items/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.putItemsIdRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.PUT).uri(putItemsIdUri(id))
    }

    suspend fun WebClient.deleteItemsId(id: String): Unit {
        this
            .deleteItemsIdRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.deleteItemsId(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.deleteItemsIdRequest(id).awaitExchange(responseHandler)
    }

    fun deleteItemsIdUri(id: String): String {
        return UriComponentsBuilder.fromPath("items/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.deleteItemsIdRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.DELETE).uri(deleteItemsIdUri(id))
    }

    suspend fun WebClient.patchItemsId(id: String): Unit {
        this
            .patchItemsIdRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.patchItemsId(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.patchItemsIdRequest(id).awaitExchange(responseHandler)
    }

    fun patchItemsIdUri(id: String): String {
        return UriComponentsBuilder.fromPath("items/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.patchItemsIdRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.PATCH).uri(patchItemsIdUri(id))
    }

    suspend fun WebClient.getItemsIdSubItemsSubId(id: String, subId: String): Unit {
        this
            .getItemsIdSubItemsSubIdRequest(id, subId)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.getItemsIdSubItemsSubId(
        id: String,
        subId: String,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.getItemsIdSubItemsSubIdRequest(id, subId).awaitExchange(responseHandler)
    }

    fun getItemsIdSubItemsSubIdUri(id: String, subId: String): String {
        return UriComponentsBuilder.fromPath("items/{id}/sub-items/{subId}")
            .buildAndExpand(mapOf("id" to id.toString(), "subId" to subId.toString()))
            .toUriString()
    }

    fun WebClient.getItemsIdSubItemsSubIdRequest(id: String, subId: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getItemsIdSubItemsSubIdUri(id, subId))
    }

    suspend fun WebClient.get(): Unit {
        this
            .getRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.get(responseHandler: suspend (ClientResponse) -> T): T {
        return this.getRequest().awaitExchange(responseHandler)
    }

    fun getUri(): String {
        return UriComponentsBuilder.fromPath("")
            .build()
            .toUriString()
    }

    fun WebClient.getRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getUri())
    }

    suspend fun WebClient.getABCDE(): Unit {
        this
            .getAbcdeRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.getABCDE(responseHandler: suspend (ClientResponse) -> T): T {
        return this.getAbcdeRequest().awaitExchange(responseHandler)
    }

    fun getAbcdeUri(): String {
        return UriComponentsBuilder.fromPath("a/b/c/d/e")
            .build()
            .toUriString()
    }

    fun WebClient.getAbcdeRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getAbcdeUri())
    }

    suspend fun WebClient.getWithSummary(): Unit {
        this
            .getWithSummaryRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.getWithSummary(responseHandler: suspend (ClientResponse) -> T): T {
        return this.getWithSummaryRequest().awaitExchange(responseHandler)
    }

    fun getWithSummaryUri(): String {
        return UriComponentsBuilder.fromPath("with-summary")
            .build()
            .toUriString()
    }

    fun WebClient.getWithSummaryRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(getWithSummaryUri())
    }
}
