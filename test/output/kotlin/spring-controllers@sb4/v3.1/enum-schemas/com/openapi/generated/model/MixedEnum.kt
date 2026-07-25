package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class MixedEnum(val value: String) {
    @JsonProperty("one")
    ONE("one"),

    @JsonProperty("2")
    ("2"),

    @JsonProperty("true")
    TRUE("true"),

    @JsonProperty("null")
    NULL("null");

    companion object {
        fun fromValue(value: String): MixedEnum? =
            when(value) {
                "one" -> ONE
                "2" ->
                "true" -> TRUE
                "null" -> NULL
                else -> null
            }
    }
}
