package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ObjectWithDefaults(
    @Schema
    @param:JsonProperty("a")
    @get:JsonProperty("a")
    val a: String? = "hello",

    @Schema
    @param:JsonProperty("b")
    @get:JsonProperty("b")
    val b: Int? = 42,

    @Schema
    @param:JsonProperty("c")
    @get:JsonProperty("c")
    val c: Boolean? = true
)
