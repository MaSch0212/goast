package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.time.OffsetDateTime

data class Timestamps(
    @Schema
    @param:JsonProperty("createdAt")
    @get:JsonProperty("createdAt")
    val createdAt: OffsetDateTime? = null
)
