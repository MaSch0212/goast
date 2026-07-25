package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class DiscriminatorWithEnumBeta(
    @Schema
    @param:JsonProperty("betaValue")
    @get:JsonProperty("betaValue")
    val betaValue: String? = null
) : DiscriminatorWithEnum
