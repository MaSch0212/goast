package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class PartialMappingFirst(
    @Schema
    @param:JsonProperty("firstValue")
    @get:JsonProperty("firstValue")
    val firstValue: String? = null,

    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: String = "first"
) : PartialMapping
