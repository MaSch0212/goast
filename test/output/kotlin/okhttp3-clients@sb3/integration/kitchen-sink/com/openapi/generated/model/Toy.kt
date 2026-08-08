package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Toy(
    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    val name: String,

    @Schema
    @param:JsonProperty("durable")
    @get:JsonProperty("durable")
    val durable: Boolean? = null
)
