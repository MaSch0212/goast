package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class NestedDiscriminatorGroupB(
    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: String,

    @Schema
    @param:JsonProperty("groupBValue")
    @get:JsonProperty("groupBValue")
    val groupBValue: String? = null,

    @Schema(required = true)
    @param:JsonProperty("groupKind", required = true)
    @get:JsonProperty("groupKind", required = true)
    override val groupKind: String = "NestedDiscriminatorGroupB"
) : NestedDiscriminatorGroup
