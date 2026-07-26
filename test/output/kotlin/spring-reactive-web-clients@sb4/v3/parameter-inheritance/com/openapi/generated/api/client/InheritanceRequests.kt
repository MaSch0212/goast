package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object InheritanceRequests {
    suspend fun WebClient.inheritsParams(id: String, common: String? = null): Unit {
        this
            .inheritsParamsRequest(id, common)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.inheritsParams(
        id: String,
        common: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.inheritsParamsRequest(id, common).awaitExchange(responseHandler)
    }

    fun inheritsParamsUri(id: String, common: String? = null): String {
        return UriComponentsBuilder.fromPath("inherited/{id}")
            .apply {
                common?.also { queryParam("common", it.toString()) }
            }
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.inheritsParamsRequest(id: String, common: String? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(inheritsParamsUri(id, common))
    }

    suspend fun WebClient.inheritsAndAdds(
        id: String,
        common: String? = null,
        extra: String? = null
    ): Unit {
        this
            .inheritsAndAddsRequest(id, common, extra)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.inheritsAndAdds(
        id: String,
        common: String? = null,
        extra: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.inheritsAndAddsRequest(id, common, extra).awaitExchange(responseHandler)
    }

    fun inheritsAndAddsUri(
        id: String,
        common: String? = null,
        extra: String? = null
    ): String {
        return UriComponentsBuilder.fromPath("inherited/{id}")
            .apply {
                common?.also { queryParam("common", it.toString()) }
                extra?.also { queryParam("extra", it.toString()) }
            }
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.inheritsAndAddsRequest(
        id: String,
        common: String? = null,
        extra: String? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST).uri(inheritsAndAddsUri(id, common, extra))
    }

    suspend fun WebClient.overridesParam(id: String, common: Int? = null): Unit {
        this
            .overridesParamRequest(id, common)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.overridesParam(
        id: String,
        common: Int? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.overridesParamRequest(id, common).awaitExchange(responseHandler)
    }

    fun overridesParamUri(id: String, common: Int? = null): String {
        return UriComponentsBuilder.fromPath("overridden/{id}")
            .apply {
                common?.also { queryParam("common", it.toString()) }
            }
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.overridesParamRequest(id: String, common: Int? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(overridesParamUri(id, common))
    }

    suspend fun WebClient.refParam(id: String, page: Int? = 1): Unit {
        this
            .refParamRequest(id, page)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.refParam(
        id: String,
        page: Int? = 1,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.refParamRequest(id, page).awaitExchange(responseHandler)
    }

    fun refParamUri(id: String, page: Int? = 1): String {
        return UriComponentsBuilder.fromPath("ref-param/{id}")
            .apply {
                page?.also { queryParam("page", it.toString()) }
            }
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.refParamRequest(id: String, page: Int? = 1): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(refParamUri(id, page))
    }
}
