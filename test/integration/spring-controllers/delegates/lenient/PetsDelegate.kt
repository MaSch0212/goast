package goast.server

import com.openapi.generated.api.PetsApiDelegate
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.stereotype.Component

/**
 * `PetsApiDelegate` for the two non-strict units, one method per case group.
 *
 * Each method asserts what the case table says the request carried, then returns the declared response.
 * `updatePet` serves two cases — `updatePet/json` and `updatePet/form` — with one body: both send the
 * same `PetUpdate` values through different content types, and both declare the same response, so the
 * delegate cannot and need not tell them apart. Whether the *form* encoding was decoded at all still
 * shows up: a server that cannot read it never reaches this method.
 */
@Component
class PetsDelegate : PetsApiDelegate {
    override suspend fun getPet(id: String): ResponseEntity<Pet> {
        expectParam("getPet.id", "abc", id)
        return json(200, Pet(id = "abc", name = "Rex"))
    }

    override suspend fun updatePet(id: String, petUpdate: PetUpdate): ResponseEntity<Pet> {
        expectParam("updatePet.id", "abc", id)
        expectParam("updatePet.petUpdate", PetUpdate(name = "Rex", age = 4), petUpdate)
        return json(200, Pet(id = "abc", name = "Rex", age = 4))
    }

    override suspend fun deletePet(id: String): ResponseEntity<Unit> {
        expectParam("deletePet.id", "abc", id)
        return ResponseEntity.status(204).build()
    }

    override suspend fun createPet(pet: Pet): ResponseEntity<Pet> {
        expectParam("createPet.pet", Pet(id = "new1", name = "Fido"), pet)
        return json(201, Pet(id = "new1", name = "Fido"))
    }

    override suspend fun uploadPetPhoto(id: String, file: FilePart, caption: String?): ResponseEntity<Unit> {
        expectParam("uploadPetPhoto.id", "abc", id)
        expectParam("uploadPetPhoto.file.filename", "photo.png", file.filename())
        expectParam("uploadPetPhoto.file.content", "binarydata", readPart(file))
        expectParam("uploadPetPhoto.caption", "A good boy", caption)
        return ResponseEntity.status(200).build()
    }

    override suspend fun addPetNote(id: String, string: String): ResponseEntity<Pet> {
        expectParam("addPetNote.id", "abc", id)
        expectParam("addPetNote.string", "plain text body", string)
        return json(200, Pet(id = "abc", name = "Rex"))
    }
}
