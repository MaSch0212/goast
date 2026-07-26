package com.openapi.generated.api

import com.openapi.generated.model.Thing
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service1ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listThings(): ResponseEntity<Flux<Thing>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
