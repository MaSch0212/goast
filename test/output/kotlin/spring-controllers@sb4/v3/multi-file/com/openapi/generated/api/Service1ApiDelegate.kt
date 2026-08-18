package com.openapi.generated.api

import com.openapi.generated.model.Owner
import com.openapi.generated.model.Pet
import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service1ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getOwner(id: String): ResponseEntity<Owner> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun listPets(): ResponseEntity<Flux<Pet>> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun createPet(pet: Pet): ResponseEntity<Pet> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
