package goast.server

import com.openapi.generated.api.WidgetsApi.GetWidgetResponseEntity
import com.openapi.generated.api.WidgetsApiDelegate
import com.openapi.generated.model.Error
import com.openapi.generated.model.Widget
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap

/**
 * `WidgetsApiDelegate` for the two `-strict` units.
 *
 * One source file serves both Boot lines here, unlike the lenient flavour: the strict return type is
 * `GetWidgetResponseEntity<*>` in both, so the `Any?`/`Any` split that forces `lenient-sb3`/
 * `lenient-sb4` apart does not arise.
 *
 * `getWidget/unexpectedError` declares `503`, which only the spec's `default` response can serve, and
 * `GetWidgetResponseEntity` has no factory for it — `ok`, `badRequest`, `notFound`,
 * `internalServerError`, `unauthorized`, `forbidden` and `notImplemented` are the whole set, and the
 * primary constructor is private. So the strict flavour genuinely cannot express that case, and it says
 * so rather than substituting an available status: a substituted `500` would record a plausible-looking
 * status deviation and bury the real, structural gap.
 */
@Component
class WidgetsDelegate : WidgetsApiDelegate {
    override suspend fun getWidget(id: String): GetWidgetResponseEntity<*> {
        val (status, body) = widgetCase(id)
        return when (status) {
            200 -> GetWidgetResponseEntity.ok(
                body as Widget,
                LinkedMultiValueMap<String, String>().also { it.add("X-Rate-Limit", "42") },
            )
            400 -> GetWidgetResponseEntity.badRequest(body as Error)
            404 -> GetWidgetResponseEntity.notFound(body as Error)
            500 -> GetWidgetResponseEntity.internalServerError(body as Error)
            else -> throw GoastUnexpressible(
                "getWidget cannot answer $status: strictResponseEntities generates no factory for the " +
                    "spec's `default` response, and GetWidgetResponseEntity's constructor is private",
            )
        }
    }
}
