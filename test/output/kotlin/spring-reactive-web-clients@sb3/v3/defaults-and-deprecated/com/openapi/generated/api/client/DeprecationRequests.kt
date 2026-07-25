package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object DeprecationRequests {
    /**
     * This operation is deprecated.
     */
    suspend fun WebClient.deprecatedOp(): Unit {
        this
            .deprecatedOpRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    /**
     * This operation is deprecated.
     */
    suspend fun <T> WebClient.deprecatedOp(responseHandler: suspend (ClientResponse) -> T): T {
        return this.deprecatedOpRequest().awaitExchange(responseHandler)
    }

    fun deprecatedOpUri(): String {
        return UriComponentsBuilder.fromPath("deprecated-op")
            .build()
            .toUriString()
    }

    /**
     * This operation is deprecated.
     */
    fun WebClient.deprecatedOpRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(deprecatedOpUri())
    }

    suspend fun WebClient.deprecatedOpNoDesc(): Unit {
        this
            .deprecatedOpNoDescRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.deprecatedOpNoDesc(responseHandler: suspend (ClientResponse) -> T): T {
        return this.deprecatedOpNoDescRequest().awaitExchange(responseHandler)
    }

    fun deprecatedOpNoDescUri(): String {
        return UriComponentsBuilder.fromPath("deprecated-op-no-desc")
            .build()
            .toUriString()
    }

    fun WebClient.deprecatedOpNoDescRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(deprecatedOpNoDescUri())
    }

    suspend fun WebClient.deprecatedParams(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): Unit {
        this
            .deprecatedParamsRequest(withDesc, noDesc, plain)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.deprecatedParams(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.deprecatedParamsRequest(withDesc, noDesc, plain).awaitExchange(responseHandler)
    }

    fun deprecatedParamsUri(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): String {
        return UriComponentsBuilder.fromPath("deprecated-params")
            .apply {
                withDesc?.also { queryParam("withDesc", it.toString()) }
                noDesc?.also { queryParam("noDesc", it.toString()) }
                plain?.also { queryParam("plain", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.deprecatedParamsRequest(
        withDesc: String? = null,
        noDesc: String? = null,
        plain: String? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(deprecatedParamsUri(withDesc, noDesc, plain))
    }
}
