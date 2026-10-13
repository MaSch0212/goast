package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ImplicitDog(
    @Schema
    @param:JsonProperty("breed")
    @get:JsonProperty("breed")
    val breed: String? = null,

    @Schema(required = true)
    @param:JsonProperty("petType", required = true)
    @get:JsonProperty("petType", required = true)
    override val petType: String = "ImplicitDog"
) : ImplicitBase
