package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class EnumWithNumericStrings(val value: String) {
    @JsonProperty("1")
    _1("1"),

    @JsonProperty("2")
    _2("2");

    companion object {
        fun fromValue(value: String): EnumWithNumericStrings? =
            when(value) {
                "1" -> _1
                "2" -> _2
                else -> null
            }
    }
}
