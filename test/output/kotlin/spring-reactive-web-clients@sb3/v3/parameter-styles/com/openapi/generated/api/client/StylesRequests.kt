package com.openapi.generated.api.client

import com.openapi.generated.model.Schema12
import com.openapi.generated.model.Schema5
import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object StylesRequests {
    suspend fun WebClient.formArray(tags: List<String>? = null): Unit {
        this
            .formArrayRequest(tags)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.formArray(tags: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.formArrayRequest(tags).awaitExchange(responseHandler)
    }

    fun formArrayUri(tags: List<String>? = null): String {
        return UriComponentsBuilder.fromPath("query-form-array")
            .apply {
                tags?.also { queryParam("tags", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.formArrayRequest(tags: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-form-array") { uriBuilder ->
            uriBuilder
                .apply {
                    tags?.also { queryParam("tags", it.joinToString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.formArrayNoExplode(tags: List<String>? = null): Unit {
        this
            .formArrayNoExplodeRequest(tags)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.formArrayNoExplode(tags: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.formArrayNoExplodeRequest(tags).awaitExchange(responseHandler)
    }

    fun formArrayNoExplodeUri(tags: List<String>? = null): String {
        return UriComponentsBuilder.fromPath("query-form-array-no-explode")
            .apply {
                tags?.also { queryParam("tags", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.formArrayNoExplodeRequest(tags: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-form-array-no-explode") { uriBuilder ->
            uriBuilder
                .apply {
                    tags?.also { queryParam("tags", it.joinToString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.formObject(coordinates: Schema5? = null): Unit {
        this
            .formObjectRequest(coordinates)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.formObject(coordinates: Schema5? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.formObjectRequest(coordinates).awaitExchange(responseHandler)
    }

    fun formObjectUri(coordinates: Schema5? = null): String {
        return UriComponentsBuilder.fromPath("query-form-object")
            .apply {
                coordinates?.also { queryParam("coordinates", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.formObjectRequest(coordinates: Schema5? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-form-object") { uriBuilder ->
            uriBuilder
                .apply {
                    coordinates?.also { queryParam("coordinates", it.toString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.spaceDelimited(tags: List<String>? = null): Unit {
        this
            .spaceDelimitedRequest(tags)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.spaceDelimited(tags: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.spaceDelimitedRequest(tags).awaitExchange(responseHandler)
    }

    fun spaceDelimitedUri(tags: List<String>? = null): String {
        return UriComponentsBuilder.fromPath("query-space-delimited")
            .apply {
                tags?.also { queryParam("tags", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.spaceDelimitedRequest(tags: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-space-delimited") { uriBuilder ->
            uriBuilder
                .apply {
                    tags?.also { queryParam("tags", it.joinToString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.pipeDelimited(tags: List<String>? = null): Unit {
        this
            .pipeDelimitedRequest(tags)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.pipeDelimited(tags: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.pipeDelimitedRequest(tags).awaitExchange(responseHandler)
    }

    fun pipeDelimitedUri(tags: List<String>? = null): String {
        return UriComponentsBuilder.fromPath("query-pipe-delimited")
            .apply {
                tags?.also { queryParam("tags", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.pipeDelimitedRequest(tags: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-pipe-delimited") { uriBuilder ->
            uriBuilder
                .apply {
                    tags?.also { queryParam("tags", it.joinToString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.deepObject(filter: Schema12? = null): Unit {
        this
            .deepObjectRequest(filter)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.deepObject(filter: Schema12? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.deepObjectRequest(filter).awaitExchange(responseHandler)
    }

    fun deepObjectUri(filter: Schema12? = null): String {
        return UriComponentsBuilder.fromPath("query-deep-object")
            .apply {
                filter?.also { queryParam("filter", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.deepObjectRequest(filter: Schema12? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query-deep-object") { uriBuilder ->
            uriBuilder
                .apply {
                    filter?.also { queryParam("filter", it.toString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.simplePath(values: List<String>): Unit {
        this
            .simplePathRequest(values)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.simplePath(values: List<String>, responseHandler: suspend (ClientResponse) -> T): T {
        return this.simplePathRequest(values).awaitExchange(responseHandler)
    }

    fun simplePathUri(values: List<String>): String {
        return UriComponentsBuilder.fromPath("simple-path/{values}")
            .buildAndExpand(mapOf("values" to values.joinToString()))
            .toUriString()
    }

    fun WebClient.simplePathRequest(values: List<String>): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("simple-path/{values}", mapOf("values" to values.joinToString()))
    }

    suspend fun WebClient.labelPath(values: List<String>): Unit {
        this
            .labelPathRequest(values)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.labelPath(values: List<String>, responseHandler: suspend (ClientResponse) -> T): T {
        return this.labelPathRequest(values).awaitExchange(responseHandler)
    }

    fun labelPathUri(values: List<String>): String {
        return UriComponentsBuilder.fromPath("label-path/{values}")
            .buildAndExpand(mapOf("values" to values.joinToString()))
            .toUriString()
    }

    fun WebClient.labelPathRequest(values: List<String>): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("label-path/{values}", mapOf("values" to values.joinToString()))
    }

    suspend fun WebClient.matrixPath(values: List<String>): Unit {
        this
            .matrixPathRequest(values)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.matrixPath(values: List<String>, responseHandler: suspend (ClientResponse) -> T): T {
        return this.matrixPathRequest(values).awaitExchange(responseHandler)
    }

    fun matrixPathUri(values: List<String>): String {
        return UriComponentsBuilder.fromPath("matrix-path/{values}")
            .buildAndExpand(mapOf("values" to values.joinToString()))
            .toUriString()
    }

    fun WebClient.matrixPathRequest(values: List<String>): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("matrix-path/{values}", mapOf("values" to values.joinToString()))
    }

    suspend fun WebClient.simpleHeader(xTags: List<String>? = null): Unit {
        this
            .simpleHeaderRequest(xTags)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.simpleHeader(xTags: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.simpleHeaderRequest(xTags).awaitExchange(responseHandler)
    }

    fun simpleHeaderUri(): String {
        return UriComponentsBuilder.fromPath("simple-header")
            .build()
            .toUriString()
    }

    fun WebClient.simpleHeaderRequest(xTags: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("simple-header")
            .headers { headers ->
                xTags?.also { headers.add("X-Tags", it.joinToString()) }
            }
    }
}
