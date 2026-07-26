package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class ObjectWithReservedProperties(
    @Schema
    @param:JsonProperty("class")
    @get:JsonProperty("class")
    val class: String? = null,

    @Schema
    @param:JsonProperty("val")
    @get:JsonProperty("val")
    val val: String? = null,

    @Schema
    @param:JsonProperty("is")
    @get:JsonProperty("is")
    val is: String? = null,

    @Schema
    @param:JsonProperty("in")
    @get:JsonProperty("in")
    val in: String? = null,

    @Schema
    @param:JsonProperty("function")
    @get:JsonProperty("function")
    val function: String? = null,

    @Schema
    @param:JsonProperty("default")
    @get:JsonProperty("default")
    val default: String? = null,

    @Schema
    @param:JsonProperty("constructor")
    @get:JsonProperty("constructor")
    val constructor: String? = null,

    @Schema
    @param:JsonProperty("prototype")
    @get:JsonProperty("prototype")
    val prototype: String? = null,

    @Schema
    @param:JsonProperty("this")
    @get:JsonProperty("this")
    val this: String? = null
)
