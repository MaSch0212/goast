package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class DiscriminatorWithEnumBeta(
    @Schema
    @param:JsonProperty("betaValue")
    @get:JsonProperty("betaValue")
    val betaValue: String? = null,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: DiscriminatorWithEnumKind = DiscriminatorWithEnumKind.BETA
) : DiscriminatorWithEnum
