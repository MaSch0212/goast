package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class FormBodyRequest(
    @Schema
    @param:JsonProperty("username")
    @get:JsonProperty("username")
    val username: String? = null,

    @Schema
    @param:JsonProperty("age")
    @get:JsonProperty("age")
    val age: Int? = null,

    @Schema
    @param:JsonProperty("subscribed")
    @get:JsonProperty("subscribed")
    val subscribed: Boolean? = null
)
