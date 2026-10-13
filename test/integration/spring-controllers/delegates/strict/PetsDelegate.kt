package goast.server

import com.openapi.generated.api.PetsApi.AddPetNoteResponseEntity
import com.openapi.generated.api.PetsApi.CreatePetResponseEntity
import com.openapi.generated.api.PetsApi.DeletePetResponseEntity
import com.openapi.generated.api.PetsApi.GetPetResponseEntity
import com.openapi.generated.api.PetsApi.UpdatePetResponseEntity
import com.openapi.generated.api.PetsApi.UploadPetPhotoResponseEntity
import com.openapi.generated.api.PetsApiDelegate
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Component

/**
 * `PetsApiDelegate` for the two `-strict` units.
 *
 * Assertions are character-for-character the lenient delegate's: only the return expressions differ,
 * because `strictResponseEntities` replaces `ResponseEntity<Pet>` with a nested class whose primary
 * constructor is private. The factories used here are the only ones the generated code offers for these
 * operations, and each corresponds to a status the spec declares — which is the feature: an undeclared
 * status is unreachable by construction.
 *
 * One source set serves both `@sb3-strict` and `@sb4-strict`: their generated `*ApiDelegate.kt` files
 * are byte-identical, and the `*Api.kt` differences (`<T>` vs `<T : Any>`, `Unit?` vs `Unit`) do not
 * reach the factory signatures called here.
 */
@Component
class PetsDelegate : PetsApiDelegate {
    override suspend fun getPet(id: String): GetPetResponseEntity<*> {
        expectParam("getPet.id", "abc", id)
        return GetPetResponseEntity.ok(Pet(id = "abc", name = "Rex"))
    }

    override suspend fun updatePet(id: String, petUpdate: PetUpdate): UpdatePetResponseEntity<*> {
        expectParam("updatePet.id", "abc", id)
        expectParam("updatePet.petUpdate", PetUpdate(name = "Rex", age = 4), petUpdate)
        return UpdatePetResponseEntity.ok(Pet(id = "abc", name = "Rex", age = 4))
    }

    override suspend fun deletePet(id: String): DeletePetResponseEntity<*> {
        expectParam("deletePet.id", "abc", id)
        return DeletePetResponseEntity.noContent()
    }

    override suspend fun createPet(pet: Pet): CreatePetResponseEntity<*> {
        expectParam("createPet.pet", Pet(id = "new1", name = "Fido"), pet)
        return CreatePetResponseEntity.created(Pet(id = "new1", name = "Fido"))
    }

    override suspend fun uploadPetPhoto(
        id: String,
        file: FilePart,
        caption: String?,
    ): UploadPetPhotoResponseEntity<*> {
        expectParam("uploadPetPhoto.id", "abc", id)
        expectParam("uploadPetPhoto.file.filename", "photo.png", file.filename())
        expectParam("uploadPetPhoto.file.content", "binarydata", readPart(file))
        expectParam("uploadPetPhoto.caption", "A good boy", caption)
        return UploadPetPhotoResponseEntity.ok()
    }

    override suspend fun addPetNote(id: String, string: String): AddPetNoteResponseEntity<*> {
        expectParam("addPetNote.id", "abc", id)
        expectParam("addPetNote.string", "plain text body", string)
        return AddPetNoteResponseEntity.ok(Pet(id = "abc", name = "Rex"))
    }
}
