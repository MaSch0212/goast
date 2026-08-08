package com.openapi.generated.api

import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import jakarta.annotation.Generated
import org.springframework.http.codec.multipart.FilePart
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface PetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getPet(id: String): ResponseEntity<Pet> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun updatePet(id: String, petUpdate: PetUpdate): ResponseEntity<Pet> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun deletePet(id: String): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun createPet(pet: Pet): ResponseEntity<Pet> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }

    suspend fun uploadPetPhoto(
        id: String,
        file: FilePart,
        caption: String?
    ): ResponseEntity<Unit> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
