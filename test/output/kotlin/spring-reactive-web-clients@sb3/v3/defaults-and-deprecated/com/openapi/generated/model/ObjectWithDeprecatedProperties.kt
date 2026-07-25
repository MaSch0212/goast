package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonPropertyDescription
import io.swagger.v3.oas.annotations.media.Schema

/**
 * @param withDesc This property is deprecated.
 */
data class ObjectWithDeprecatedProperties(
    @Schema(description = "This property is deprecated.", deprecated = true)
    @param:JsonProperty("withDesc")
    @get:JsonProperty("withDesc")
    @get:JsonPropertyDescription("This property is deprecated.")
    @Deprecated("")
    val withDesc: String? = null,

    @Schema(deprecated = true)
    @param:JsonProperty("noDesc")
    @get:JsonProperty("noDesc")
    @Deprecated("")
    val noDesc: String? = null
)
