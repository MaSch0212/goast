package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class Ticket(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema
    @param:JsonProperty("statuses")
    @get:JsonProperty("statuses")
    val statuses: List<Status>? = listOf(Status.OPEN),

    @Schema
    @param:JsonProperty("tags")
    @get:JsonProperty("tags")
    val tags: List<String>? = listOf("new")
)
