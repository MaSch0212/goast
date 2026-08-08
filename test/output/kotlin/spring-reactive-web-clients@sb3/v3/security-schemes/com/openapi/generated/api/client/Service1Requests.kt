package com.openapi.generated.api.client

import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object Service1Requests {
    suspend fun WebClient.inheritsSecurity(): Unit {
        this
            .inheritsSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.inheritsSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.inheritsSecurityRequest().awaitExchange(responseHandler)
    }

    fun inheritsSecurityUri(): String {
        return UriComponentsBuilder.fromPath("inherits-security")
            .build()
            .toUriString()
    }

    fun WebClient.inheritsSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(inheritsSecurityUri())
    }

    suspend fun WebClient.overridesSecurity(): Unit {
        this
            .overridesSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.overridesSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.overridesSecurityRequest().awaitExchange(responseHandler)
    }

    fun overridesSecurityUri(): String {
        return UriComponentsBuilder.fromPath("overrides-security")
            .build()
            .toUriString()
    }

    fun WebClient.overridesSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(overridesSecurityUri())
    }

    suspend fun WebClient.noSecurity(): Unit {
        this
            .noSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.noSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.noSecurityRequest().awaitExchange(responseHandler)
    }

    fun noSecurityUri(): String {
        return UriComponentsBuilder.fromPath("no-security")
            .build()
            .toUriString()
    }

    fun WebClient.noSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(noSecurityUri())
    }

    suspend fun WebClient.multiSecurity(): Unit {
        this
            .multiSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.multiSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.multiSecurityRequest().awaitExchange(responseHandler)
    }

    fun multiSecurityUri(): String {
        return UriComponentsBuilder.fromPath("multi-security")
            .build()
            .toUriString()
    }

    fun WebClient.multiSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(multiSecurityUri())
    }

    suspend fun WebClient.andSecurity(): Unit {
        this
            .andSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.andSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.andSecurityRequest().awaitExchange(responseHandler)
    }

    fun andSecurityUri(): String {
        return UriComponentsBuilder.fromPath("and-security")
            .build()
            .toUriString()
    }

    fun WebClient.andSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(andSecurityUri())
    }

    suspend fun WebClient.scopedSecurity(): Unit {
        this
            .scopedSecurityRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.scopedSecurity(responseHandler: suspend (ClientResponse) -> T): T {
        return this.scopedSecurityRequest().awaitExchange(responseHandler)
    }

    fun scopedSecurityUri(): String {
        return UriComponentsBuilder.fromPath("scoped")
            .build()
            .toUriString()
    }

    fun WebClient.scopedSecurityRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(scopedSecurityUri())
    }
}
