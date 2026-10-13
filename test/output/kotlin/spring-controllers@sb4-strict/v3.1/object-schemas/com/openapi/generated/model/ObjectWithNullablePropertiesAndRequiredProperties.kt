package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class ObjectWithNullablePropertiesAndRequiredProperties(
    @Schema(required = true)
    @param:JsonProperty("a", required = true)
    @get:JsonProperty("a", required = true)
    val a: String?,

    @Schema(required = true)
    @param:JsonProperty("b", required = true)
    @get:JsonProperty("b", required = true)
    val b: Int?,

    @Schema(required = true)
    @param:JsonProperty("c", required = true)
    @get:JsonProperty("c", required = true)
    val c: Double?,

    @Schema(required = true)
    @param:JsonProperty("d", required = true)
    @get:JsonProperty("d", required = true)
    val d: Boolean?,

    @Schema(required = true)
    @param:JsonProperty("e", required = true)
    @get:JsonProperty("e", required = true)
    val e: List<Any?>?,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("f", required = true)
    @get:JsonProperty("f", required = true)
    val f: ObjectWithNullablePropertiesAndRequiredPropertiesF?
)
