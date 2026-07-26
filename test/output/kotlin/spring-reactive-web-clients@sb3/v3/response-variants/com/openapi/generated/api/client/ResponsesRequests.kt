package com.openapi.generated.api.client

import com.openapi.generated.model.Error
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

object ResponsesRequests {
    suspend fun WebClient.twoSuccessCodes(): Thing {
        return this
            .twoSuccessCodesRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.twoSuccessCodes(responseHandler: suspend (ClientResponse) -> T): T {
        return this.twoSuccessCodesRequest().awaitExchange(responseHandler)
    }

    fun twoSuccessCodesUri(): String {
        return UriComponentsBuilder.fromPath("two-success")
            .build()
            .toUriString()
    }

    fun WebClient.twoSuccessCodesRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(twoSuccessCodesUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.successAndDefault(): Thing {
        return this
            .successAndDefaultRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.successAndDefault(responseHandler: suspend (ClientResponse) -> T): T {
        return this.successAndDefaultRequest().awaitExchange(responseHandler)
    }

    fun successAndDefaultUri(): String {
        return UriComponentsBuilder.fromPath("default")
            .build()
            .toUriString()
    }

    fun WebClient.successAndDefaultRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(successAndDefaultUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.onlyDefault(): Error {
        return this
            .onlyDefaultRequest()
            .retrieve()
            .awaitBody<Error>()
    }

    suspend fun <T> WebClient.onlyDefault(responseHandler: suspend (ClientResponse) -> T): T {
        return this.onlyDefaultRequest().awaitExchange(responseHandler)
    }

    fun onlyDefaultUri(): String {
        return UriComponentsBuilder.fromPath("only-default")
            .build()
            .toUriString()
    }

    fun WebClient.onlyDefaultRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(onlyDefaultUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.noContent(): Unit {
        this
            .noContentRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.noContent(responseHandler: suspend (ClientResponse) -> T): T {
        return this.noContentRequest().awaitExchange(responseHandler)
    }

    fun noContentUri(): String {
        return UriComponentsBuilder.fromPath("no-content")
            .build()
            .toUriString()
    }

    fun WebClient.noContentRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(noContentUri())
    }

    suspend fun WebClient.emptyBody200(): Unit {
        this
            .emptyBody200Request()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.emptyBody200(responseHandler: suspend (ClientResponse) -> T): T {
        return this.emptyBody200Request().awaitExchange(responseHandler)
    }

    fun emptyBody200Uri(): String {
        return UriComponentsBuilder.fromPath("empty-200")
            .build()
            .toUriString()
    }

    fun WebClient.emptyBody200Request(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(emptyBody200Uri())
    }

    suspend fun WebClient.rangeCodes(): Thing {
        return this
            .rangeCodesRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.rangeCodes(responseHandler: suspend (ClientResponse) -> T): T {
        return this.rangeCodesRequest().awaitExchange(responseHandler)
    }

    fun rangeCodesUri(): String {
        return UriComponentsBuilder.fromPath("ranges")
            .build()
            .toUriString()
    }

    fun WebClient.rangeCodesRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(rangeCodesUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.mixedExactAndRange(): Thing {
        return this
            .mixedExactAndRangeRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.mixedExactAndRange(responseHandler: suspend (ClientResponse) -> T): T {
        return this.mixedExactAndRangeRequest().awaitExchange(responseHandler)
    }

    fun mixedExactAndRangeUri(): String {
        return UriComponentsBuilder.fromPath("mixed-codes")
            .build()
            .toUriString()
    }

    fun WebClient.mixedExactAndRangeRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(mixedExactAndRangeUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.errorCodes(): Thing {
        return this
            .errorCodesRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.errorCodes(responseHandler: suspend (ClientResponse) -> T): T {
        return this.errorCodesRequest().awaitExchange(responseHandler)
    }

    fun errorCodesUri(): String {
        return UriComponentsBuilder.fromPath("errors")
            .build()
            .toUriString()
    }

    fun WebClient.errorCodesRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(errorCodesUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.multiContentResponse(): Thing {
        return this
            .multiContentResponseRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.multiContentResponse(responseHandler: suspend (ClientResponse) -> T): T {
        return this.multiContentResponseRequest().awaitExchange(responseHandler)
    }

    fun multiContentResponseUri(): String {
        return UriComponentsBuilder.fromPath("multi-content")
            .build()
            .toUriString()
    }

    fun WebClient.multiContentResponseRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(multiContentResponseUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.primitiveResponse(): String {
        return this
            .primitiveResponseRequest()
            .retrieve()
            .awaitBody<String>()
    }

    suspend fun <T> WebClient.primitiveResponse(responseHandler: suspend (ClientResponse) -> T): T {
        return this.primitiveResponseRequest().awaitExchange(responseHandler)
    }

    fun primitiveResponseUri(): String {
        return UriComponentsBuilder.fromPath("primitive")
            .build()
            .toUriString()
    }

    fun WebClient.primitiveResponseRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(primitiveResponseUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.arrayResponse(): List<Thing> {
        return this
            .arrayResponseRequest()
            .retrieve()
            .awaitBody<List<Thing>>()
    }

    suspend fun <T> WebClient.arrayResponse(responseHandler: suspend (ClientResponse) -> T): T {
        return this.arrayResponseRequest().awaitExchange(responseHandler)
    }

    fun arrayResponseUri(): String {
        return UriComponentsBuilder.fromPath("array")
            .build()
            .toUriString()
    }

    fun WebClient.arrayResponseRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(arrayResponseUri())
            .accept(MediaType.APPLICATION_JSON)
    }

    suspend fun WebClient.refResponse(): Thing {
        return this
            .refResponseRequest()
            .retrieve()
            .awaitBody<Thing>()
    }

    suspend fun <T> WebClient.refResponse(responseHandler: suspend (ClientResponse) -> T): T {
        return this.refResponseRequest().awaitExchange(responseHandler)
    }

    fun refResponseUri(): String {
        return UriComponentsBuilder.fromPath("ref-response")
            .build()
            .toUriString()
    }

    fun WebClient.refResponseRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(refResponseUri())
            .accept(MediaType.APPLICATION_JSON)
    }
}
