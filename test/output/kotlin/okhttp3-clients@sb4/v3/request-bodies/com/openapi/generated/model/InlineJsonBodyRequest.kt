package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class InlineJsonBodyRequest(
    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    val name: String,

    @Schema
    @param:JsonProperty("count")
    @get:JsonProperty("count")
    val count: Int? = null
)
