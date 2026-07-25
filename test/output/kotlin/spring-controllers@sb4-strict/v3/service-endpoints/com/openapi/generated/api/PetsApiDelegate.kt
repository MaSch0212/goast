package com.openapi.generated.api

import com.openapi.generated.api.PetsApi.CreatePetResponseEntity
import com.openapi.generated.api.PetsApi.DeletePetResponseEntity
import com.openapi.generated.api.PetsApi.GetPetResponseEntity
import com.openapi.generated.api.PetsApi.ListPetsResponseEntity
import com.openapi.generated.api.PetsApi.SearchPetsResponseEntity
import com.openapi.generated.model.Pet
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface PetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun listPets(): ListPetsResponseEntity<*> {
        return ListPetsResponseEntity.notImplemented()
    }

    suspend fun createPet(pet: Pet): CreatePetResponseEntity<*> {
        return CreatePetResponseEntity.notImplemented()
    }

    suspend fun getPet(id: String): GetPetResponseEntity<*> {
        return GetPetResponseEntity.notImplemented()
    }

    suspend fun deletePet(id: String): DeletePetResponseEntity<*> {
        return DeletePetResponseEntity.notImplemented()
    }

    suspend fun searchPets(): SearchPetsResponseEntity<*> {
        return SearchPetsResponseEntity.notImplemented()
    }
}
