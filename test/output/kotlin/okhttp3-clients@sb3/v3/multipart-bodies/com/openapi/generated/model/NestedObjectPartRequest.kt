package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class NestedObjectPartRequest(
    @Schema
    @param:JsonProperty("author")
    @get:JsonProperty("author")
    val author: String? = null,

    @Schema
    @param:JsonProperty("version")
    @get:JsonProperty("version")
    val version: Int? = null
)
