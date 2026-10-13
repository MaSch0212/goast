package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class NestedInlineObjectMiddle(
    @field:Valid
    @Schema
    @param:JsonProperty("inner")
    @get:JsonProperty("inner")
    val inner: NestedInlineObjectMiddleInner? = null
)
