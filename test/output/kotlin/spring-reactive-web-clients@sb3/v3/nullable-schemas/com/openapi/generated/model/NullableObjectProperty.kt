package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class NullableObjectProperty(
    @field:Valid
    @Schema
    @param:JsonProperty("value")
    @get:JsonProperty("value")
    val value: NullableObjectPropertyValue? = null
)
