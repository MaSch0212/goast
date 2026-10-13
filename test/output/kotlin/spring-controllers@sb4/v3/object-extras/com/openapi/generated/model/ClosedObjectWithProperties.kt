package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ClosedObjectWithProperties(
    @Schema
    @param:JsonProperty("a")
    @get:JsonProperty("a")
    val a: String? = null,

    @Schema
    @param:JsonProperty("b")
    @get:JsonProperty("b")
    val b: Int? = null
)
