package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface WidgetsApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getWidget(id: String): ResponseEntity<Any> {
        return ResponseEntity(HttpStatus.NOT_IMPLEMENTED)
    }
}
