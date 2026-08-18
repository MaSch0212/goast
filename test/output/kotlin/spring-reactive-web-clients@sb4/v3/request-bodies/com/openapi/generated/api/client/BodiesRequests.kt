package com.openapi.generated.api.client

import com.openapi.generated.model.FormBodyRequest
import com.openapi.generated.model.InlineJsonBodyRequest
import com.openapi.generated.model.Payload
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object BodiesRequests {
    suspend fun WebClient.jsonBody(payload: Payload): Unit {
        this
            .jsonBodyRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.jsonBody(payload: Payload, responseHandler: suspend (ClientResponse) -> T): T {
        return this.jsonBodyRequest(payload).awaitExchange(responseHandler)
    }

    fun jsonBodyUri(): String {
        return UriComponentsBuilder.fromPath("json")
            .build()
            .toUriString()
    }

    fun WebClient.jsonBodyRequest(payload: Payload): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("json")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(payload)
    }

    suspend fun WebClient.optionalJsonBody(payload: Payload? = null): Unit {
        this
            .optionalJsonBodyRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.optionalJsonBody(payload: Payload? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.optionalJsonBodyRequest(payload).awaitExchange(responseHandler)
    }

    fun optionalJsonBodyUri(): String {
        return UriComponentsBuilder.fromPath("json-optional")
            .build()
            .toUriString()
    }

    fun WebClient.optionalJsonBodyRequest(payload: Payload? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("json-optional")
            .contentType(MediaType.parseMediaType("application/json"))
            .apply { payload?.also { payload -> bodyValue(payload) } }
    }

    suspend fun WebClient.inlineJsonBody(inlineJsonBodyRequest: InlineJsonBodyRequest): Unit {
        this
            .inlineJsonBodyRequest(inlineJsonBodyRequest)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.inlineJsonBody(inlineJsonBodyRequest: InlineJsonBodyRequest, responseHandler: suspend (ClientResponse) -> T): T {
        return this.inlineJsonBodyRequest(inlineJsonBodyRequest).awaitExchange(responseHandler)
    }

    fun inlineJsonBodyUri(): String {
        return UriComponentsBuilder.fromPath("json-inline")
            .build()
            .toUriString()
    }

    fun WebClient.inlineJsonBodyRequest(inlineJsonBodyRequest: InlineJsonBodyRequest): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("json-inline")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(inlineJsonBodyRequest)
    }

    suspend fun WebClient.arrayJsonBody(listPayload: List<Payload>): Unit {
        this
            .arrayJsonBodyRequest(listPayload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.arrayJsonBody(listPayload: List<Payload>, responseHandler: suspend (ClientResponse) -> T): T {
        return this.arrayJsonBodyRequest(listPayload).awaitExchange(responseHandler)
    }

    fun arrayJsonBodyUri(): String {
        return UriComponentsBuilder.fromPath("json-array")
            .build()
            .toUriString()
    }

    fun WebClient.arrayJsonBodyRequest(listPayload: List<Payload>): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("json-array")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(listPayload)
    }

    suspend fun WebClient.primitiveJsonBody(string: String): Unit {
        this
            .primitiveJsonBodyRequest(string)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.primitiveJsonBody(string: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.primitiveJsonBodyRequest(string).awaitExchange(responseHandler)
    }

    fun primitiveJsonBodyUri(): String {
        return UriComponentsBuilder.fromPath("json-primitive")
            .build()
            .toUriString()
    }

    fun WebClient.primitiveJsonBodyRequest(string: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("json-primitive")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(string)
    }

    suspend fun WebClient.textBody(string: String): Unit {
        this
            .textBodyRequest(string)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.textBody(string: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.textBodyRequest(string).awaitExchange(responseHandler)
    }

    fun textBodyUri(): String {
        return UriComponentsBuilder.fromPath("text")
            .build()
            .toUriString()
    }

    fun WebClient.textBodyRequest(string: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("text")
            .contentType(MediaType.parseMediaType("text/plain"))
            .bodyValue(string)
    }

    suspend fun WebClient.binaryBody(string: String): Unit {
        this
            .binaryBodyRequest(string)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.binaryBody(string: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.binaryBodyRequest(string).awaitExchange(responseHandler)
    }

    fun binaryBodyUri(): String {
        return UriComponentsBuilder.fromPath("binary")
            .build()
            .toUriString()
    }

    fun WebClient.binaryBodyRequest(string: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("binary")
            .contentType(MediaType.parseMediaType("application/octet-stream"))
            .bodyValue(string)
    }

    suspend fun WebClient.anyBody(body: Any): Unit {
        this
            .anyBodyRequest(body)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.anyBody(body: Any, responseHandler: suspend (ClientResponse) -> T): T {
        return this.anyBodyRequest(body).awaitExchange(responseHandler)
    }

    fun anyBodyUri(): String {
        return UriComponentsBuilder.fromPath("any")
            .build()
            .toUriString()
    }

    fun WebClient.anyBodyRequest(body: Any): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("any")
            .contentType(MediaType.parseMediaType("*/*"))
            .bodyValue(body)
    }

    suspend fun WebClient.multiContentBody(payload: Payload): Unit {
        this
            .multiContentBodyRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.multiContentBody(payload: Payload, responseHandler: suspend (ClientResponse) -> T): T {
        return this.multiContentBodyRequest(payload).awaitExchange(responseHandler)
    }

    fun multiContentBodyUri(): String {
        return UriComponentsBuilder.fromPath("multi-content")
            .build()
            .toUriString()
    }

    fun WebClient.multiContentBodyRequest(payload: Payload): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("multi-content")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(payload)
    }

    suspend fun WebClient.formBody(formBodyRequest: FormBodyRequest): Unit {
        this
            .formBodyRequest(formBodyRequest)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.formBody(formBodyRequest: FormBodyRequest, responseHandler: suspend (ClientResponse) -> T): T {
        return this.formBodyRequest(formBodyRequest).awaitExchange(responseHandler)
    }

    fun formBodyUri(): String {
        return UriComponentsBuilder.fromPath("form")
            .build()
            .toUriString()
    }

    fun WebClient.formBodyRequest(formBodyRequest: FormBodyRequest): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("form")
            .contentType(MediaType.parseMediaType("application/x-www-form-urlencoded"))
            .bodyValue(formBodyRequest)
    }

    suspend fun WebClient.describedBody(payload: Payload): Unit {
        this
            .describedBodyRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.describedBody(payload: Payload, responseHandler: suspend (ClientResponse) -> T): T {
        return this.describedBodyRequest(payload).awaitExchange(responseHandler)
    }

    fun describedBodyUri(): String {
        return UriComponentsBuilder.fromPath("described-body")
            .build()
            .toUriString()
    }

    fun WebClient.describedBodyRequest(payload: Payload): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("described-body")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(payload)
    }

    suspend fun WebClient.refBody(payload: Payload): Unit {
        this
            .refBodyRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.refBody(payload: Payload, responseHandler: suspend (ClientResponse) -> T): T {
        return this.refBodyRequest(payload).awaitExchange(responseHandler)
    }

    fun refBodyUri(): String {
        return UriComponentsBuilder.fromPath("ref-body")
            .build()
            .toUriString()
    }

    fun WebClient.refBodyRequest(payload: Payload): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri("ref-body")
            .contentType(MediaType.parseMediaType("application/json"))
            .bodyValue(payload)
    }
}
