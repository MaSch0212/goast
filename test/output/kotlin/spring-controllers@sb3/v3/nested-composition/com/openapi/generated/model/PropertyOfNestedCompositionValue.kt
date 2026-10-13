package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class PropertyOfNestedCompositionValue(
    @Schema
    @param:JsonProperty("x")
    @get:JsonProperty("x")
    val x: String? = null,

    @Schema
    @param:JsonProperty("y")
    @get:JsonProperty("y")
    val y: Int? = null,

    @Schema
    @param:JsonProperty("extra")
    @get:JsonProperty("extra")
    val extra: String? = null
)
