package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Address(
    @Schema
    @param:JsonProperty("street")
    @get:JsonProperty("street")
    val street: String? = null,

    @Schema
    @param:JsonProperty("city")
    @get:JsonProperty("city")
    val city: String? = null
)
