package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class NullableEnum(val value: String) {
    @JsonProperty("one")
    ONE("one"),

    @JsonProperty("two")
    TWO("two"),

    @JsonProperty("three")
    THREE("three");

    companion object {
        fun fromValue(value: String): NullableEnum? =
            when(value) {
                "one" -> ONE
                "two" -> TWO
                "three" -> THREE
                else -> null
            }
    }
}
