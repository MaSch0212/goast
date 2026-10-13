package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class OtherThing(
    @Schema(required = true)
    @param:JsonProperty("code", required = true)
    @get:JsonProperty("code", required = true)
    val code: Int,

    @Schema
    @param:JsonProperty("note")
    @get:JsonProperty("note")
    val note: String? = null
)
