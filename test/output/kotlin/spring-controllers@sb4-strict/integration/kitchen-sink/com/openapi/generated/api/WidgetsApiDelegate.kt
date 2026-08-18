package com.openapi.generated.api

import com.openapi.generated.api.WidgetsApi.GetWidgetResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface WidgetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getWidget(id: String): GetWidgetResponseEntity<*> {
        return GetWidgetResponseEntity.notImplemented()
    }
}
