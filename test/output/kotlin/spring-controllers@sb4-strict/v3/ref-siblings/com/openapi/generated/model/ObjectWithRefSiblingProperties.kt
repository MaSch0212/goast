package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonPropertyDescription
import io.swagger.v3.oas.annotations.media.Schema

/**
 * @param first The first property's own description.
 * @param second The second property's own description.
 */
data class ObjectWithRefSiblingProperties(
    @Schema(description = "The first property's own description.")
    @param:JsonProperty("first")
    @get:JsonProperty("first")
    @get:JsonPropertyDescription("The first property's own description.")
    val first: String? = null,

    @Schema(description = "The second property's own description.")
    @param:JsonProperty("second")
    @get:JsonProperty("second")
    @get:JsonPropertyDescription("The second property's own description.")
    val second: String? = null
)
