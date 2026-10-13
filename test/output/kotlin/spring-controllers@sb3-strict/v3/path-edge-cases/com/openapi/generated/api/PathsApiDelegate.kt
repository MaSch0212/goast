package com.openapi.generated.api

import com.openapi.generated.api.PathsApi.CaseVarietyResponseEntity
import com.openapi.generated.api.PathsApi.OverlapLiteralResponseEntity
import com.openapi.generated.api.PathsApi.OverlapTemplatedResponseEntity
import com.openapi.generated.api.PathsApi.ParamOnlyPathResponseEntity
import com.openapi.generated.api.PathsApi.ThreeParamsResponseEntity
import com.openapi.generated.api.PathsApi.TrailingSlashResponseEntity
import com.openapi.generated.api.PathsApi.VeryDeepPathResponseEntity
import com.openapi.generated.api.PathsApi.WithAtResponseEntity
import com.openapi.generated.api.PathsApi.WithColonResponseEntity
import com.openapi.generated.api.PathsApi.WithDashResponseEntity
import com.openapi.generated.api.PathsApi.WithDotResponseEntity
import com.openapi.generated.api.PathsApi.WithTildeResponseEntity
import com.openapi.generated.api.PathsApi.WithUnderscoreResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface PathsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun overlapTemplated(id: String): OverlapTemplatedResponseEntity<*> {
        return OverlapTemplatedResponseEntity.notImplemented()
    }

    suspend fun overlapLiteral(): OverlapLiteralResponseEntity<*> {
        return OverlapLiteralResponseEntity.notImplemented()
    }

    suspend fun withDot(): WithDotResponseEntity<*> {
        return WithDotResponseEntity.notImplemented()
    }

    suspend fun withDash(): WithDashResponseEntity<*> {
        return WithDashResponseEntity.notImplemented()
    }

    suspend fun withUnderscore(): WithUnderscoreResponseEntity<*> {
        return WithUnderscoreResponseEntity.notImplemented()
    }

    suspend fun withTilde(): WithTildeResponseEntity<*> {
        return WithTildeResponseEntity.notImplemented()
    }

    suspend fun withColon(): WithColonResponseEntity<*> {
        return WithColonResponseEntity.notImplemented()
    }

    suspend fun withAt(): WithAtResponseEntity<*> {
        return WithAtResponseEntity.notImplemented()
    }

    suspend fun trailingSlash(): TrailingSlashResponseEntity<*> {
        return TrailingSlashResponseEntity.notImplemented()
    }

    suspend fun paramOnlyPath(id: String): ParamOnlyPathResponseEntity<*> {
        return ParamOnlyPathResponseEntity.notImplemented()
    }

    suspend fun threeParams(
        p1: String,
        p2: String,
        p3: String
    ): ThreeParamsResponseEntity<*> {
        return ThreeParamsResponseEntity.notImplemented()
    }

    suspend fun caseVariety(): CaseVarietyResponseEntity<*> {
        return CaseVarietyResponseEntity.notImplemented()
    }

    suspend fun veryDeepPath(): VeryDeepPathResponseEntity<*> {
        return VeryDeepPathResponseEntity.notImplemented()
    }
}
