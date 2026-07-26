package com.openapi.generated.api.client

import com.openapi.generated.model.ParamSchema
import org.springframework.http.HttpMethod
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object ParametersRequests {
    suspend fun WebClient.twoPathParams(id: String, sub: Int): Unit {
        this
            .twoPathParamsRequest(id, sub)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.twoPathParams(
        id: String,
        sub: Int,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.twoPathParamsRequest(id, sub).awaitExchange(responseHandler)
    }

    fun twoPathParamsUri(id: String, sub: Int): String {
        return UriComponentsBuilder.fromPath("path/{id}/{sub}")
            .buildAndExpand(mapOf("id" to id.toString(), "sub" to sub.toString()))
            .toUriString()
    }

    fun WebClient.twoPathParamsRequest(id: String, sub: Int): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(twoPathParamsUri(id, sub))
    }

    suspend fun WebClient.queryParams(
        requiredString: String,
        optionalString: String? = null,
        intWithDefault: Int? = 10,
        flag: Boolean? = null
    ): Unit {
        this
            .queryParamsRequest(
                requiredString,
                optionalString,
                intWithDefault,
                flag
            )
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.queryParams(
        requiredString: String,
        optionalString: String? = null,
        intWithDefault: Int? = 10,
        flag: Boolean? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.queryParamsRequest(
            requiredString,
            optionalString,
            intWithDefault,
            flag
        ).awaitExchange(responseHandler)
    }

    fun queryParamsUri(
        requiredString: String,
        optionalString: String? = null,
        intWithDefault: Int? = 10,
        flag: Boolean? = null
    ): String {
        return UriComponentsBuilder.fromPath("query")
            .apply {
                queryParam("requiredString", requiredString.toString())
                optionalString?.also { queryParam("optionalString", it.toString()) }
                intWithDefault?.also { queryParam("intWithDefault", it.toString()) }
                flag?.also { queryParam("flag", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.queryParamsRequest(
        requiredString: String,
        optionalString: String? = null,
        intWithDefault: Int? = 10,
        flag: Boolean? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(queryParamsUri(
                requiredString,
                optionalString,
                intWithDefault,
                flag
            ))
    }

    suspend fun WebClient.headerParams(xRequestId: String, xOptionalHeader: String? = null): Unit {
        this
            .headerParamsRequest(xRequestId, xOptionalHeader)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.headerParams(
        xRequestId: String,
        xOptionalHeader: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.headerParamsRequest(xRequestId, xOptionalHeader).awaitExchange(responseHandler)
    }

    fun headerParamsUri(): String {
        return UriComponentsBuilder.fromPath("header")
            .build()
            .toUriString()
    }

    fun WebClient.headerParamsRequest(xRequestId: String, xOptionalHeader: String? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(headerParamsUri())
            .headers { headers ->
                headers.add("X-Request-Id", xRequestId.toString())
                xOptionalHeader?.also { headers.add("X-Optional-Header", it.toString()) }
            }
    }

    suspend fun WebClient.cookieParams(): Unit {
        this
            .cookieParamsRequest()
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.cookieParams(responseHandler: suspend (ClientResponse) -> T): T {
        return this.cookieParamsRequest().awaitExchange(responseHandler)
    }

    fun cookieParamsUri(): String {
        return UriComponentsBuilder.fromPath("cookie")
            .build()
            .toUriString()
    }

    fun WebClient.cookieParamsRequest(): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(cookieParamsUri())
    }

    suspend fun WebClient.mixedParams(
        id: String,
        filter: String? = null,
        xTraceId: String? = null
    ): Unit {
        this
            .mixedParamsRequest(id, filter, xTraceId)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.mixedParams(
        id: String,
        filter: String? = null,
        xTraceId: String? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.mixedParamsRequest(id, filter, xTraceId).awaitExchange(responseHandler)
    }

    fun mixedParamsUri(id: String, filter: String? = null): String {
        return UriComponentsBuilder.fromPath("mixed/{id}")
            .apply {
                filter?.also { queryParam("filter", it.toString()) }
            }
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.mixedParamsRequest(
        id: String,
        filter: String? = null,
        xTraceId: String? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri(mixedParamsUri(id, filter))
            .headers { headers ->
                xTraceId?.also { headers.add("X-Trace-Id", it.toString()) }
            }
    }

    suspend fun WebClient.describedParams(
        withDescription: String? = null,
        withoutDescription: String? = null,
        withExample: String? = null,
        withRefSchema: ParamSchema? = null
    ): Unit {
        this
            .describedParamsRequest(
                withDescription,
                withoutDescription,
                withExample,
                withRefSchema
            )
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.describedParams(
        withDescription: String? = null,
        withoutDescription: String? = null,
        withExample: String? = null,
        withRefSchema: ParamSchema? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.describedParamsRequest(
            withDescription,
            withoutDescription,
            withExample,
            withRefSchema
        ).awaitExchange(responseHandler)
    }

    fun describedParamsUri(
        withDescription: String? = null,
        withoutDescription: String? = null,
        withExample: String? = null,
        withRefSchema: ParamSchema? = null
    ): String {
        return UriComponentsBuilder.fromPath("described")
            .apply {
                withDescription?.also { queryParam("withDescription", it.toString()) }
                withoutDescription?.also { queryParam("withoutDescription", it.toString()) }
                withExample?.also { queryParam("withExample", it.toString()) }
                withRefSchema?.also { queryParam("withRefSchema", it.value) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.describedParamsRequest(
        withDescription: String? = null,
        withoutDescription: String? = null,
        withExample: String? = null,
        withRefSchema: ParamSchema? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(describedParamsUri(
                withDescription,
                withoutDescription,
                withExample,
                withRefSchema
            ))
    }

    suspend fun WebClient.allowEmptyValueParam(search: String? = null): Unit {
        this
            .allowEmptyValueParamRequest(search)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.allowEmptyValueParam(search: String? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.allowEmptyValueParamRequest(search).awaitExchange(responseHandler)
    }

    fun allowEmptyValueParamUri(search: String? = null): String {
        return UriComponentsBuilder.fromPath("empty-value")
            .apply {
                search?.also { queryParam("search", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.allowEmptyValueParamRequest(search: String? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(allowEmptyValueParamUri(search))
    }

    suspend fun WebClient.reservedCharParam(filter: String? = null): Unit {
        this
            .reservedCharParamRequest(filter)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T> WebClient.reservedCharParam(filter: String? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.reservedCharParamRequest(filter).awaitExchange(responseHandler)
    }

    fun reservedCharParamUri(filter: String? = null): String {
        return UriComponentsBuilder.fromPath("reserved")
            .apply {
                filter?.also { queryParam("filter", it.toString()) }
            }
            .build()
            .toUriString()
    }

    fun WebClient.reservedCharParamRequest(filter: String? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET).uri(reservedCharParamUri(filter))
    }
}
