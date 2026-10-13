package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Payload(
    @Schema
    @param:JsonProperty("id")
    @get:JsonProperty("id")
    val id: String? = null,

    @Schema
    @param:JsonProperty("name")
    @get:JsonProperty("name")
    val name: String? = null
)
