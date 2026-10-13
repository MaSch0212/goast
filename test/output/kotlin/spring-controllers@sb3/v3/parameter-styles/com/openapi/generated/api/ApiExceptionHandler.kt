package com.openapi.generated.api

import org.springframework.http.ResponseEntity

interface ApiExceptionHandler {
    /**
     * Handler for API exceptions.
     *
     * @param exception Exception that has been thrown by the API.
     * @return Response entity.
     */
    suspend fun handleApiException(exception: Throwable): ResponseEntity<*>
}
