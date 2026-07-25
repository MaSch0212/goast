package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class DiscriminatorPropertyNotRequiredA(
    @Schema
    @param:JsonProperty("aValue")
    @get:JsonProperty("aValue")
    val aValue: String? = null
) : DiscriminatorPropertyNotRequired
