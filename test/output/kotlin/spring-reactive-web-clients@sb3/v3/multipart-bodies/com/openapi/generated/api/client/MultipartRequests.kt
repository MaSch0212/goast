package com.openapi.generated.api.client

import com.openapi.generated.api.client.infrastructure.ApiRequestFile
import com.openapi.generated.model.NestedObjectPartRequest
import com.openapi.generated.model.Payload
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.BodyInserters
import org.springframework.web.reactive.function.client.awaitBodilessEntity
import org.springframework.web.reactive.function.client.awaitExchange
import org.springframework.web.reactive.function.client.ClientResponse
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClient.RequestHeadersSpec
import org.springframework.web.util.UriComponentsBuilder

object MultipartRequests {
    suspend fun WebClient.singleFile(file: ApiRequestFile): Unit {
        this
            .singleFileRequest(file)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.singleFile(file: ApiRequestFile, responseHandler: suspend (ClientResponse) -> T): T {
        return this.singleFileRequest(file).awaitExchange(responseHandler)
    }

    fun singleFileUri(): String {
        return UriComponentsBuilder.fromPath("file")
            .build()
            .toUriString()
    }

    fun WebClient.singleFileRequest(file: ApiRequestFile): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(singleFileUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            file.addToBuilder(this)
                        }
                        .build()))
    }

    suspend fun WebClient.multipleFiles(files: List<String>? = null): Unit {
        this
            .multipleFilesRequest(files)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.multipleFiles(files: List<String>? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.multipleFilesRequest(files).awaitExchange(responseHandler)
    }

    fun multipleFilesUri(): String {
        return UriComponentsBuilder.fromPath("files")
            .build()
            .toUriString()
    }

    fun WebClient.multipleFilesRequest(files: List<String>? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(multipleFilesUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            files?.also { files -> part("files", files).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }

    suspend fun WebClient.fileAndFields(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): Unit {
        this
            .fileAndFieldsRequest(
                file,
                label,
                quantity,
                active
            )
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.fileAndFields(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.fileAndFieldsRequest(
            file,
            label,
            quantity,
            active
        ).awaitExchange(responseHandler)
    }

    fun fileAndFieldsUri(): String {
        return UriComponentsBuilder.fromPath("mixed")
            .build()
            .toUriString()
    }

    fun WebClient.fileAndFieldsRequest(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(fileAndFieldsUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            file?.addToBuilder(this)
                            label?.also { label -> part("label", label).contentType(MediaType.APPLICATION_JSON) }
                            quantity?.also { quantity -> part("quantity", quantity).contentType(MediaType.APPLICATION_JSON) }
                            active?.also { active -> part("active", active).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }

    suspend fun WebClient.nestedObjectPart(metadata: NestedObjectPartRequest? = null): Unit {
        this
            .nestedObjectPartRequest(metadata)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.nestedObjectPart(metadata: NestedObjectPartRequest? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.nestedObjectPartRequest(metadata).awaitExchange(responseHandler)
    }

    fun nestedObjectPartUri(): String {
        return UriComponentsBuilder.fromPath("nested")
            .build()
            .toUriString()
    }

    fun WebClient.nestedObjectPartRequest(metadata: NestedObjectPartRequest? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(nestedObjectPartUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            metadata?.also { metadata -> part("metadata", metadata).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }

    suspend fun WebClient.refPart(payload: Payload? = null): Unit {
        this
            .refPartRequest(payload)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.refPart(payload: Payload? = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.refPartRequest(payload).awaitExchange(responseHandler)
    }

    fun refPartUri(): String {
        return UriComponentsBuilder.fromPath("ref-part")
            .build()
            .toUriString()
    }

    fun WebClient.refPartRequest(payload: Payload? = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(refPartUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            payload?.also { payload -> part("payload", payload).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }

    suspend fun WebClient.withEncoding(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): Unit {
        this
            .withEncodingRequest(
                file,
                label,
                quantity,
                active
            )
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.withEncoding(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null,
        responseHandler: suspend (ClientResponse) -> T
    ): T {
        return this.withEncodingRequest(
            file,
            label,
            quantity,
            active
        ).awaitExchange(responseHandler)
    }

    fun withEncodingUri(): String {
        return UriComponentsBuilder.fromPath("encoded")
            .build()
            .toUriString()
    }

    fun WebClient.withEncodingRequest(
        file: ApiRequestFile = null,
        label: String? = null,
        quantity: Int? = null,
        active: Boolean? = null
    ): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(withEncodingUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            file?.addToBuilder(this)
                            label?.also { label -> part("label", label).contentType(MediaType.APPLICATION_JSON) }
                            quantity?.also { quantity -> part("quantity", quantity).contentType(MediaType.APPLICATION_JSON) }
                            active?.also { active -> part("active", active).contentType(MediaType.APPLICATION_JSON) }
                        }
                        .build()))
    }

    suspend fun WebClient.optionalFile(file: ApiRequestFile = null): Unit {
        this
            .optionalFileRequest(file)
            .retrieve()
            .awaitBodilessEntity()
    }

    suspend fun <T : Any> WebClient.optionalFile(file: ApiRequestFile = null, responseHandler: suspend (ClientResponse) -> T): T {
        return this.optionalFileRequest(file).awaitExchange(responseHandler)
    }

    fun optionalFileUri(): String {
        return UriComponentsBuilder.fromPath("optional-file")
            .build()
            .toUriString()
    }

    fun WebClient.optionalFileRequest(file: ApiRequestFile = null): RequestHeadersSpec<*> {
        return this.method(HttpMethod.POST)
            .uri(optionalFileUri())
            .contentType(MediaType.parseMediaType("multipart/form-data"))
            .body(BodyInserters.fromMultipartData(MultipartBodyBuilder()
                        .apply {
                            file?.addToBuilder(this)
                        }
                        .build()))
    }
}
