package com.openapi.generated.api.client

import com.openapi.generated.model.Widget
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object WidgetsRequests {
    suspend fun WebClient.getWidget(id: String): Widget {
        return this
            .getWidgetRequest(id)
            .retrieve()
            .awaitBody<Widget>()
    }

    suspend fun <T : Any> WebClient.getWidget(id: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.getWidgetRequest(id).awaitExchange(responseHandler)
    }

    fun getWidgetUri(id: String): String {
        return UriComponentsBuilder.fromPath("widgets/{id}")
            .buildAndExpand(mapOf("id" to id.toString()))
            .toUriString()
    }

    fun WebClient.getWidgetRequest(id: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.GET)
            .uri("widgets/{id}", mapOf("id" to id.toString()))
            .accept(MediaType.APPLICATION_JSON)
    }
}
