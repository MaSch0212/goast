// Drives the generated okhttp3 client against the reference server.
//
// Arguments are hardcoded rather than read from the case table: writing `getPet(id = "abc def")` in
// typed Kotlin *is* the assertion that the generated signature is usable. Emission order below matches
// `casesFor('okhttp3-clients@…', 'client')` table order, because the reference server consumes one
// queue per (method, pathTemplate) with `shift()` and two cases share `PUT /pets/{id}`.
//
// No `package` declaration on purpose: `synthesizeDriverBuild` (Task 5) derives Gradle's `mainClass`
// from the bare file name (`OkHttp3DriverKt`), with no package prefix. Declaring one here would compile
// fine and then fail `gradle run` with a class-not-found.
//
// Every `<op>ApiClient` operation is a *blocking*, non-suspend member function returning the decoded
// body directly and throwing `ClientException`/`ServerException` on any non-2xx response — there is no
// per-status overload (see PetsApiClient.kt). `getWidget`'s four error cases are driven through exactly
// that throwing method, the same one an ordinary caller would use, and `errorResultJson` unpacks
// whatever the thrown exception's `response` field (a `ClientError`/`ServerError`) actually carries,
// rather than reshaping the case table to fit what this client can return.
//
// A `<op>` method that returns `Unit` on success (deletePet, uploadPetPhoto, allLocations, styleMatrix,
// pathStyleSimple, getEncoded) gives a caller no way at all to recover the response status from its
// return value. For those cases only, this driver calls the `<op>WithHttpInfo` sibling instead — which
// never throws and returns `ApiResponse<Unit?>` — purely to read `.statusCode`, mirroring how the
// `fetch-clients` driver reads `response.status` for its own void operations. This is not a workaround
// for the throwing behavior above: none of these cases exercises a non-2xx response.
//
// `uploadBlob` is wrapped by the same generic `runCase` catch as everything else, but for a different
// reason discovered by running this driver: `BlobsApiClient.uploadBlob` sends `Content-Type:
// application/octet-stream` with a raw Kotlin `String` body, and the shared `requestBody()` helper in
// `ApiClient.kt` only knows how to serialize a `File` or a JSON-ish media type — anything else falls
// through to `throw UnsupportedOperationException(...)`. The call therefore fails before any network
// I/O happens at all, for every input, and `runCase`'s catch-all is what stops that from taking the rest
// of the run down with it.

import com.openapi.generated.api.client.BlobsApiClient
import com.openapi.generated.api.client.ParamsApiClient
import com.openapi.generated.api.client.PetsApiClient
import com.openapi.generated.api.client.WidgetsApiClient
import com.openapi.generated.api.client.infrastructure.ClientError
import com.openapi.generated.api.client.infrastructure.ClientException
import com.openapi.generated.api.client.infrastructure.Serializer
import com.openapi.generated.api.client.infrastructure.ServerError
import com.openapi.generated.api.client.infrastructure.ServerException
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import java.io.File
import java.nio.file.Files

private const val PREFIX = "##GOAST-CASE##"
private val mapper = Serializer.jacksonObjectMapper

private fun emit(caseId: String, resultJson: String) = println("$PREFIX{\"caseId\":\"$caseId\",\"result\":$resultJson}")

/**
 * Runs one case, catching anything the call throws — HTTP-level (`ClientException`/`ServerException`)
 * or otherwise (`uploadBlob`'s pre-network `UnsupportedOperationException`) — so a single failing case
 * cannot abort the other 18. A case that expects to throw handles that itself inside `block` (see
 * `errorResultJson`); this catch is the backstop for everything that does not.
 */
private fun runCase(caseId: String, block: () -> String) {
    val resultJson = try {
        block()
    } catch (e: Throwable) {
        mapper.writeValueAsString(mapOf("error" to (e::class.qualifiedName ?: "Throwable"), "message" to e.message))
    }
    emit(caseId, resultJson)
}

/**
 * Unwraps whatever body a thrown `ClientException`/`ServerException` carried.
 *
 * `ClientError.body`/`ServerError.body` are the *raw* response text (`response.body?.string()` in
 * `ApiClient.request`), not a decoded object — the throwing wrapper never runs it through the
 * `ObjectMapper` at all. This validates that text as JSON and reports it verbatim when it is (which is
 * what every `getWidget` error case's body actually is), and falls back to just the status code
 * otherwise, the same fallback shape a void response gets.
 */
private fun errorResultJson(e: Throwable): String {
    val (statusCode, rawBody) = when (e) {
        is ClientException -> e.statusCode to ((e.response as? ClientError<*>)?.body as? String)
        is ServerException -> e.statusCode to ((e.response as? ServerError<*>)?.body as? String)
        else -> throw e
    }
    val decoded = rawBody?.takeIf { it.isNotBlank() }?.let {
        try {
            mapper.readTree(it)
            it
        } catch (_: Exception) {
            null
        }
    }
    return decoded ?: mapper.writeValueAsString(mapOf("status" to statusCode))
}

fun main() {
    val baseUrl = System.getenv("GOAST_BASE_URL") ?: error("GOAST_BASE_URL is not set")

    // `PetsApiClient`/`WidgetsApiClient` take no headers parameter at all — the only way to attach one to
    // every request an instance makes is a client-level interceptor. Cases that do not declare these
    // headers are unaffected: `diffRequest` only compares headers a case names.
    val httpClient = OkHttpClient.Builder()
        .addInterceptor(Interceptor { chain ->
            chain.proceed(
                chain.request().newBuilder()
                    .header("Authorization", "Bearer secret-token")
                    .header("x-api-key", "secret-key")
                    .build(),
            )
        })
        .build()

    val pets = PetsApiClient(basePath = baseUrl, client = httpClient)
    val widgets = WidgetsApiClient(basePath = baseUrl, client = httpClient)
    val blobs = BlobsApiClient(basePath = baseUrl, client = httpClient)
    val params = ParamsApiClient(basePath = baseUrl, client = httpClient)

    runCase("getPet/ok") { mapper.writeValueAsString(pets.getPet("abc")) }

    runCase("updatePet/json") { mapper.writeValueAsString(pets.updatePet("abc", PetUpdate(name = "Rex", age = 4))) }

    runCase("updatePet/form") { mapper.writeValueAsString(pets.updatePet("abc", PetUpdate(name = "Rex", age = 4))) }

    runCase("addPetNote/text") { mapper.writeValueAsString(pets.addPetNote("abc", "plain text body")) }

    runCase("deletePet/noContent") {
        mapper.writeValueAsString(mapOf("status" to pets.deletePetWithHttpInfo("abc").statusCode))
    }

    runCase("createPet/created") { mapper.writeValueAsString(pets.createPet(Pet(id = "new1", name = "Fido"))) }

    runCase("uploadPetPhoto/ok") {
        // A real temp file, not a byte array: the generated signature takes `java.io.File`. Named
        // `photo.png` (not a random temp name) because okhttp3's multipart builder derives both the
        // `Content-Disposition` filename and the guessed content type from `File.name`.
        val photoDir = Files.createTempDirectory("goast-photo").toFile()
        val photo = File(photoDir, "photo.png").apply { writeBytes("binarydata".toByteArray()) }
        mapper.writeValueAsString(
            mapOf("status" to pets.uploadPetPhotoWithHttpInfo("abc", photo, "A good boy").statusCode),
        )
    }

    runCase("getWidget/ok") { mapper.writeValueAsString(widgets.getWidget("w1")) }

    runCase("getWidget/badRequest") {
        try {
            mapper.writeValueAsString(widgets.getWidget("bad"))
        } catch (e: ClientException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/notFound") {
        try {
            mapper.writeValueAsString(widgets.getWidget("missing"))
        } catch (e: ClientException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/serverError") {
        try {
            mapper.writeValueAsString(widgets.getWidget("boom"))
        } catch (e: ServerException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/unexpectedError") {
        try {
            mapper.writeValueAsString(widgets.getWidget("other"))
        } catch (e: ServerException) {
            errorResultJson(e)
        }
    }

    runCase("uploadBlob/ok") { mapper.writeValueAsString(blobs.uploadBlob("hello")) }

    runCase("allLocations/ok") {
        mapper.writeValueAsString(
            mapOf("status" to params.allLocationsWithHttpInfo("loc1", "q1", "h1").statusCode),
        )
    }

    runCase("styleMatrix/formExploded") {
        mapper.writeValueAsString(
            mapOf("status" to params.styleMatrixWithHttpInfo(formExploded = listOf("a", "b")).statusCode),
        )
    }

    runCase("styleMatrix/formUnexploded") {
        mapper.writeValueAsString(
            mapOf("status" to params.styleMatrixWithHttpInfo(formUnexploded = listOf("a", "b")).statusCode),
        )
    }

    runCase("styleMatrix/spaceDelimited") {
        mapper.writeValueAsString(
            mapOf("status" to params.styleMatrixWithHttpInfo(spaceDelimited = listOf("a", "b")).statusCode),
        )
    }

    runCase("pathStyleSimple/ok") {
        mapper.writeValueAsString(mapOf("status" to params.pathStyleSimpleWithHttpInfo(listOf("a", "b")).statusCode))
    }

    runCase("getEncoded/ok") {
        mapper.writeValueAsString(
            mapOf("status" to params.getEncodedWithHttpInfo("abc def/x", "a&b=c").statusCode),
        )
    }
}
