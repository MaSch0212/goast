package com.openapi.generated.api

import com.openapi.generated.api.Service1Api.CreatePetResponseEntity
import com.openapi.generated.api.Service1Api.GetOwnerResponseEntity
import com.openapi.generated.api.Service1Api.ListPetsResponseEntity
import com.openapi.generated.model.Pet
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface Service1ApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getOwner(id: String): GetOwnerResponseEntity<*> {
        return GetOwnerResponseEntity.notImplemented()
    }

    suspend fun listPets(): ListPetsResponseEntity<*> {
        return ListPetsResponseEntity.notImplemented()
    }

    suspend fun createPet(pet: Pet): CreatePetResponseEntity<*> {
        return CreatePetResponseEntity.notImplemented()
    }
}
