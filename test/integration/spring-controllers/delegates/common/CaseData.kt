package goast.server

import com.openapi.generated.model.Error
import com.openapi.generated.model.Widget

/**
 * The (status, body) pair `getWidget` must answer for one widget id.
 *
 * Shared by the lenient and strict `WidgetsDelegate`s, which differ only in how they turn a pair into a
 * response — and, for the `503`, in whether they can at all.
 *
 * The `id` is what discriminates: `getWidget` is one operation with five cases, and the case table gives
 * each a distinct path parameter. That makes this function both the response selector *and* the
 * assertion that the path parameter bound correctly — an `id` no case declares can only mean the
 * generated server bound something other than what the reference client sent.
 *
 * `com.openapi.generated.model.Error` is imported explicitly because it shadows `kotlin.Error`.
 */
fun widgetCase(id: String): Pair<Int, Any> = when (id) {
    "w1" -> 200 to Widget(id = "w1", name = "Sprocket", price = 9.99)
    "bad" -> 400 to Error(message = "Invalid widget id", code = 400)
    "missing" -> 404 to Error(message = "Widget not found", code = 404)
    "boom" -> 500 to Error(message = "Internal error", code = 500)
    "other" -> 503 to Error(message = "Unexpected error", code = 503)
    else -> throw GoastMismatch("getWidget.id was <$id>, which no case declares")
}

/**
 * Asserts that exactly one of `styleMatrix`'s three query parameters arrived, carrying `["a", "b"]`.
 *
 * The three cases (`form` exploded, `form` unexploded, `spaceDelimited`) each send one parameter and all
 * declare the same `200` response, so which one arrived is the only thing that distinguishes them —
 * and the decoded value is the whole point: `formUnexploded=a,b` and `spaceDelimited=a b` must both
 * arrive as two items, and a server that splits only on commas gets the second one wrong.
 *
 * The "exactly one" check is not ceremony: it catches a parameter emitted into the wrong slot, and it
 * distinguishes "absent" from "present but empty" in its own message, which is the difference between a
 * server that dropped a parameter and one that failed to decode it.
 */
fun styleMatrixCase(
    formExploded: List<String>?,
    formUnexploded: List<String>?,
    spaceDelimited: List<String>?,
) {
    val present = listOf(
        "formExploded" to formExploded,
        "formUnexploded" to formUnexploded,
        "spaceDelimited" to spaceDelimited,
    ).filter { it.second != null }

    if (present.size != 1) {
        throw GoastMismatch(
            "styleMatrix expected exactly one non-null parameter but got " +
                "formExploded=<$formExploded> formUnexploded=<$formUnexploded> spaceDelimited=<$spaceDelimited>",
        )
    }

    val (name, values) = present.single()
    expectParam("styleMatrix.$name", listOf("a", "b"), values)
}
