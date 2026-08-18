package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import java.time.OffsetDateTime

data class AllOfTwoRefs(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema
    @param:JsonProperty("name")
    @get:JsonProperty("name")
    val name: String? = null,

    @Schema
    @param:JsonProperty("createdAt")
    @get:JsonProperty("createdAt")
    val createdAt: OffsetDateTime? = null
)
