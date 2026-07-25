package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class EnumWithNumericStrings(val value: String) {
    @JsonProperty("1")
    ("1"),

    @JsonProperty("2")
    ("2");

    companion object {
        fun fromValue(value: String): EnumWithNumericStrings? =
            when(value) {
                "1" ->
                "2" ->
                else -> null
            }
    }
}
