package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class ObjectWithReferencesInProperties(
    @field:Valid
    @Schema
    @param:JsonProperty("a")
    @get:JsonProperty("a")
    val a: EmptyObject? = null,

    @Schema
    @param:JsonProperty("b")
    @get:JsonProperty("b")
    val b: String? = null,

    @Schema
    @param:JsonProperty("c")
    @get:JsonProperty("c")
    val c: String? = null,

    @Schema
    @param:JsonProperty("d")
    @get:JsonProperty("d")
    val d: String? = null
)
