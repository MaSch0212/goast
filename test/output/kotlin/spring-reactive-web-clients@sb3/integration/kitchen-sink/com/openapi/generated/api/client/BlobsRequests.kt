package com.openapi.generated.api.client

import com.openapi.generated.model.BlobRef
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.client.awaitBody
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object BlobsRequests {
    suspend fun WebClient.uploadBlob(string: String): BlobRef {
        return this
            .uploadBlobRequest(string)
            .retrieve()
            .awaitBody<BlobRef>()
    }

    suspend fun <T> WebClient.uploadBlob(string: String, responseHandler: suspend (ClientResponse) -> T): T {
        return this.uploadBlobRequest(string).awaitExchange(responseHandler)
    }

    fun uploadBlobUri(): String {
        return UriComponentsBuilder.fromPath("blobs")
            .build()
            .toUriString()
    }

    fun WebClient.uploadBlobRequest(string: String): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(uploadBlobUri())
            .accept(MediaType.APPLICATION_JSON)
            .contentType(MediaType.parseMediaType("application/octet-stream"))
            .bodyValue(string)
    }
}
