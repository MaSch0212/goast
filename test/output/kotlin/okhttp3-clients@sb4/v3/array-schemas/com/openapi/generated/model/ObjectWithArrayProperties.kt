package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ObjectWithArrayProperties(
    @Schema
    @param:JsonProperty("strings")
    @get:JsonProperty("strings")
    val strings: List<String>? = null,

    @Schema
    @param:JsonProperty("refs")
    @get:JsonProperty("refs")
    val refs: List<List<String>>? = null,

    @Schema
    @param:JsonProperty("nested")
    @get:JsonProperty("nested")
    val nested: List<List<String>>? = null
)
