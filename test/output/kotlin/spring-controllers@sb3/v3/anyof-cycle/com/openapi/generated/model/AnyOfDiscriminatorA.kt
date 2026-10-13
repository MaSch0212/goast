package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class AnyOfDiscriminatorA(
    @Schema
    @param:JsonProperty("bValue")
    @get:JsonProperty("bValue")
    override val bValue: String? = null,

    @Schema
    @param:JsonProperty("aValue")
    @get:JsonProperty("aValue")
    override val aValue: String? = null,

    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: String = "AnyOfDiscriminatorA"
) : AnyOfDiscriminator
