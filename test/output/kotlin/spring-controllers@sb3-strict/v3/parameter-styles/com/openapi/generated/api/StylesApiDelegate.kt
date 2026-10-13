package com.openapi.generated.api

import com.openapi.generated.api.StylesApi.DeepObjectResponseEntity
import com.openapi.generated.api.StylesApi.FormArrayNoExplodeResponseEntity
import com.openapi.generated.api.StylesApi.FormArrayResponseEntity
import com.openapi.generated.api.StylesApi.FormObjectResponseEntity
import com.openapi.generated.api.StylesApi.LabelPathResponseEntity
import com.openapi.generated.api.StylesApi.MatrixPathResponseEntity
import com.openapi.generated.api.StylesApi.PipeDelimitedResponseEntity
import com.openapi.generated.api.StylesApi.SimpleHeaderResponseEntity
import com.openapi.generated.api.StylesApi.SimplePathResponseEntity
import com.openapi.generated.api.StylesApi.SpaceDelimitedResponseEntity
import com.openapi.generated.model.Schema12
import com.openapi.generated.model.Schema5
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface StylesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun formArray(tags: List<String>?): FormArrayResponseEntity<*> {
        return FormArrayResponseEntity.notImplemented()
    }

    suspend fun formArrayNoExplode(tags: List<String>?): FormArrayNoExplodeResponseEntity<*> {
        return FormArrayNoExplodeResponseEntity.notImplemented()
    }

    suspend fun formObject(coordinates: Schema5?): FormObjectResponseEntity<*> {
        return FormObjectResponseEntity.notImplemented()
    }

    suspend fun spaceDelimited(tags: List<String>?): SpaceDelimitedResponseEntity<*> {
        return SpaceDelimitedResponseEntity.notImplemented()
    }

    suspend fun pipeDelimited(tags: List<String>?): PipeDelimitedResponseEntity<*> {
        return PipeDelimitedResponseEntity.notImplemented()
    }

    suspend fun deepObject(filter: Schema12?): DeepObjectResponseEntity<*> {
        return DeepObjectResponseEntity.notImplemented()
    }

    suspend fun simplePath(values: List<String>): SimplePathResponseEntity<*> {
        return SimplePathResponseEntity.notImplemented()
    }

    suspend fun labelPath(values: List<String>): LabelPathResponseEntity<*> {
        return LabelPathResponseEntity.notImplemented()
    }

    suspend fun matrixPath(values: List<String>): MatrixPathResponseEntity<*> {
        return MatrixPathResponseEntity.notImplemented()
    }

    suspend fun simpleHeader(xTags: List<String>?): SimpleHeaderResponseEntity<*> {
        return SimpleHeaderResponseEntity.notImplemented()
    }
}
