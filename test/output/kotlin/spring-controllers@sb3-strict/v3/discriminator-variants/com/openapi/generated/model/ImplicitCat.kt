package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ImplicitCat(
    @Schema
    @param:JsonProperty("lives")
    @get:JsonProperty("lives")
    val lives: Int? = null,

    @Schema(required = true)
    @param:JsonProperty("petType", required = true)
    @get:JsonProperty("petType", required = true)
    override val petType: String = "ImplicitCat"
) : ImplicitBase
