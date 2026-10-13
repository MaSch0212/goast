package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class Schema10(val value: String) {
    @JsonProperty("one")
    ONE("one"),

    @JsonProperty("two")
    TWO("two"),

    @JsonProperty("three")
    THREE("three");

    companion object {
        fun fromValue(value: String): Schema10? =
            when(value) {
                "one" -> ONE
                "two" -> TWO
                "three" -> THREE
                else -> null
            }
    }
}
