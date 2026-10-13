package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class UsesShared(
    @field:Valid
    @Schema
    @param:JsonProperty("thing")
    @get:JsonProperty("thing")
    val thing: SharedThing? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("status")
    @get:JsonProperty("status")
    val status: SharedEnum? = null
)
