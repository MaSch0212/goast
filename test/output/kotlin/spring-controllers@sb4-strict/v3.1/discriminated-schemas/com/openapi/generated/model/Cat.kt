package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonPropertyDescription
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

/**
 * @param huntingSkill The measured skill for hunting
 */
data class Cat(
    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    override val name: String,

    @field:Valid
    @Schema(required = true, description = "The measured skill for hunting")
    @param:JsonProperty("huntingSkill", required = true)
    @get:JsonProperty("huntingSkill", required = true)
    @get:JsonPropertyDescription("The measured skill for hunting")
    val huntingSkill: Schema9 = Schema9.LAZY,

    @Schema(required = true)
    @param:JsonProperty("petType", required = true)
    @get:JsonProperty("petType", required = true)
    override val petType: String = "cat"
) : Pet
