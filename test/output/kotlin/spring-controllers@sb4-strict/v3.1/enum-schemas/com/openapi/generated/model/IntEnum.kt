package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class IntEnum(val value: String) {
    @JsonProperty("1")
    ("1"),

    @JsonProperty("2")
    ("2"),

    @JsonProperty("3")
    ("3");

    companion object {
        fun fromValue(value: String): IntEnum? =
            when(value) {
                "1" ->
                "2" ->
                "3" ->
                else -> null
            }
    }
}
