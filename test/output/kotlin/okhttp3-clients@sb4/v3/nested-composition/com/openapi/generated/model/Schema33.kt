package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Schema33(
    @Schema
    @param:JsonProperty("kind")
    @get:JsonProperty("kind")
    val kind: String? = null,

    @Schema
    @param:JsonProperty("text")
    @get:JsonProperty("text")
    val text: String? = null,

    @Schema
    @param:JsonProperty("number")
    @get:JsonProperty("number")
    val number: Int? = null
)
