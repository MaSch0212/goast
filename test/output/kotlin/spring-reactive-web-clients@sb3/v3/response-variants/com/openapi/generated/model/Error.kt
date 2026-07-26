package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Error(
    @Schema(required = true)
    @param:JsonProperty("message", required = true)
    @get:JsonProperty("message", required = true)
    val message: String,

    @Schema
    @param:JsonProperty("code")
    @get:JsonProperty("code")
    val code: Int? = null
)
