package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class PartialMappingThird(
    @Schema
    @param:JsonProperty("thirdValue")
    @get:JsonProperty("thirdValue")
    val thirdValue: String? = null
) : PartialMapping
