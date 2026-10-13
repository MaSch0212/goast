package com.openapi.generated.api

import com.openapi.generated.model.Error
import com.openapi.generated.model.Thing
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ResponsesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun twoSuccessCodes(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun successAndDefault(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun onlyDefault(): ResponseEntity<Error> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun noContent(): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun emptyBody200(): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun rangeCodes(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun mixedExactAndRange(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun errorCodes(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun multiContentResponse(): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun primitiveResponse(): ResponseEntity<String> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun arrayResponse(): ResponseEntity<Flux<Thing>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun refResponse(): ResponseEntity<Thing> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
