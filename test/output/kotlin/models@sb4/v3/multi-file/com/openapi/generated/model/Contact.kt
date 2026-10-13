package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Contact(
    @Schema
    @param:JsonProperty("email")
    @get:JsonProperty("email")
    val email: String? = null,

    @Schema
    @param:JsonProperty("phone")
    @get:JsonProperty("phone")
    val phone: String? = null
)
