package com.openapi.generated.api

import com.openapi.generated.api.PetsApi.CreatePetResponseEntity
import com.openapi.generated.api.PetsApi.DeletePetResponseEntity
import com.openapi.generated.api.PetsApi.GetPetResponseEntity
import com.openapi.generated.api.PetsApi.UpdatePetResponseEntity
import com.openapi.generated.api.PetsApi.UploadPetPhotoResponseEntity
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import jakarta.annotation.Generated
import org.springframework.http.codec.multipart.FilePart
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface PetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getPet(id: String): GetPetResponseEntity<*> {
        return GetPetResponseEntity.notImplemented()
    }

    suspend fun updatePet(id: String, petUpdate: PetUpdate): UpdatePetResponseEntity<*> {
        return UpdatePetResponseEntity.notImplemented()
    }

    suspend fun deletePet(id: String): DeletePetResponseEntity<*> {
        return DeletePetResponseEntity.notImplemented()
    }

    suspend fun createPet(pet: Pet): CreatePetResponseEntity<*> {
        return CreatePetResponseEntity.notImplemented()
    }

    suspend fun uploadPetPhoto(
        id: String,
        file: FilePart,
        caption: String?
    ): UploadPetPhotoResponseEntity<*> {
        return UploadPetPhotoResponseEntity.notImplemented()
    }
}
