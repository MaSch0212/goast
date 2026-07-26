package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class RootSchema(
    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    val name: String,

    @field:Valid
    @Schema
    @param:JsonProperty("address")
    @get:JsonProperty("address")
    val address: RootSchemaAddress? = null,

    @Schema
    @param:JsonProperty("tags")
    @get:JsonProperty("tags")
    val tags: List<String>? = null
)
