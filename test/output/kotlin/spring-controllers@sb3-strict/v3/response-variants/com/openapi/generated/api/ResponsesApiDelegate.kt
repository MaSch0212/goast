package com.openapi.generated.api

import com.openapi.generated.api.ResponsesApi.ArrayResponseResponseEntity
import com.openapi.generated.api.ResponsesApi.EmptyBody200ResponseEntity
import com.openapi.generated.api.ResponsesApi.ErrorCodesResponseEntity
import com.openapi.generated.api.ResponsesApi.MixedExactAndRangeResponseEntity
import com.openapi.generated.api.ResponsesApi.MultiContentResponseResponseEntity
import com.openapi.generated.api.ResponsesApi.NoContentResponseEntity
import com.openapi.generated.api.ResponsesApi.OnlyDefaultResponseEntity
import com.openapi.generated.api.ResponsesApi.PrimitiveResponseResponseEntity
import com.openapi.generated.api.ResponsesApi.RangeCodesResponseEntity
import com.openapi.generated.api.ResponsesApi.RefResponseResponseEntity
import com.openapi.generated.api.ResponsesApi.SuccessAndDefaultResponseEntity
import com.openapi.generated.api.ResponsesApi.TwoSuccessCodesResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface ResponsesApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun twoSuccessCodes(): TwoSuccessCodesResponseEntity<*> {
        return TwoSuccessCodesResponseEntity.notImplemented()
    }

    suspend fun successAndDefault(): SuccessAndDefaultResponseEntity<*> {
        return SuccessAndDefaultResponseEntity.notImplemented()
    }

    suspend fun onlyDefault(): OnlyDefaultResponseEntity<*> {
        return OnlyDefaultResponseEntity.notImplemented()
    }

    suspend fun noContent(): NoContentResponseEntity<*> {
        return NoContentResponseEntity.notImplemented()
    }

    suspend fun emptyBody200(): EmptyBody200ResponseEntity<*> {
        return EmptyBody200ResponseEntity.notImplemented()
    }

    suspend fun rangeCodes(): RangeCodesResponseEntity<*> {
        return RangeCodesResponseEntity.notImplemented()
    }

    suspend fun mixedExactAndRange(): MixedExactAndRangeResponseEntity<*> {
        return MixedExactAndRangeResponseEntity.notImplemented()
    }

    suspend fun errorCodes(): ErrorCodesResponseEntity<*> {
        return ErrorCodesResponseEntity.notImplemented()
    }

    suspend fun multiContentResponse(): MultiContentResponseResponseEntity<*> {
        return MultiContentResponseResponseEntity.notImplemented()
    }

    suspend fun primitiveResponse(): PrimitiveResponseResponseEntity<*> {
        return PrimitiveResponseResponseEntity.notImplemented()
    }

    suspend fun arrayResponse(): ArrayResponseResponseEntity<*> {
        return ArrayResponseResponseEntity.notImplemented()
    }

    suspend fun refResponse(): RefResponseResponseEntity<*> {
        return RefResponseResponseEntity.notImplemented()
    }
}
