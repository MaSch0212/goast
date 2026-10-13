package com.openapi.generated.api

import com.openapi.generated.model.Permission
import com.openapi.generated.model.Resource
import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam

@Validated
@RequestMapping("\${api.base-path:/}")
interface ResourcesApi {
    companion object {
        const val LIST_RESOURCES_PATH = "/resources"
        const val GET_PERMITTED_RESOURCES_PATH = "/resources/{resourceType}"
        const val CHECK_RESOURCE_PERMISSION_PATH = "/resources/{resourceType}/{resourceId}/{permission}"
        const val GRANT_RESOURCE_PERMISSION_PATH = "/resources/{resourceType}/{resourceId}/{permission}"
    }

    fun getDelegate(): ResourcesApiDelegate = object : ResourcesApiDelegate {}

    fun getExceptionHandler(): ApiExceptionHandler? = null

    @Operation(operationId = "listResources", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The permitted resources.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Resource::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [LIST_RESOURCES_PATH])
    suspend fun listResources(
        @Parameter(required = true, schema = Schema(allowableValues = [
                    "read",
                    "write",
                    "delete"
                ]))
        @RequestParam(value = "permission", required = true)
        permission: String,

        @Parameter(required = false)
        @RequestParam(value = "limit", required = false)
        limit: Int?,

        @Parameter(required = false)
        @RequestParam(value = "tags", required = false)
        tags: List<String>?,

        @Parameter(required = true, hidden = true)
        @RequestHeader("X-Tenant")
        xTenant: String
    ): ResponseEntity<*> {
        val permission = permission.let { Permission.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter permission") }
        try {
            return getDelegate().listResources(
                permission,
                limit,
                tags,
                xTenant
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "getPermittedResources", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "The permitted resources.", content = [Content(mediaType = "application/json", array = ArraySchema(schema = Schema(implementation = Resource::class)))])])
    @RequestMapping(method = [RequestMethod.GET], value = [GET_PERMITTED_RESOURCES_PATH])
    suspend fun getPermittedResources(
        @Parameter(required = true)
        @PathVariable("resourceType")
        resourceType: String,

        @Parameter(required = false, schema = Schema(allowableValues = [
                    "read",
                    "write",
                    "delete"
                ]))
        @RequestParam(value = "permission", required = false)
        permission: String?,

        @Parameter(required = false)
        @RequestParam(value = "limit", required = false)
        limit: Int?
    ): ResponseEntity<*> {
        val permission = permission?.let { Permission.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter permission") }
        try {
            return getDelegate().getPermittedResources(resourceType, permission, limit)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "checkResourcePermission", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "200", description = "Whether the permission is granted.", content = [Content(mediaType = "application/json", schema = Schema(implementation = Boolean::class))])])
    @RequestMapping(method = [RequestMethod.GET], value = [CHECK_RESOURCE_PERMISSION_PATH])
    suspend fun checkResourcePermission(
        @Parameter(required = true)
        @PathVariable("resourceType")
        resourceType: String,

        @Parameter(required = true)
        @PathVariable("resourceId")
        resourceId: String,

        @Parameter(required = true, schema = Schema(allowableValues = [
                    "read",
                    "write",
                    "delete"
                ]))
        @PathVariable("permission")
        permission: String
    ): ResponseEntity<*> {
        val permission = permission.let { Permission.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter permission") }
        try {
            return getDelegate().checkResourcePermission(resourceType, resourceId, permission)
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }

    @Operation(operationId = "grantResourcePermission", deprecated = false)
    @ApiResponses(value = [ApiResponse(responseCode = "204", description = "Permission granted.", content = [Content()])])
    @RequestMapping(method = [RequestMethod.PUT], value = [GRANT_RESOURCE_PERMISSION_PATH], consumes = ["application/json"])
    suspend fun grantResourcePermission(
        @Parameter(required = true)
        @PathVariable("resourceType")
        resourceType: String,

        @Parameter(required = true)
        @PathVariable("resourceId")
        resourceId: String,

        @Parameter(required = true, schema = Schema(allowableValues = [
                    "read",
                    "write",
                    "delete"
                ]))
        @PathVariable("permission")
        permission: String,

        @Parameter(required = false)
        @RequestParam(value = "notify", required = false)
        notify: Boolean?,

        @Parameter(required = true)
        @Valid
        @RequestBody
        resource: Resource
    ): ResponseEntity<*> {
        val permission = permission.let { Permission.fromValue(it) ?: return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid value for parameter permission") }
        try {
            return getDelegate().grantResourcePermission(
                resourceType,
                resourceId,
                permission,
                notify,
                resource
            )
        } catch (e: Throwable) {
            return getExceptionHandler()?.handleApiException(e) ?: throw e
        }
    }
}
