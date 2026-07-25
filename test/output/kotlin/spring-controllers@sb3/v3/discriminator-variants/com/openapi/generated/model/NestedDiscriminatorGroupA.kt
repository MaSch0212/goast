package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class NestedDiscriminatorGroupA(
    @Schema
    @param:JsonProperty("groupAValue")
    @get:JsonProperty("groupAValue")
    val groupAValue: String? = null
) : NestedDiscriminatorGroup
