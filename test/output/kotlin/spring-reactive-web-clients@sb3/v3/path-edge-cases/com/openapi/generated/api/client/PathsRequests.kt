package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object PathsRequests {
    suspend fun WebClient.overlapTemplated(id: String): Unit {
        this
            .overlapTemplatedRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.overlapTemplated(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.overlapTemplatedRequest(id).awaitExchange(responseHandler)
    }

    fun overlapTemplatedUri(id: String): String {
        return UriComponentsBuilder.fromPath("overlap/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.overlapTemplatedRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(overlapTemplatedUri(id))
    }

    suspend fun WebClient.overlapLiteral(): Unit {
        this
            .overlapLiteralRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.overlapLiteral(responseHandler: suspend (ClientResponse) -> T): T {
        return this.overlapLiteralRequest().awaitExchange(responseHandler)
    }

    fun overlapLiteralUri(): String {
        return UriComponentsBuilder.fromPath("overlap/fixed")
            .build()
            .toUriString()
    }

    fun WebClient.overlapLiteralRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(overlapLiteralUri())
    }

    suspend fun WebClient.withDot(): Unit {
        this
            .withDotRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withDot(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withDotRequest().awaitExchange(responseHandler)
    }

    fun withDotUri(): String {
        return UriComponentsBuilder.fromPath("with.dot")
            .build()
            .toUriString()
    }

    fun WebClient.withDotRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withDotUri())
    }

    suspend fun WebClient.withDash(): Unit {
        this
            .withDashRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withDash(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withDashRequest().awaitExchange(responseHandler)
    }

    fun withDashUri(): String {
        return UriComponentsBuilder.fromPath("with-dash")
            .build()
            .toUriString()
    }

    fun WebClient.withDashRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withDashUri())
    }

    suspend fun WebClient.withUnderscore(): Unit {
        this
            .withUnderscoreRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withUnderscore(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withUnderscoreRequest().awaitExchange(responseHandler)
    }

    fun withUnderscoreUri(): String {
        return UriComponentsBuilder.fromPath("with_underscore")
            .build()
            .toUriString()
    }

    fun WebClient.withUnderscoreRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withUnderscoreUri())
    }

    suspend fun WebClient.withTilde(): Unit {
        this
            .withTildeRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withTilde(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withTildeRequest().awaitExchange(responseHandler)
    }

    fun withTildeUri(): String {
        return UriComponentsBuilder.fromPath("with~tilde")
            .build()
            .toUriString()
    }

    fun WebClient.withTildeRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withTildeUri())
    }

    suspend fun WebClient.withColon(): Unit {
        this
            .withColonRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withColon(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withColonRequest().awaitExchange(responseHandler)
    }

    fun withColonUri(): String {
        return UriComponentsBuilder.fromPath("with:colon")
            .build()
            .toUriString()
    }

    fun WebClient.withColonRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withColonUri())
    }

    suspend fun WebClient.withAt(): Unit {
        this
            .withAtRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.withAt(responseHandler: suspend (ClientResponse) -> T): T {
        return this.withAtRequest().awaitExchange(responseHandler)
    }

    fun withAtUri(): String {
        return UriComponentsBuilder.fromPath("with@at")
            .build()
            .toUriString()
    }

    fun WebClient.withAtRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(withAtUri())
    }

    suspend fun WebClient.trailingSlash(): Unit {
        this
            .trailingSlashRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.trailingSlash(responseHandler: suspend (ClientResponse) -> T): T {
        return this.trailingSlashRequest().awaitExchange(responseHandler)
    }

    fun trailingSlashUri(): String {
        return UriComponentsBuilder.fromPath("trailing/")
            .build()
            .toUriString()
    }

    fun WebClient.trailingSlashRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(trailingSlashUri())
    }

    suspend fun WebClient.paramOnlyPath(id: String): Unit {
        this
            .paramOnlyPathRequest(id)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.paramOnlyPath(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.paramOnlyPathRequest(id).awaitExchange(responseHandler)
    }

    fun paramOnlyPathUri(id: String): String {
        return UriComponentsBuilder.fromPath("{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.paramOnlyPathRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(paramOnlyPathUri(id))
    }

    suspend fun WebClient.threeParams(
        p1: String,
        p2: String,
        p3: String
    ): Unit {
        this
            .threeParamsRequest(p1, p2, p3)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.threeParams(
        p1: String,
        p2: String,
        p3: String,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.threeParamsRequest(p1, p2, p3).awaitExchange(responseHandler)
    }

    fun threeParamsUri(
        p1: String,
        p2: String,
        p3: String
    ): String {
        return UriComponentsBuilder.fromPath("a/{p1}/b/{p2}/c/{p3}")
            .buildAndExpand(mapOf("p1" to p1.toString(), "p2" to p2.toString(), "p3" to p3.toString()))
            .toUriString()
    }

    fun WebClient.threeParamsRequest(
        p1: String,
        p2: String,
        p3: String
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(threeParamsUri(p1, p2, p3))
    }

    suspend fun WebClient.caseVariety(): Unit {
        this
            .caseVarietyRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.caseVariety(responseHandler: suspend (ClientResponse) -> T): T {
        return this.caseVarietyRequest().awaitExchange(responseHandler)
    }

    fun caseVarietyUri(): String {
        return UriComponentsBuilder.fromPath("UPPER/Mixed/lower")
            .build()
            .toUriString()
    }

    fun WebClient.caseVarietyRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(caseVarietyUri())
    }

    suspend fun WebClient.veryDeepPath(): Unit {
        this
            .veryDeepPathRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.veryDeepPath(responseHandler: suspend (ClientResponse) -> T): T {
        return this.veryDeepPathRequest().awaitExchange(responseHandler)
    }

    fun veryDeepPathUri(): String {
        return UriComponentsBuilder.fromPath("very/deep/nested/path/with/many/segments/here")
            .build()
            .toUriString()
    }

    fun WebClient.veryDeepPathRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(veryDeepPathUri())
    }
}
