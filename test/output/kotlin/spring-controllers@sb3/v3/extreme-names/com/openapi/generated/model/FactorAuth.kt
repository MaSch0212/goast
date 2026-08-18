package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class FactorAuth(
    @Schema
    @param:JsonProperty("markerTwoFactorAuth")
    @get:JsonProperty("markerTwoFactorAuth")
    val markerTwoFactorAuth: String? = null
)
