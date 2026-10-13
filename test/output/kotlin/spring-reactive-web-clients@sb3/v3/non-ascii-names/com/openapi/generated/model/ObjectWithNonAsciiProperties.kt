package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ObjectWithNonAsciiProperties(
    @Schema
    @param:JsonProperty("größe")
    @get:JsonProperty("größe")
    val grE: Double? = null,

    @Schema
    @param:JsonProperty("日本語")
    @get:JsonProperty("日本語")
    val : String? = null,

    @Schema
    @param:JsonProperty("naïve")
    @get:JsonProperty("naïve")
    val naVe: Boolean? = null
)
