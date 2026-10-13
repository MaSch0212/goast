package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid

data class ObjectWithPropertiesAllOf(
    @Schema(required = true)
    @param:JsonProperty("a", required = true)
    @get:JsonProperty("a", required = true)
    val a: String,

    @Schema(required = true)
    @param:JsonProperty("b", required = true)
    @get:JsonProperty("b", required = true)
    val b: Int,

    @Schema(required = true)
    @param:JsonProperty("c", required = true)
    @get:JsonProperty("c", required = true)
    val c: Double,

    @Schema(required = true)
    @param:JsonProperty("d", required = true)
    @get:JsonProperty("d", required = true)
    val d: Boolean,

    @Schema(required = true)
    @param:JsonProperty("e", required = true)
    @get:JsonProperty("e", required = true)
    val e: List<Any?>,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("f", required = true)
    @get:JsonProperty("f", required = true)
    val f: ObjectWithPropertiesAllOfF,

    @Schema(required = true)
    @param:JsonProperty("g", required = true)
    @get:JsonProperty("g", required = true)
    val g: String,

    @Schema(required = true)
    @param:JsonProperty("h", required = true)
    @get:JsonProperty("h", required = true)
    val h: Int,

    @Schema(required = true)
    @param:JsonProperty("i", required = true)
    @get:JsonProperty("i", required = true)
    val i: Double,

    @Schema(required = true)
    @param:JsonProperty("j", required = true)
    @get:JsonProperty("j", required = true)
    val j: Boolean,

    @Schema(required = true)
    @param:JsonProperty("k", required = true)
    @get:JsonProperty("k", required = true)
    val k: List<Any?>,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("l", required = true)
    @get:JsonProperty("l", required = true)
    val l: Schema39,

    @Schema(required = true)
    @param:JsonProperty("m", required = true)
    @get:JsonProperty("m", required = true)
    val m: String,

    @Schema(required = true)
    @param:JsonProperty("n", required = true)
    @get:JsonProperty("n", required = true)
    val n: Int,

    @Schema(required = true)
    @param:JsonProperty("o", required = true)
    @get:JsonProperty("o", required = true)
    val o: Double,

    @Schema(required = true)
    @param:JsonProperty("p", required = true)
    @get:JsonProperty("p", required = true)
    val p: Boolean,

    @Schema(required = true)
    @param:JsonProperty("q", required = true)
    @get:JsonProperty("q", required = true)
    val q: List<Any?>,

    @field:Valid
    @Schema(required = true)
    @param:JsonProperty("r", required = true)
    @get:JsonProperty("r", required = true)
    val r: Schema46
)
