package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class RefsSharedInArray(
    @Schema
    @param:JsonProperty("things")
    @get:JsonProperty("things")
    val things: List<SharedThing>? = null
)
