package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class NestedInlineObject(
    @field:Valid
    @Schema
    @param:JsonProperty("middle")
    @get:JsonProperty("middle")
    val middle: NestedInlineObjectMiddle? = null
)
