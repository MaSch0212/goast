package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class DiscriminatorWithEnumAlpha(
    @Schema
    @param:JsonProperty("alphaValue")
    @get:JsonProperty("alphaValue")
    val alphaValue: String? = null,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: DiscriminatorWithEnumKind = DiscriminatorWithEnumKind.ALPHA
) : DiscriminatorWithEnum
