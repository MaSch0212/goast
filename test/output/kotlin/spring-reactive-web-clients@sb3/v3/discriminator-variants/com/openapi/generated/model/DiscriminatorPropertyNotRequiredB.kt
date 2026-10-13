package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class DiscriminatorPropertyNotRequiredB(
    @Schema
    @param:JsonProperty("bValue")
    @get:JsonProperty("bValue")
    val bValue: String? = null,

    @Schema
    @param:JsonProperty("kind")
    @get:JsonProperty("kind")
    override val kind: String? = "DiscriminatorPropertyNotRequiredB"
) : DiscriminatorPropertyNotRequired
