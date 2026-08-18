package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class PetUpdate(
    @Schema
    @param:JsonProperty("name")
    @get:JsonProperty("name")
    val name: String? = null,

    @Schema
    @param:JsonProperty("age")
    @get:JsonProperty("age")
    val age: Int? = null
)
