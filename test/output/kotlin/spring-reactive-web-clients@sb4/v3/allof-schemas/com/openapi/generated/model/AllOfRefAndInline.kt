package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class AllOfRefAndInline(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema
    @param:JsonProperty("name")
    @get:JsonProperty("name")
    val name: String? = null,

    @Schema
    @param:JsonProperty("tag")
    @get:JsonProperty("tag")
    val tag: String? = null
)
