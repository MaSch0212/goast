package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class EnumWithEmptyString(val value: String) {
    @JsonProperty("")
    _EMPTY(""),

    @JsonProperty("one")
    ONE("one"),

    @JsonProperty("two")
    TWO("two");

    companion object {
        fun fromValue(value: String): EnumWithEmptyString? =
            when(value) {
                "" -> _EMPTY
                "one" -> ONE
                "two" -> TWO
                else -> null
            }
    }
}
