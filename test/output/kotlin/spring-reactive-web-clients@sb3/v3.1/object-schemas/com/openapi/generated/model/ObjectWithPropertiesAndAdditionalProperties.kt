package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonAnyGetter
import com.fasterxml.jackson.annotation.JsonAnySetter
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class ObjectWithPropertiesAndAdditionalProperties(
    @Schema
    @param:JsonProperty("a")
    @get:JsonProperty("a")
    val a: String? = null,

    @Schema
    @param:JsonProperty("b")
    @get:JsonProperty("b")
    val b: Int? = null,

    @Schema
    @param:JsonProperty("c")
    @get:JsonProperty("c")
    val c: Double? = null,

    @Schema
    @param:JsonProperty("d")
    @get:JsonProperty("d")
    val d: Boolean? = null,

    @Schema
    @param:JsonProperty("e")
    @get:JsonProperty("e")
    val e: List<Any?>? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("f")
    @get:JsonProperty("f")
    val f: ObjectWithPropertiesAndAdditionalPropertiesF? = null
) {
    @JsonIgnore
    val additionalProperties: MutableMap<String, String> = mutableMapOf()

    @JsonAnySetter
    fun set(name: String, value: String) {
        this.additionalProperties[name] = value
    }

    @JsonAnyGetter
    fun getMap(): Map<String, String> {
        return this.additionalProperties
    }
}
