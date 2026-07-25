package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class NestedDiscriminatorGroupB(
    @Schema
    @param:JsonProperty("groupBValue")
    @get:JsonProperty("groupBValue")
    val groupBValue: String? = null
) : NestedDiscriminatorGroup
