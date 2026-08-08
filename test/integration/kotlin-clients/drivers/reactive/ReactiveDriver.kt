// Drives the generated spring-reactive-web-clients API against the reference server.
//
// Arguments are hardcoded rather than read from the case table, for the same reason as the okhttp3
// driver: writing `webClient.getPet("abc def")` in typed Kotlin *is* the assertion that the generated
// signature is usable. Emission order below matches `casesFor('spring-reactive-web-clients@…',
// 'client')` table order, because the reference server consumes one queue per (method, pathTemplate)
// with `shift()` and two cases share `PUT /pets/{id}`.
//
// No `package` declaration on purpose: `synthesizeDriverBuild` (Task 5) derives Gradle's `mainClass`
// from the bare file name (`ReactiveDriverKt`), with no package prefix.
//
// Unlike the okhttp3 family, this generated tree ships no `ObjectMapper`/`Serializer` of its own, and
// `kotlinDependenciesFor('spring-reactive-web-clients', …)` (Task 5) deliberately does not add
// `jackson-databind`: the generated code never imports it directly (WebFlux's own codec machinery
// handles JSON under the hood). So this driver has no JSON library at all to build `result` payloads
// with, and hand-rolls the handful of shapes it actually needs — `Pet`/`Widget`/`BlobRef`, plain maps,
// and primitives — via `jsonValue` below, mirroring the null-dropping behavior the okhttp3 driver gets
// for free from Jackson's `NON_ABSENT` inclusion (see that file's `Serializer.kt`).
//
// Every `<Tag>Requests` operation is a `suspend` extension function on `WebClient`. The parameterless
// form (`webClient.getPet(id)`) uses `.retrieve().awaitBody<T>()`/`.awaitBodilessEntity()`, and
// `retrieve()` applies WebClient's default status handling: it throws `WebClientResponseException` on
// any 4xx/5xx, the same "no per-status overload" shape as okhttp3's plain methods. `getWidget`'s four
// error cases are driven through exactly that throwing form, and `errorResultJson` reports only
// `.statusCode`. This is deliberate, not a shortcut: `WebClientResponseException` does carry
// `responseBodyAsString`, but that text is never decoded by the throwing call path — reconstructing the
// case table's `{message, code}` shape from it here would be this driver doing the decoding the client
// itself refuses to do, misreporting conformance with `expectResult` for the single biggest behavioral
// difference this phase exists to find: these clients throw instead of handing back a decoded error
// body at all.
//
// A `<op>` whose 2xx response has no body (deletePet, uploadPetPhoto, allLocations, styleMatrix,
// pathStyleSimple, getEncoded) returns bare `Unit` from that parameterless form, with no way to recover
// the response status. For those cases only, this driver uses the generated `responseHandler` overload
// (`.awaitExchange { response -> ... }`) instead, purely to read `.statusCode()` — that overload never
// applies `retrieve()`'s default error handling, but none of these cases exercises a non-2xx response,
// so nothing here relies on that to dodge a throw.

import com.openapi.generated.api.client.BlobsRequests.uploadBlob
import com.openapi.generated.api.client.ParamsRequests.allLocations
import com.openapi.generated.api.client.ParamsRequests.getEncoded
import com.openapi.generated.api.client.ParamsRequests.pathStyleSimple
import com.openapi.generated.api.client.ParamsRequests.styleMatrix
import com.openapi.generated.api.client.PetsRequests.addPetNote
import com.openapi.generated.api.client.PetsRequests.createPet
import com.openapi.generated.api.client.PetsRequests.deletePet
import com.openapi.generated.api.client.PetsRequests.getPet
import com.openapi.generated.api.client.PetsRequests.updatePet
import com.openapi.generated.api.client.PetsRequests.uploadPetPhoto
import com.openapi.generated.api.client.WidgetsRequests.getWidget
import com.openapi.generated.api.client.infrastructure.ApiRequestFile
import com.openapi.generated.model.BlobRef
import com.openapi.generated.model.Pet
import com.openapi.generated.model.PetUpdate
import com.openapi.generated.model.Widget
import kotlinx.coroutines.runBlocking
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import java.io.File
import java.nio.file.Files

private const val PREFIX = "##GOAST-CASE##"

private fun emit(caseId: String, resultJson: String) = println("$PREFIX{\"caseId\":\"$caseId\",\"result\":$resultJson}")

/**
 * A minimal, hand-rolled JSON writer for exactly the shapes this driver ever builds: strings, numbers,
 * booleans, `Map`s (entries with a `null` value are dropped, same as the okhttp3 side's `NON_ABSENT`
 * `ObjectMapper`), and `List`s. Anything else is a bug in this driver, not a case this JSON needs to
 * support.
 */
private fun jsonValue(value: Any?): String = when (value) {
    null -> "null"
    is String -> jsonString(value)
    is Number, is Boolean -> value.toString()
    is Map<*, *> -> value.entries.filter { it.value != null }
        .joinToString(",", "{", "}") { (k, v) -> "${jsonString(k.toString())}:${jsonValue(v)}" }
    is List<*> -> value.joinToString(",", "[", "]") { jsonValue(it) }
    else -> error("jsonValue has no encoding for ${value::class}")
}

private fun jsonString(value: String): String = buildString {
    append('"')
    for (c in value) {
        when (c) {
            '"' -> append("\\\"")
            '\\' -> append("\\\\")
            '\n' -> append("\\n")
            '\r' -> append("\\r")
            '\t' -> append("\\t")
            else -> append(c)
        }
    }
    append('"')
}

private fun Pet.toResult(): String = jsonValue(mapOf("id" to id, "name" to name, "age" to age))
private fun Widget.toResult(): String = jsonValue(mapOf("id" to id, "name" to name, "price" to price))
private fun BlobRef.toResult(): String = jsonValue(mapOf("id" to id))

/**
 * Runs one case, catching anything the call throws so a single failing case cannot abort the other 18.
 * A case that expects to throw handles that itself inside `block` (see `errorResultJson`); this catch is
 * the backstop for everything that does not.
 */
private suspend fun runCase(caseId: String, block: suspend () -> String) {
    val resultJson = try {
        block()
    } catch (e: Throwable) {
        jsonValue(mapOf("error" to (e::class.qualifiedName ?: "Throwable"), "message" to e.message))
    }
    emit(caseId, resultJson)
}

/**
 * Reports only the status code a thrown `WebClientResponseException` carried — the same fallback shape a
 * void response gets, and deliberately not the decoded case-table `expectResult` shape. See the file
 * comment: `responseBodyAsString` is raw, undecoded text; reconstructing `{message, code}` from it here
 * would report this driver's own decoding as if the client had done it, hiding the very thing this phase
 * measures.
 */
private fun errorResultJson(e: WebClientResponseException): String = jsonValue(mapOf("status" to e.statusCode.value()))

fun main(): Unit = runBlocking {
    val baseUrl = System.getenv("GOAST_BASE_URL") ?: error("GOAST_BASE_URL is not set")

    // `bearerAuth`/`apiKeyAuth` have no generated code path at all — the only way this client can satisfy
    // either scheme is a header set at construction time, applied to every request the instance makes.
    // Cases that do not declare the header are unaffected: `diffRequest` only compares headers a case
    // names.
    val webClient = WebClient.builder()
        .baseUrl(baseUrl)
        .defaultHeader("Authorization", "Bearer secret-token")
        .defaultHeader("x-api-key", "secret-key")
        .build()

    runCase("getPet/ok") { webClient.getPet("abc").toResult() }

    runCase("updatePet/json") { webClient.updatePet("abc", PetUpdate(name = "Rex", age = 4)).toResult() }

    runCase("updatePet/form") { webClient.updatePet("abc", PetUpdate(name = "Rex", age = 4)).toResult() }

    runCase("addPetNote/text") { webClient.addPetNote("abc", "plain text body").toResult() }

    runCase("deletePet/noContent") {
        val status = webClient.deletePet("abc") { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("createPet/created") { webClient.createPet(Pet(id = "new1", name = "Fido")).toResult() }

    runCase("uploadPetPhoto/ok") {
        // A real temp file, not a byte array: `ApiRequestFile.from` takes `java.io.File`. Named
        // `photo.png` because `ApiRequestFile.from(File)` reports `file.name` as the multipart filename.
        val photoDir = Files.createTempDirectory("goast-photo").toFile()
        val photo = File(photoDir, "photo.png").apply { writeBytes("binarydata".toByteArray()) }
        val status = webClient.uploadPetPhoto("abc", ApiRequestFile.from(photo), "A good boy") { response ->
            response.statusCode().value()
        }
        jsonValue(mapOf("status" to status))
    }

    runCase("getWidget/ok") { webClient.getWidget("w1").toResult() }

    runCase("getWidget/badRequest") {
        try {
            webClient.getWidget("bad").toResult()
        } catch (e: WebClientResponseException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/notFound") {
        try {
            webClient.getWidget("missing").toResult()
        } catch (e: WebClientResponseException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/serverError") {
        try {
            webClient.getWidget("boom").toResult()
        } catch (e: WebClientResponseException) {
            errorResultJson(e)
        }
    }

    runCase("getWidget/unexpectedError") {
        try {
            webClient.getWidget("other").toResult()
        } catch (e: WebClientResponseException) {
            errorResultJson(e)
        }
    }

    runCase("uploadBlob/ok") { webClient.uploadBlob("hello").toResult() }

    runCase("allLocations/ok") {
        val status = webClient.allLocations("loc1", "q1", "h1") { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("styleMatrix/formExploded") {
        val status = webClient.styleMatrix(formExploded = listOf("a", "b")) { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("styleMatrix/formUnexploded") {
        val status =
            webClient.styleMatrix(formUnexploded = listOf("a", "b")) { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("styleMatrix/spaceDelimited") {
        val status =
            webClient.styleMatrix(spaceDelimited = listOf("a", "b")) { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("pathStyleSimple/ok") {
        val status = webClient.pathStyleSimple(listOf("a", "b")) { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }

    runCase("getEncoded/ok") {
        val status = webClient.getEncoded("abc def/x", "a&b=c") { response -> response.statusCode().value() }
        jsonValue(mapOf("status" to status))
    }
}
