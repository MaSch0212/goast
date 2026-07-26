package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class Thing(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema(required = true)
    @param:JsonProperty("label", required = true)
    @get:JsonProperty("label", required = true)
    val label: String,

    @field:Valid
    @Schema
    @param:JsonProperty("category")
    @get:JsonProperty("category")
    val category: Category? = null
)
