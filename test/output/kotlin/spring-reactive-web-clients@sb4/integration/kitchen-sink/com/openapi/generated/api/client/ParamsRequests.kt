package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object ParamsRequests {
    suspend fun WebClient.allLocations(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null
    ): Unit {
        this
            .allLocationsRequest(pathParam, queryParam, xHeaderParam)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.allLocations(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.allLocationsRequest(pathParam, queryParam, xHeaderParam).awaitExchange(responseHandler)
    }

    fun allLocationsUri(pathParam: String, queryParam: String? = null): String {
        return UriComponentsBuilder.fromPath("locations/{pathParam}")
            .apply {
                queryParam?.also { queryParam("queryParam", it.toString()) }
            }
            .buildAndExpand(mapOf("pathParam" to pathParam.toString()))
            .toUriString()
    }

    fun WebClient.allLocationsRequest(
        pathParam: String,
        queryParam: String? = null,
        xHeaderParam: String? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("locations/{pathParam}") { uriBuilder ->
                uriBuilder
                    .apply {
                        queryParam?.also { queryParam("queryParam", it.toString()) }
                    }
                    .build(mapOf("pathParam" to pathParam.toString()))
            }
            .headers { headers ->
                xHeaderParam?.also { headers.add("X-Header-Param", it.toString()) }
            }
    }

    suspend fun WebClient.styleMatrix(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): Unit {
        this
            .styleMatrixRequest(formExploded, formUnexploded, spaceDelimited)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.styleMatrix(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.styleMatrixRequest(formExploded, formUnexploded, spaceDelimited).awaitExchange(responseHandler)
    }

    fun styleMatrixUri(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): String {
        return UriComponentsBuilder.fromPath("styles")
            .apply {
                formExploded?.also { queryParam("formExploded", it.joinToString()) }
                formUnexploded?.also { queryParam("formUnexploded", it.joinToString()) }
                spaceDelimited?.also { queryParam("spaceDelimited", it.joinToString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.styleMatrixRequest(
        formExploded: List<String>? = null,
        formUnexploded: List<String>? = null,
        spaceDelimited: List<String>? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("styles") { uriBuilder ->
            uriBuilder
                .apply {
                    formExploded?.also { queryParam("formExploded", it.joinToString()) }
                    formUnexploded?.also { queryParam("formUnexploded", it.joinToString()) }
                    spaceDelimited?.also { queryParam("spaceDelimited", it.joinToString()) }
                }
                .build()
        }
    }

    suspend fun WebClient.pathStyleSimple(values: List<String>): Unit {
        this
            .pathStyleSimpleRequest(values)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.pathStyleSimple(values: List<String>, responseHandler: suspend (ClientResponse) -> T): T {
        return this.pathStyleSimpleRequest(values).awaitExchange(responseHandler)
    }

    fun pathStyleSimpleUri(values: List<String>): String {
        return UriComponentsBuilder.fromPath("styles/{values}")
            .buildAndExpand(mapOf("values" to values.joinToString()))
            .toUriString()
    }

    fun WebClient.pathStyleSimpleRequest(values: List<String>): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("styles/{values}", mapOf("values" to values.joinToString()))
    }

    suspend fun WebClient.getEncoded(value: String, raw: String? = null): Unit {
        this
            .getEncodedRequest(value, raw)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.getEncoded(
        value: String,
        raw: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.getEncodedRequest(value, raw).awaitExchange(responseHandler)
    }

    fun getEncodedUri(value: String, raw: String? = null): String {
        return UriComponentsBuilder.fromPath("encoded/{value}")
            .apply {
                raw?.also { queryParam("raw", it.toString()) }
            }
            .buildAndExpand(mapOf("value" to value.toString()))
            .toUriString()
    }

    fun WebClient.getEncodedRequest(value: String, raw: String? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("encoded/{value}") { uriBuilder ->
            uriBuilder
                .apply {
                    raw?.also { queryParam("raw", it.toString()) }
                }
                .build(mapOf("value" to value.toString()))
        }
    }
}
