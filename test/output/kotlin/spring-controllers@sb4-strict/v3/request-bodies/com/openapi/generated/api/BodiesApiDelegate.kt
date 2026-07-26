package com.openapi.generated.api

import com.openapi.generated.api.BodiesApi.AnyBodyResponseEntity
import com.openapi.generated.api.BodiesApi.ArrayJsonBodyResponseEntity
import com.openapi.generated.api.BodiesApi.BinaryBodyResponseEntity
import com.openapi.generated.api.BodiesApi.DescribedBodyResponseEntity
import com.openapi.generated.api.BodiesApi.FormBodyResponseEntity
import com.openapi.generated.api.BodiesApi.InlineJsonBodyResponseEntity
import com.openapi.generated.api.BodiesApi.JsonBodyResponseEntity
import com.openapi.generated.api.BodiesApi.MultiContentBodyResponseEntity
import com.openapi.generated.api.BodiesApi.OptionalJsonBodyResponseEntity
import com.openapi.generated.api.BodiesApi.PrimitiveJsonBodyResponseEntity
import com.openapi.generated.api.BodiesApi.RefBodyResponseEntity
import com.openapi.generated.api.BodiesApi.TextBodyResponseEntity
import com.openapi.generated.model.FormBodyRequest
import com.openapi.generated.model.InlineJsonBodyRequest
import com.openapi.generated.model.Payload
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import reactor.core.publisher.Flux
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface BodiesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun jsonBody(payload: Payload): JsonBodyResponseEntity<*> {
        return JsonBodyResponseEntity.notImplemented()
    }

    suspend fun optionalJsonBody(payload: Payload?): OptionalJsonBodyResponseEntity<*> {
        return OptionalJsonBodyResponseEntity.notImplemented()
    }

    suspend fun inlineJsonBody(inlineJsonBodyRequest: InlineJsonBodyRequest): InlineJsonBodyResponseEntity<*> {
        return InlineJsonBodyResponseEntity.notImplemented()
    }

    suspend fun arrayJsonBody(listPayload: Flux<Payload>): ArrayJsonBodyResponseEntity<*> {
        return ArrayJsonBodyResponseEntity.notImplemented()
    }

    suspend fun primitiveJsonBody(string: String): PrimitiveJsonBodyResponseEntity<*> {
        return PrimitiveJsonBodyResponseEntity.notImplemented()
    }

    suspend fun textBody(string: String): TextBodyResponseEntity<*> {
        return TextBodyResponseEntity.notImplemented()
    }

    suspend fun binaryBody(string: String): BinaryBodyResponseEntity<*> {
        return BinaryBodyResponseEntity.notImplemented()
    }

    suspend fun anyBody(body: Any): AnyBodyResponseEntity<*> {
        return AnyBodyResponseEntity.notImplemented()
    }

    suspend fun multiContentBody(payload: Payload): MultiContentBodyResponseEntity<*> {
        return MultiContentBodyResponseEntity.notImplemented()
    }

    suspend fun formBody(formBodyRequest: FormBodyRequest): FormBodyResponseEntity<*> {
        return FormBodyResponseEntity.notImplemented()
    }

    suspend fun describedBody(payload: Payload): DescribedBodyResponseEntity<*> {
        return DescribedBodyResponseEntity.notImplemented()
    }

    suspend fun refBody(payload: Payload): RefBodyResponseEntity<*> {
        return RefBodyResponseEntity.notImplemented()
    }
}
