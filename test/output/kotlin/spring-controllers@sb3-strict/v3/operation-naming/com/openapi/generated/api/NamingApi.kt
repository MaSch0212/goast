package com.openapi.generated.api

import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import org.springframework.http.ResponseEntity
import org.springframework.util.MultiValueMap
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod

@Validated
@RequestMapping("\${api.base-path:/}")
interface NamingApi {
    companion object {
        const val GET_ITEMS_PATH = "/items"
        const val POST_ITEMS_PATH = "/items"
        const val OPTIONS_ITEMS_PATH = "/items"
        const val HEAD_ITEMS_PATH = "/items"
        const val GET_ITEMS_ID_PATH = "/items/{id}"
        const val PUT_ITEMS_ID_PATH = "/items/{id}"
        const val DELETE_ITEMS_ID_PATH = "/items/{id}"
        const val PATCH_ITEMS_ID_PATH = "/items/{id}"
        const val GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH = "/items/{id}/sub-items/{subId}"
        const val GET_PATH = "/"
        const val GET_A_B_C_D_E_PATH = "/a/b/c/d/e"
        const val GET_WITH_SUMMARY_PATH = "/with-summary"
    }

    fun getDelegate(): NamingApiDelegate = object : NamingApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "get_items", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A list of items.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_ITEMS_PATH])
    suspend fun getItems(): ResponseEntity<*> {
        try {
            return getDelegate().getItems()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "post_items", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The created item.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.POST], value = [POST_ITEMS_PATH])
    suspend fun postItems(): ResponseEntity<*> {
        try {
            return getDelegate().postItems()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "options_items", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "Allowed methods.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.OPTIONS], value = [OPTIONS_ITEMS_PATH])
    suspend fun optionsItems(): ResponseEntity<*> {
        try {
            return getDelegate().optionsItems()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "head_items", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "Item headers.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.HEAD], value = [HEAD_ITEMS_PATH])
    suspend fun headItems(): ResponseEntity<*> {
        try {
            return getDelegate().headItems()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "get_items_:id", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The requested item.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_ITEMS_ID_PATH])
    suspend fun getItemsId(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().getItemsId(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "put_items_:id", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The updated item.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.PUT], value = [PUT_ITEMS_ID_PATH])
    suspend fun putItemsId(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().putItemsId(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "delete_items_:id", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The item was deleted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.DELETE], value = [DELETE_ITEMS_ID_PATH])
    suspend fun deleteItemsId(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().deleteItemsId(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "patch_items_:id", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The patched item.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.PATCH], value = [PATCH_ITEMS_ID_PATH])
    suspend fun patchItemsId(
        @Parameter(required = true)
        @PathVariable("id")
        id: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().patchItemsId(id)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "get_items_:id_sub-items_:subId", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The requested sub-item.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_ITEMS_ID_SUB_ITEMS_SUB_ID_PATH])
    suspend fun getItemsIdSubItemsSubId(
        @Parameter(required = true)
        @PathVariable("id")
        id: String,

        @Parameter(required = true)
        @PathVariable("subId")
        subId: String
    ): ResponseEntity<*> {
        try {
            return getDelegate().getItemsIdSubItemsSubId(id, subId)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "get_", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The root resource.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_PATH])
    suspend fun get(): ResponseEntity<*> {
        try {
            return getDelegate().get()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "get_a_b_c_d_e", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "A deeply nested resource.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_A_B_C_D_E_PATH])
    suspend fun getABCDE(): ResponseEntity<*> {
        try {
            return getDelegate().getABCDE()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(summary = "Get the summary example", operationId = "get_with-summary", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The summary example.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_WITH_SUMMARY_PATH])
    suspend fun getWithSummary(): ResponseEntity<*> {
        try {
            return getDelegate().getWithSummary()
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    /**
     * Response entity for get_items.
     */
    class GetItemsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetItemsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for post_items.
     */
    class PostItemsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PostItemsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for options_items.
     */
    class OptionsItemsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = OptionsItemsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for head_items.
     */
    class HeadItemsResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = HeadItemsResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for get_items_:id.
     */
    class GetItemsIdResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetItemsIdResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for put_items_:id.
     */
    class PutItemsIdResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PutItemsIdResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for delete_items_:id.
     */
    class DeleteItemsIdResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = DeleteItemsIdResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for patch_items_:id.
     */
    class PatchItemsIdResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = PatchItemsIdResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for get_items_:id_sub-items_:subId.
     */
    class GetItemsIdSubItemsSubIdResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetItemsIdSubItemsSubIdResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for get_.
     */
    class GetResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for get_a_b_c_d_e.
     */
    class GetABCDEResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetABCDEResponseEntity<Unit?>(null, 200, headers)
        }
    }

    /**
     * Response entity for get_with-summary.
     */
    class GetWithSummaryResponseEntity<T> private constructor(
        body: T,
        rawStatus: Int,
        headers: MultiValueMap<String, String>? = null
    ) : ResponseEntity<T>(body, headers, rawStatus) {
        companion object {
            fun badRequest(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 400, headers)

            fun unauthorized(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 401, headers)

            fun forbidden(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 403, headers)

            fun internalServerError(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 500, headers)

            fun notImplemented(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 501, headers)

            fun ok(headers: MultiValueMap<String, String>? = null) = GetWithSummaryResponseEntity<Unit?>(null, 200, headers)
        }
    }
}
