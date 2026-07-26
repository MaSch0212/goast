package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class ParamSchema(val value: String) {
    @JsonProperty("one")
    ONE("one"),

    @JsonProperty("two")
    TWO("two"),

    @JsonProperty("three")
    THREE("three");

    companion object {
        fun fromValue(value: String): ParamSchema? =
            when(value) {
                "one" -> ONE
                "two" -> TWO
                "three" -> THREE
                else -> null
            }
    }
}
