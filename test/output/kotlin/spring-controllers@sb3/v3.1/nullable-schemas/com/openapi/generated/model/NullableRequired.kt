package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class NullableRequired(
    @Schema(required = true)
    @param:JsonProperty("value", required = true)
    @get:JsonProperty("value", required = true)
    val value: String?
)
