package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ParamsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun pathStyleSimple(values: List<String>): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun getEncoded(value: String, raw: String?): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
