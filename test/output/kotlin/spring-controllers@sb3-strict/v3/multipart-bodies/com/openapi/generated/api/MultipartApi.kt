package com.openapi.generated.api

import com.openapi.generated.model.NestedObjectPartRequest
import com.openapi.generated.model.Payload
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.codec.multipart.FilePart
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestPart
import reactor.core.publisher.Flux

@Validated
@RequestMapping("\${api.base-path:/}")
interface MultipartApi {
    companion object {
        const val SINGLE_FILE_PATH = "/file"
        const val MULTIPLE_FILES_PATH = "/files"
        const val FILE_AND_FIELDS_PATH = "/mixed"
        const val NESTED_OBJECT_PART_PATH = "/nested"
        const val REF_PART_PATH = "/ref-part"
        const val WITH_ENCODING_PATH = "/encoded"
        const val OPTIONAL_FILE_PATH = "/optional-file"
    }

    fun getDelegate(): MultipartApiDelegate = object : MultipartApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "singleFile", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The single file was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [SINGLE_FILE_PATH], consumes = ["multipart/form-data"])
    suspend fun singleFile(
        @Parameter(name = "file", required = true)
        @RequestPart(value = "file", required = true)
        file: FilePart
    ): ResponseEntity<*> {
        try {
            return getDelegate().singleFile(file)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "multipleFiles", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The array of files was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [MULTIPLE_FILES_PATH], consumes = ["multipart/form-data"])
    suspend fun multipleFiles(
        @Parameter(name = "files", required = false)
        @RequestPart(value = "files", required = false)
        files: Flux<String>
    ): ResponseEntity<*> {
        try {
            return getDelegate().multipleFiles(files)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "fileAndFields", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The file and the three fields were accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [FILE_AND_FIELDS_PATH], consumes = ["multipart/form-data"])
    suspend fun fileAndFields(
        @Parameter(name = "file", required = false)
        @RequestPart(value = "file", required = false)
        file: FilePart,

        @Parameter(name = "label", required = false)
        @RequestPart(value = "label", required = false)
        label: String?,

        @Parameter(name = "quantity", required = false)
        @RequestPart(value = "quantity", required = false)
        quantity: Int?,

        @Parameter(name = "active", required = false)
        @RequestPart(value = "active", required = false)
        active: Boolean?
    ): ResponseEntity<*> {
        try {
            return getDelegate().fileAndFields(
                file,
                label,
                quantity,
                active
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "nestedObjectPart", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The nested object part was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [NESTED_OBJECT_PART_PATH], consumes = ["multipart/form-data"])
    suspend fun nestedObjectPart(
        @Parameter(name = "metadata", required = false)
        @Valid
        @RequestPart(value = "metadata", required = false)
        metadata: NestedObjectPartRequest?
    ): ResponseEntity<*> {
        try {
            return getDelegate().nestedObjectPart(metadata)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "refPart", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The referenced payload part was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [REF_PART_PATH], consumes = ["multipart/form-data"])
    suspend fun refPart(
        @Parameter(name = "payload", required = false)
        @Valid
        @RequestPart(value = "payload", required = false)
        payload: Payload?
    ): ResponseEntity<*> {
        try {
            return getDelegate().refPart(payload)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "withEncoding", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The file and fields, with an encoding block, were accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [WITH_ENCODING_PATH], consumes = ["multipart/form-data"])
    suspend fun withEncoding(
        @Parameter(name = "file", required = false)
        @RequestPart(value = "file", required = false)
        file: FilePart,

        @Parameter(name = "label", required = false)
        @RequestPart(value = "label", required = false)
        label: String?,

        @Parameter(name = "quantity", required = false)
        @RequestPart(value = "quantity", required = false)
        quantity: Int?,

        @Parameter(name = "active", required = false)
        @RequestPart(value = "active", required = false)
        active: Boolean?
    ): ResponseEntity<*> {
        try {
            return getDelegate().withEncoding(
                file,
                label,
                quantity,
                active
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "optionalFile", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The optional file part was accepted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [OPTIONAL_FILE_PATH], consumes = ["multipart/form-data"])
    suspend fun optionalFile(
        @Parameter(name = "file", required = false)
        @RequestPart(value = "file", required = false)
        file: FilePart
    ): ResponseEntity<*> {
        try {
            return getDelegate().optionalFile(file)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for singleFile.
     */
    class SingleFileResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = SingleFileResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for multipleFiles.
     */
    class MultipleFilesResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = MultipleFilesResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for fileAndFields.
     */
    class FileAndFieldsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = FileAndFieldsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for nestedObjectPart.
     */
    class NestedObjectPartResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = NestedObjectPartResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for refPart.
     */
    class RefPartResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = RefPartResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for withEncoding.
     */
    class WithEncodingResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = WithEncodingResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for optionalFile.
     */
    class OptionalFileResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OptionalFileResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
