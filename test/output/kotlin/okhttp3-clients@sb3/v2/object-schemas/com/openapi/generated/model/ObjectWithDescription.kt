package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonClassDescription
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonPropertyDescription
import io.swagger.v3.oas.annotations.media.Schema

/**
 * My Object Description
 *
 * @param a My Property Description
 * @param b My Property Description
 * With Multiple Lines
 */
@JsonClassDescription("My Object Description")
data class ObjectWithDescription(
    @Schema(description = "My Property Description")
    @param:JsonProperty("a")
    @get:JsonProperty("a")
    @get:JsonPropertyDescription("My Property Description")
    val a: String? = null,

    @Schema(description = "My Property Description\nWith Multiple Lines\n")
    @param:JsonProperty("b")
    @get:JsonProperty("b")
    @get:JsonPropertyDescription("My Property Description\nWith Multiple Lines\n")
    val b: Int? = null
)
