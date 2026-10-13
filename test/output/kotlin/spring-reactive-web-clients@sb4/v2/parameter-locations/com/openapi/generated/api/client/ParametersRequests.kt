package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object ParametersRequests {
    suspend fun WebClient.bodyParam(): Unit {
        this
            .bodyParamRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.bodyParam(responseHandler: suspend (ClientResponse) -> T): T {
        return this.bodyParamRequest().awaitExchange(responseHandler)
    }

    fun bodyParamUri(): String {
        return UriComponentsBuilder.fromPath("body")
            .build()
            .toUriString()
    }

    fun WebClient.bodyParamRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST).uri("body")
    }

    suspend fun WebClient.formDataParams(): Unit {
        this
            .formDataParamsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.formDataParams(responseHandler: suspend (ClientResponse) -> T): T {
        return this.formDataParamsRequest().awaitExchange(responseHandler)
    }

    fun formDataParamsUri(): String {
        return UriComponentsBuilder.fromPath("form")
            .build()
            .toUriString()
    }

    fun WebClient.formDataParamsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST).uri("form")
    }

    suspend fun WebClient.fileUpload(): Unit {
        this
            .fileUploadRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.fileUpload(responseHandler: suspend (ClientResponse) -> T): T {
        return this.fileUploadRequest().awaitExchange(responseHandler)
    }

    fun fileUploadUri(): String {
        return UriComponentsBuilder.fromPath("upload")
            .build()
            .toUriString()
    }

    fun WebClient.fileUploadRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST).uri("upload")
    }

    suspend fun WebClient.queryParams(tags: Any? = null, ids: Any? = null): Unit {
        this
            .queryParamsRequest(tags, ids)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.queryParams(
        tags: Any? = null,
        ids: Any? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.queryParamsRequest(tags, ids).awaitExchange(responseHandler)
    }

    fun queryParamsUri(tags: Any? = null, ids: Any? = null): String {
        return UriComponentsBuilder.fromPath("query")
            .apply {
                tags?.also { queryParam("tags", it.toString()) }
                ids?.also { queryParam("ids", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.queryParamsRequest(tags: Any? = null, ids: Any? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri("query") { uriBuilder ->
            uriBuilder
                .apply {
                    tags?.also { queryParam("tags", it.toString()) }
                    ids?.also { queryParam("ids", it.toString()) }
                }
                .build()
        }
    }
}
