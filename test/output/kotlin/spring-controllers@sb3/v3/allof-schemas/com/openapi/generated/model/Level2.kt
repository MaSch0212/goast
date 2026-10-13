package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Level2(
    @Schema
    @param:JsonProperty("level1Value")
    @get:JsonProperty("level1Value")
    val level1Value: String? = null,

    @Schema
    @param:JsonProperty("level2Value")
    @get:JsonProperty("level2Value")
    val level2Value: String? = null
)
