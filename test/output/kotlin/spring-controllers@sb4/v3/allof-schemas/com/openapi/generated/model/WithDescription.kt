package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonClassDescription
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

/**
 * A schema combined via allOf that also carries its own title and description.
 */
@JsonClassDescription("A schema combined via allOf that also carries its own title and description.")
data class WithDescription(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema
    @param:JsonProperty("name")
    @get:JsonProperty("name")
    val name: String? = null
)
