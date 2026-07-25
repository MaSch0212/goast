package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonPropertyDescription
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Min

/**
 * @param packSize the size of the pack the dog is from
 */
data class Dog(
    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    override val name: String,

    @get:Min(value = 0)
    @Schema(required = true, description = "the size of the pack the dog is from")
    @param:JsonProperty("packSize", required = true)
    @get:JsonProperty("packSize", required = true)
    @get:JsonPropertyDescription("the size of the pack the dog is from")
    val packSize: Int = 0,

    @Schema(required = true)
    @param:JsonProperty("petType", required = true)
    @get:JsonProperty("petType", required = true)
    override val petType: String = "dog"
) : Pet
