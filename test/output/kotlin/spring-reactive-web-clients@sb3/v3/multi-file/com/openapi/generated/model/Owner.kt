package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class Owner(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    val name: String,

    @field:Valid
    @Schema
    @param:JsonProperty("contact")
    @get:JsonProperty("contact")
    val contact: Contact? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("pet")
    @get:JsonProperty("pet")
    val pet: Pet? = null
)
